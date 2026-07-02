"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { ideaSchema } from "@/lib/validation/idea";
import type { IdeaStatus } from "@/lib/types/database.types";

function parseIdeaFormData(formData: FormData) {
  return ideaSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    pilar_id: String(formData.get("pilar_id") ?? ""),
    subpilar_id: String(formData.get("subpilar_id") ?? ""),
    formato_id: String(formData.get("formato_id") ?? ""),
    sub_formato_id: String(formData.get("sub_formato_id") ?? ""),
    client_id: String(formData.get("client_id") ?? ""),
    tipo_contenido: String(formData.get("tipo_contenido") ?? "post"),
    status: String(formData.get("status") ?? "idea"),
    priority: String(formData.get("priority") ?? "media"),
    hook: String(formData.get("hook") ?? ""),
    guion: String(formData.get("guion") ?? ""),
    copy: String(formData.get("copy") ?? ""),
    cta: String(formData.get("cta") ?? ""),
    observaciones_internas: String(formData.get("observaciones_internas") ?? ""),
    feedback_cliente: String(formData.get("feedback_cliente") ?? ""),
    fecha_sugerida: String(formData.get("fecha_sugerida") ?? ""),
  });
}

export async function createIdea(_prevState: unknown, formData: FormData) {
  const parsed = parseIdeaFormData(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos invalidos." };

  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("ideas")
    .insert({ ...parsed.data, created_by: profile?.id ?? null });

  if (error) return { error: error.message };
  revalidatePath("/ideas");
  return { success: true };
}

export async function updateIdea(id: string, _prevState: unknown, formData: FormData) {
  const parsed = parseIdeaFormData(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos invalidos." };

  const supabase = await createClient();
  const { error } = await supabase.from("ideas").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/ideas");
  return { success: true };
}

export async function deleteIdea(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("ideas").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/ideas");
  return { success: true };
}

export async function updateIdeaStatus(id: string, status: IdeaStatus) {
  const supabase = await createClient();
  const { error } = await supabase.from("ideas").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function promoteIdea(id: string) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: idea, error: ideaError } = await supabase
    .from("ideas")
    .select("*")
    .eq("id", id)
    .single();
  if (ideaError || !idea) return { error: "Idea no encontrada." };
  if (!idea.client_id) return { error: "Asigná un cliente a la idea antes de promoverla." };
  if (idea.promoted_content_item_id) return { error: "Esta idea ya fue promovida." };

  const { data: contentItem, error: ciError } = await supabase
    .from("content_items")
    .insert({
      client_id: idea.client_id,
      titulo: idea.title,
      descripcion: idea.description,
      pilar_id: idea.pilar_id,
      subpilar_id: idea.subpilar_id,
      formato_id: idea.formato_id,
      sub_formato_id: idea.sub_formato_id,
      tipo_contenido: idea.tipo_contenido,
      hook: idea.hook,
      guion: idea.guion,
      copy: idea.copy,
      cta: idea.cta,
      priority: idea.priority,
      observaciones_internas: idea.observaciones_internas,
      status: "idea",
      created_by: profile?.id ?? null,
    })
    .select("id")
    .single();
  if (ciError) return { error: ciError.message };

  const { error: updateError } = await supabase
    .from("ideas")
    .update({ promoted_content_item_id: contentItem.id, status: "aprobado" })
    .eq("id", id);
  if (updateError) return { error: updateError.message };

  revalidatePath("/ideas");
  return { id: contentItem.id };
}
