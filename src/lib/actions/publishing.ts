"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import {
  createPost,
  getConnectedAccounts,
  getPostStatus,
  getSubaccounts,
  mapContentOSToBlotatoPayload,
  BLOTATO_PLATFORMS,
  type BlotatoPlatform,
  type BlotatoPostPayload,
} from "@/lib/blotato/service";
import { schedulePostSchema } from "@/lib/validation/publishing";
import type { PublishStatus } from "@/lib/types/database.types";

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Error inesperado.";
}

function revalidateContentPaths(clientId: string) {
  revalidatePath("/content");
  revalidatePath(`/clients/${clientId}/publicaciones`);
  revalidatePath(`/clients/${clientId}/calendario`);
}

// ---------------------------------------------------------------------------
// Cuentas sociales (Canales conectados)
// ---------------------------------------------------------------------------

/** Trae las cuentas conectadas en Blotato y las sincroniza en social_accounts. */
export async function syncSocialAccounts(): Promise<{ synced: number } | { error: string }> {
  const supabase = await createClient();
  try {
    const accounts = await getConnectedAccounts();
    if (accounts.length === 0) return { synced: 0 };

    // Solo columnas de datos: el upsert parcial no pisa client_id/is_active
    // (la asignación a un cliente es una decisión local, no de Blotato).
    const { error } = await supabase.from("social_accounts").upsert(
      accounts.map((a) => ({
        provider: "blotato",
        account_id: a.id,
        platform: a.platform,
        account_name: a.fullname,
        username: a.username,
      })),
      { onConflict: "provider,account_id" },
    );
    if (error) return { error: error.message };
    return { synced: accounts.length };
  } catch (e) {
    return { error: errorMessage(e) };
  }
}

