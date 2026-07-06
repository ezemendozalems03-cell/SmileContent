"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  brandExampleSchema,
  brandLearningSchema,
  brandMemoryAudienceSchema,
  brandMemoryGeneralSchema,
  brandMemoryNetworksSchema,
  brandProductSchema,
  brandVisualIdentitySchema,
  brandVoiceSchema,
} from "@/lib/validation/brand-memory";

function firstIssue(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Datos inválidos.";
}

function revalidateMemoria(clientId: string) {
  revalidatePath(`/clients/${clientId}/memoria`);
}

// ---------------------------------------------------------------------------
// Fichas 1:1 (brand_memory / brand_voice / brand_visual_identity): upsert por
// client_id, así la UI nunca distingue entre "crear" y "editar".
// ---------------------------------------------------------------------------

/**
 * brand_memory se edita por secciones (pestañas General / Público / Redes).
 * Cada sección upsertea SOLO sus columnas: usar el esquema completo pisaría
 * con null/[] las secciones que esa pestaña no muestra.
 */
const BRAND_MEMORY_SECTION_SCHEMAS = {
  general: brandMemoryGeneralSchema,
  audience: brandMemoryAudienceSchema,
  networks: brandMemoryNetworksSchema,
} as const;

export async function upsertBrandMemorySection(
  clientId: string,
  section: keyof typeof BRAND_MEMORY_SECTION_SCHEMAS,
  input: Record<string, unknown>,
) {
  const schema = BRAND_MEMORY_SECTION_SCHEMAS[section];
  if (!schema) return { error: "Sección desconocida." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("brand_memory")
    .upsert({ client_id: clientId, ...parsed.data }, { onConflict: "client_id" });
  if (error) return { error: error.message };
  revalidateMemoria(clientId);
  return { success: true };
}

export async function upsertBrandVoice(clientId: string, input: Record<string, unknown>) {
  const parsed = brandVoiceSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("brand_voice")
    .upsert({ client_id: clientId, ...parsed.data }, { onConflict: "client_id" });
  if (error) return { error: error.message };
  revalidateMemoria(clientId);
  return { success: true };
}

export async function upsertBrandVisualIdentity(clientId: string, input: Record<string, unknown>) {
  const parsed = brandVisualIdentitySchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("brand_visual_identity")
    .upsert({ client_id: clientId, ...parsed.data }, { onConflict: "client_id" });
  if (error) return { error: error.message };
  revalidateMemoria(clientId);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Productos / servicios
// ---------------------------------------------------------------------------

export async function createBrandProduct(clientId: string, input: Record<string, unknown>) {
  const parsed = brandProductSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("brand_products")
    .insert({ client_id: clientId, ...parsed.data });
  if (error) return { error: error.message };
  revalidateMemoria(clientId);
  return { success: true };
}

export async function updateBrandProduct(id: string, clientId: string, input: Record<string, unknown>) {
  const parsed = brandProductSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("brand_products").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };
  revalidateMemoria(clientId);
  return { success: true };
}

export async function deleteBrandProduct(id: string, clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("brand_products").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateMemoria(clientId);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Aprendizajes
// ---------------------------------------------------------------------------

export async function createBrandLearning(clientId: string, input: Record<string, unknown>) {
  const parsed = brandLearningSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  const { error } = await supabase.from("brand_learning").insert({
    client_id: clientId,
    ...parsed.data,
    created_by: userRes.user?.id ?? null,
  });
  if (error) return { error: error.message };
  revalidateMemoria(clientId);
  return { success: true };
}

export async function toggleBrandLearning(id: string, clientId: string, activo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("brand_learning").update({ activo }).eq("id", id);
  if (error) return { error: error.message };
  revalidateMemoria(clientId);
  return { success: true };
}

export async function deleteBrandLearning(id: string, clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("brand_learning").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateMemoria(clientId);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Ejemplos aprobados
// ---------------------------------------------------------------------------

export async function createBrandExample(clientId: string, input: Record<string, unknown>) {
  const parsed = brandExampleSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  const { error } = await supabase.from("brand_examples").insert({
    client_id: clientId,
    ...parsed.data,
    created_by: userRes.user?.id ?? null,
  });
  if (error) return { error: error.message };
  revalidateMemoria(clientId);
  return { success: true };
}

export async function deleteBrandExample(id: string, clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("brand_examples").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateMemoria(clientId);
  return { success: true };
}

/**
 * "Aprobar contenido": snapshotea una publicación existente como ejemplo de
 * entrenamiento de la IA. Cuantas más publicaciones aprobadas, más parecido
 * escribe el asistente. Idempotente por el unique index sobre content_item_id.
 */
export async function approveContentAsExample(contentItemId: string) {
  const supabase = await createClient();

  const { data: item, error: itemError } = await supabase
    .from("content_items")
    .select("id, client_id, titulo, tipo_contenido, hook, guion, copy, cta, hashtags")
    .eq("id", contentItemId)
    .maybeSingle();
  if (itemError) return { error: itemError.message };
  if (!item) return { error: "No se encontró la publicación." };

  const { data: userRes } = await supabase.auth.getUser();
  const { error } = await supabase.from("brand_examples").insert({
    client_id: item.client_id,
    content_item_id: item.id,
    titulo: item.titulo,
    tipo_contenido: item.tipo_contenido,
    hook: item.hook,
    guion: item.guion,
    copy: item.copy,
    cta: item.cta,
    hashtags: item.hashtags ?? [],
    created_by: userRes.user?.id ?? null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Esta publicación ya está guardada como ejemplo." };
    }
    return { error: error.message };
  }

  revalidateMemoria(item.client_id);
  return { success: true };
}
