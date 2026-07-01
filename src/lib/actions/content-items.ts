"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import {
  contentItemDetailsSchema,
  contentItemCopySchema,
  contentItemLinksSchema,
  contentItemMetricsSchema,
  contentItemNotesSchema,
} from "@/lib/validation/content-item";
import type { ContentPriority, ContentStatus } from "@/lib/types/database.types";

export async function createDraftContentItem(clientId: string) {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("content_items")
    .insert({
      client_id: clientId,
      titulo: "Sin titulo",
      status: "idea",
      created_by: profile?.id ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}

export async function deleteContentItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("content_items").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateContentItemStatus(id: string, status: ContentStatus) {
  const supabase = await createClient();
  const { error } = await supabase.from("content_items").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateContentItemPriority(id: string, priority: ContentPriority) {
  const supabase = await createClient();
  const { error } = await supabase.from("content_items").update({ priority }).eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateContentItemAssignee(id: string, assigneeId: string | null) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("content_items")
    .update({ assignee_id: assigneeId })
    .eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateContentItem(id: string, _prevState: unknown, formData: FormData) {
  const detailsParsed = contentItemDetailsSchema.safeParse({
    titulo: String(formData.get("titulo") ?? ""),
    descripcion: String(formData.get("descripcion") ?? ""),
    formato_id: String(formData.get("formato_id") ?? ""),
    sub_formato_id: String(formData.get("sub_formato_id") ?? ""),
    pilar_id: String(formData.get("pilar_id") ?? ""),
    subpilar_id: String(formData.get("subpilar_id") ?? ""),
    tipo_contenido: String(formData.get("tipo_contenido") ?? "post"),
    objetivo: String(formData.get("objetivo") ?? ""),
    fecha_publicacion: String(formData.get("fecha_publicacion") ?? ""),
    hora_sugerida: String(formData.get("hora_sugerida") ?? ""),
  });
  if (!detailsParsed.success) {
    return { error: detailsParsed.error.issues[0]?.message ?? "Datos invalidos." };
  }

  const copyParsed = contentItemCopySchema.safeParse({
    hook: String(formData.get("hook") ?? ""),
    guion: String(formData.get("guion") ?? ""),
    copy: String(formData.get("copy") ?? ""),
    cta: String(formData.get("cta") ?? ""),
    hashtags: String(formData.get("hashtags") ?? ""),
  });
  if (!copyParsed.success) {
    return { error: copyParsed.error.issues[0]?.message ?? "Datos invalidos." };
  }

  const linksParsed = contentItemLinksSchema.safeParse({
    link_drive: String(formData.get("link_drive") ?? ""),
    link_canva: String(formData.get("link_canva") ?? ""),
    link_capcut: String(formData.get("link_capcut") ?? ""),
    link_publicacion_final: String(formData.get("link_publicacion_final") ?? ""),
  });
  if (!linksParsed.success) {
    return { error: linksParsed.error.issues[0]?.message ?? "Link invalido." };
  }

  const metricsParsed = contentItemMetricsSchema.safeParse({
    vistas: String(formData.get("vistas") ?? "0"),
    likes: String(formData.get("likes") ?? "0"),
    comentarios_count: String(formData.get("comentarios_count") ?? "0"),
    compartidos: String(formData.get("compartidos") ?? "0"),
    guardados: String(formData.get("guardados") ?? "0"),
    consultas_generadas: String(formData.get("consultas_generadas") ?? "0"),
  });
  if (!metricsParsed.success) {
    return { error: "Las metricas deben ser numeros validos." };
  }

  const notesParsed = contentItemNotesSchema.safeParse({
    observaciones_internas: String(formData.get("observaciones_internas") ?? ""),
  });

  const supabase = await createClient();
  const { error } = await supabase
    .from("content_items")
    .update({
      ...detailsParsed.data,
      ...copyParsed.data,
      ...linksParsed.data,
      ...metricsParsed.data,
      ...(notesParsed.success ? notesParsed.data : {}),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  return { success: true };
}
