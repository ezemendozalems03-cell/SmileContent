"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { storyFormSchema } from "@/lib/validation/story";

export async function createStory(clientId: string, _prevState: unknown, formData: FormData) {
  const parsed = storyFormSchema.safeParse({
    nombre: String(formData.get("nombre") ?? ""),
    fecha: String(formData.get("fecha") ?? ""),
    hora: String(formData.get("hora") ?? ""),
    story_type_id: String(formData.get("story_type_id") ?? ""),
    objetivo: String(formData.get("objetivo") ?? ""),
    status: String(formData.get("status") ?? "idea"),
    assignee_id: String(formData.get("assignee_id") ?? ""),
    texto: String(formData.get("texto") ?? ""),
    sticker: String(formData.get("sticker") ?? ""),
    link: String(formData.get("link") ?? ""),
    cta: String(formData.get("cta") ?? ""),
    observacion: String(formData.get("observacion") ?? ""),
    respuesta_esperada: String(formData.get("respuesta_esperada") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos invalidos." };

  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stories")
    .insert({ ...parsed.data, client_id: clientId, created_by: profile?.id ?? null })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { success: true, id: data.id };
}

export async function updateStory(id: string, _prevState: unknown, formData: FormData) {
  const parsed = storyFormSchema.safeParse({
    nombre: String(formData.get("nombre") ?? ""),
    fecha: String(formData.get("fecha") ?? ""),
    hora: String(formData.get("hora") ?? ""),
    story_type_id: String(formData.get("story_type_id") ?? ""),
    objetivo: String(formData.get("objetivo") ?? ""),
    status: String(formData.get("status") ?? "idea"),
    assignee_id: String(formData.get("assignee_id") ?? ""),
    texto: String(formData.get("texto") ?? ""),
    sticker: String(formData.get("sticker") ?? ""),
    link: String(formData.get("link") ?? ""),
    cta: String(formData.get("cta") ?? ""),
    observacion: String(formData.get("observacion") ?? ""),
    respuesta_esperada: String(formData.get("respuesta_esperada") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos invalidos." };

  const supabase = await createClient();
  const { error } = await supabase.from("stories").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteStory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("stories").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}
