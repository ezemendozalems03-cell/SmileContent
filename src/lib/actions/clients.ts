"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";
import { extractAndSaveBrandbook, readBrandbookFile, readBrandbookText } from "@/lib/ai/brandbook";
import { clientFormSchema } from "@/lib/validation/client";

function nullIfEmpty(value: string) {
  return value.trim() === "" ? null : value.trim();
}

function parseClientForm(formData: FormData) {
  const raw = {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    rubro: String(formData.get("rubro") ?? ""),
    status: String(formData.get("status") ?? "activo"),
    plan_contratado: String(formData.get("plan_contratado") ?? ""),
    fecha_inicio: String(formData.get("fecha_inicio") ?? ""),
    instagram_url: String(formData.get("instagram_url") ?? ""),
    tiktok_url: String(formData.get("tiktok_url") ?? ""),
    brand_manual_url: String(formData.get("brand_manual_url") ?? ""),
    brand_typography: String(formData.get("brand_typography") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
  return clientFormSchema.safeParse(raw);
}

export async function createClientAction(_prevState: unknown, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!can(profile?.role, "manageClients")) {
    return { error: "No tenés permiso para crear clientes." };
  }

  const parsed = parseClientForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const v = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: v.name,
      slug: v.slug,
      rubro: nullIfEmpty(v.rubro ?? ""),
      status: v.status,
      plan_contratado: nullIfEmpty(v.plan_contratado ?? ""),
      fecha_inicio: nullIfEmpty(v.fecha_inicio ?? ""),
      instagram_url: nullIfEmpty(v.instagram_url ?? ""),
      tiktok_url: nullIfEmpty(v.tiktok_url ?? ""),
      brand_manual_url: nullIfEmpty(v.brand_manual_url ?? ""),
      brand_typography: nullIfEmpty(v.brand_typography ?? ""),
      notes: nullIfEmpty(v.notes ?? ""),
      primary_owner_id: profile!.id,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.code === "23505" ? "Ya existe un cliente con ese slug." : error.message };
  }

  // The creator gets automatic access via client_members.
  await supabase.from("client_members").insert({ client_id: data.id, profile_id: profile!.id });

  // Brandbook opcional (PDF adjunto o texto pegado): la IA lo lee y deja
  // cargada la Memoria de Marca. Si falla, el cliente ya quedó creado — no se
  // aborta el alta por esto.
  let brandbookLoaded = false;
  const brandbookFile = await readBrandbookFile(formData.get("brandbook"));
  const brandbookText = readBrandbookText(formData.get("brandbook_texto"));
  const brandbookSource =
    brandbookFile && !("error" in brandbookFile)
      ? brandbookFile
      : brandbookText && !("error" in brandbookText)
        ? brandbookText
        : null;
  if (brandbookSource) {
    try {
      const result = await extractAndSaveBrandbook(supabase, data.id, brandbookSource);
      brandbookLoaded = !("error" in result);
    } catch {
      brandbookLoaded = false;
    }
  }

  revalidatePath("/clients");
  // Con brandbook cargado aterriza en la Memoria de Marca (para revisarla);
  // sin brandbook, en Configuración: el paso siguiente natural es armar la
  // taxonomía del cliente (pilares, formatos, tipos de contenido).
  redirect(brandbookLoaded ? `/clients/${data.id}/memoria` : `/clients/${data.id}/configuracion`);
}

export async function updateClientAction(clientId: string, _prevState: unknown, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!can(profile?.role, "manageClients")) {
    return { error: "No tenés permiso para editar este cliente." };
  }

  const parsed = parseClientForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const v = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({
      name: v.name,
      slug: v.slug,
      rubro: nullIfEmpty(v.rubro ?? ""),
      status: v.status,
      plan_contratado: nullIfEmpty(v.plan_contratado ?? ""),
      fecha_inicio: nullIfEmpty(v.fecha_inicio ?? ""),
      instagram_url: nullIfEmpty(v.instagram_url ?? ""),
      tiktok_url: nullIfEmpty(v.tiktok_url ?? ""),
      brand_manual_url: nullIfEmpty(v.brand_manual_url ?? ""),
      brand_typography: nullIfEmpty(v.brand_typography ?? ""),
      notes: nullIfEmpty(v.notes ?? ""),
    })
    .eq("id", clientId);

  if (error) {
    return { error: error.code === "23505" ? "Ya existe un cliente con ese slug." : error.message };
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}