/** Asigna (o desasigna con null) una cuenta social a un cliente. */
export async function assignSocialAccount(accountId: string, clientId: string | null) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("social_accounts")
    .update({ client_id: clientId })
    .eq("id", accountId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function toggleSocialAccountActive(accountId: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("social_accounts")
    .update({ is_active: isActive })
    .eq("id", accountId);
  if (error) return { error: error.message };
  return { success: true };
}

/** Páginas/subcuentas (pageId de Facebook o LinkedIn) de una cuenta conectada. */
export async function getSocialAccountPages(
  socialAccountId: string,
): Promise<{ pages: { id: string; name: string | null }[] } | { error: string }> {
  const supabase = await createClient();
  const { data: account, error } = await supabase
    .from("social_accounts")
    .select("account_id")
    .eq("id", socialAccountId)
    .maybeSingle();
  if (error) return { error: error.message };
  if (!account) return { error: "No se encontró la cuenta." };
  try {
    const subaccounts = await getSubaccounts(account.account_id);
    return { pages: subaccounts.map((s) => ({ id: s.id, name: s.name })) };
  } catch (e) {
    return { error: errorMessage(e) };
  }
}

// ---------------------------------------------------------------------------
// Archivos del contenido como URLs públicas (firmadas) para Blotato
// ---------------------------------------------------------------------------

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 días: Blotato baja el archivo al recibir el post.

export async function getContentMediaOptions(
  contentItemId: string,
): Promise<{ options: { label: string; url: string }[] } | { error: string }> {
  const supabase = await createClient();
  const { data: files, error } = await supabase
    .from("files")
    .select("file_name, storage_path, kind")
    .eq("content_item_id", contentItemId)
    .order("created_at", { ascending: false });
  if (error) return { error: error.message };

  const options: { label: string; url: string }[] = [];
  for (const file of files ?? []) {
    const { data } = await supabase.storage
      .from("content-files")
      .createSignedUrl(file.storage_path, SIGNED_URL_TTL_SECONDS);
    if (data?.signedUrl) {
      options.push({ label: `${file.file_name} (${file.kind})`, url: data.signedUrl });
    }
  }
  return { options };
}

// ---------------------------------------------------------------------------
// Programar / publicar
// ---------------------------------------------------------------------------

export async function scheduleContentPost(
  input: Record<string, unknown>,
): Promise<{ scheduledPostId: string; status: PublishStatus } | { error: string }> {
  const parsed = schedulePostSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const params = parsed.data;

  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const [{ data: item, error: itemError }, { data: account, error: accountError }] =
    await Promise.all([
      supabase
        .from("content_items")
        .select("id, client_id, status, titulo")
        .eq("id", params.contentItemId)
        .maybeSingle(),
      supabase
        .from("social_accounts")
        .select("*")
        .eq("id", params.socialAccountId)
        .maybeSingle(),
    ]);
  if (itemError) return { error: itemError.message };
  if (!item) return { error: "No se encontró la publicación." };
  if (accountError) return { error: accountError.message };
  if (!account) return { error: "No se encontró la cuenta social." };

  // Seguridad: solo contenido aprobado (o ya en programado, para reprogramar).
  if (item.status !== "aprobado" && item.status !== "programado") {
    return { error: 'Solo se puede publicar contenido en estado "Aprobado".' };
  }
  if (account.client_id !== item.client_id) {
    return { error: "Esa cuenta social no pertenece a este cliente." };
  }
  if (!account.is_active) return { error: "La cuenta social está inactiva." };
  if (!(BLOTATO_PLATFORMS as readonly string[]).includes(account.platform)) {
    return { error: `Plataforma no soportada: ${account.platform}` };
  }
  if (params.scheduledAt && new Date(params.scheduledAt).getTime() < Date.now() - 60_000) {
    return { error: "La fecha de programación ya pasó." };
  }

  const payload = mapContentOSToBlotatoPayload({
    accountId: account.account_id,
    platform: account.platform as BlotatoPlatform,
    caption: params.caption,
    mediaUrls: params.mediaUrls,
    scheduledAt: params.scheduledAt,
    extras: params.extras,
  });
  if ("error" in payload) return { error: payload.error };

  try {
    const { postSubmissionId } = await createPost(payload);
    const status: PublishStatus = params.scheduledAt ? "scheduled" : "publishing";

    const { data: row, error: insertError } = await supabase
      .from("scheduled_posts")
      .insert({
        content_item_id: item.id,
        client_id: item.client_id,
        platform: account.platform,
        social_account_id: account.id,
        scheduled_at: params.scheduledAt,
        status,
        external_provider: "blotato",
        external_submission_id: postSubmissionId,
        payload_json: payload as unknown as Record<string, unknown>,
        created_by: profile?.id ?? null,
      })
      .select("id")
      .single();
    if (insertError) return { error: insertError.message };

    await supabase
      .from("content_items")
      .update({
        status: "programado",
        publish_status: status,
        scheduled_at: params.scheduledAt,
        external_provider: "blotato",
        external_submission_id: postSubmissionId,
        ...(params.scheduledAt
          ? { fecha_publicacion: params.scheduledAt.slice(0, 10) }
          : {}),
      })
      .eq("id", item.id);

    revalidateContentPaths(item.client_id);
    return { scheduledPostId: row.id, status };
  } catch (e) {
    // Guardar también el intento fallido (auditoría, reintento manual).
    await supabase.from("scheduled_posts").insert({
      content_item_id: item.id,
      client_id: item.client_id,
      platform: account.platform,
      social_account_id: account.id,
      scheduled_at: params.scheduledAt,
      status: "failed",
      external_provider: "blotato",
      error_message: errorMessage(e),
      payload_json: payload as unknown as Record<string, unknown>,
      created_by: profile?.id ?? null,
    });
    await supabase
      .from("content_items")
      .update({ publish_status: "failed" })
      .eq("id", item.id);
    revalidateContentPaths(item.client_id);
    return { error: errorMessage(e) };
  }
}

// ---------------------------------------------------------------------------
// Consulta de estado + espejo en content_items
// ---------------------------------------------------------------------------

export async function refreshScheduledPostStatus(
  scheduledPostId: string,
): Promise<
  | { status: PublishStatus; publicUrl: string | null; errorMessage: string | null }
  | { error: string }
> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("scheduled_posts")
    .select("*")
    .eq("id", scheduledPostId)
    .maybeSingle();
  if (error) return { error: error.message };
  if (!row) return { error: "No se encontró el envío." };
  if (!row.external_submission_id) return { error: "Este envío no tiene ID externo para consultar." };
  if (row.status === "published" || row.status === "cancelled") {
    return { status: row.status, publicUrl: row.external_post_id, errorMessage: row.error_message };
  }

  try {
    const remote = await getPostStatus(row.external_submission_id);

    let status: PublishStatus = row.status;
    let publishedAt: string | null = row.published_at;
    let publicUrl: string | null = row.external_post_id;
    let errMsg: string | null = null;

    if (remote.status === "published") {
      status = "published";
      publishedAt = new Date().toISOString();
      publicUrl = remote.publicUrl ?? null;
    } else if (remote.status === "failed") {
      status = "failed";
      errMsg = remote.errorMessage ?? "Blotato reportó un error sin detalle.";
    } else {
      // in-progress: programado a futuro o publicándose ahora.
      status =
        row.scheduled_at && new Date(row.scheduled_at).getTime() > Date.now()
          ? "scheduled"
          : "publishing";
    }

    await supabase
      .from("scheduled_posts")
      .update({
        status,
        published_at: publishedAt,
        external_post_id: publicUrl,
        error_message: errMsg,
      })
      .eq("id", row.id);

    // Espejo en la publicación (y cierre del pipeline si ya salió).
    await supabase
      .from("content_items")
      .update({
        publish_status: status,
        ...(status === "published"
          ? {
              status: "publicado" as const,
              published_at: publishedAt,
              external_post_id: publicUrl,
              link_publicacion_final: publicUrl,
            }
          : {}),
      })
      .eq("id", row.content_item_id);

    revalidateContentPaths(row.client_id);
    return { status, publicUrl, errorMessage: errMsg };
  } catch (e) {
    return { error: errorMessage(e) };
  }
}

// ---------------------------------------------------------------------------
// Reintentar un envío fallido (mismo payload; si la hora ya pasó, sale ahora)
// ---------------------------------------------------------------------------

export async function retryScheduledPost(
  scheduledPostId: string,
): Promise<{ scheduledPostId: string } | { error: string }> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: row, error } = await supabase
    .from("scheduled_posts")
    .select("*")
    .eq("id", scheduledPostId)
    .maybeSingle();
  if (error) return { error: error.message };
  if (!row) return { error: "No se encontró el envío." };
  if (row.status !== "failed") return { error: "Solo se pueden reintentar envíos con error." };
  if (!row.payload_json) return { error: "El envío no tiene payload guardado para reintentar." };

  const payload = row.payload_json as unknown as BlotatoPostPayload & { scheduledTime?: string };
  const stillFuture =
    row.scheduled_at && new Date(row.scheduled_at).getTime() > Date.now() + 60_000;
  if (!stillFuture) delete payload.scheduledTime;

  try {
    const { postSubmissionId } = await createPost(payload);
    const status: PublishStatus = payload.scheduledTime ? "scheduled" : "publishing";

    const { data: newRow, error: insertError } = await supabase
      .from("scheduled_posts")
      .insert({
        content_item_id: row.content_item_id,
        client_id: row.client_id,
        platform: row.platform,
        social_account_id: row.social_account_id,
        scheduled_at: payload.scheduledTime ?? null,
        status,
        external_provider: "blotato",
        external_submission_id: postSubmissionId,
        payload_json: payload as unknown as Record<string, unknown>,
        created_by: profile?.id ?? null,
      })
      .select("id")
      .single();
    if (insertError) return { error: insertError.message };

    await supabase
      .from("content_items")
      .update({
        publish_status: status,
        scheduled_at: payload.scheduledTime ?? null,
        external_submission_id: postSubmissionId,
      })
      .eq("id", row.content_item_id);

    revalidateContentPaths(row.client_id);
    return { scheduledPostId: newRow.id };
  } catch (e) {
    return { error: errorMessage(e) };
  }
}
