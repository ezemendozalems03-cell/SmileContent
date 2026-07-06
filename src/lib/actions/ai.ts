"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { buildBrandContext } from "@/lib/ai/brand-context";
import { AI_MODEL, generateStructured } from "@/lib/ai/claude";
import { STATIC_SYSTEM, buildGenerationPrompt, buildSectionPrompt } from "@/lib/ai/prompts";
import {
  aiResultSchemas,
  sectionSchema,
  type AiResult,
  type AiSection,
} from "@/lib/ai/schemas";
import { aiGenerateSchema, aiRegenerateSectionSchema } from "@/lib/validation/ai";
import type { AiContentType, ContentKind } from "@/lib/types/database.types";

/** El tipo IA más amplio se mapea al content_kind más cercano al guardar. */
const KIND_BY_AI_TYPE: Record<AiContentType, ContentKind> = {
  carrusel: "post",
  reel: "reel",
  historia: "story",
  post: "post",
  tiktok: "tiktok",
  email: "post",
  campana: "post",
};

function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "Error inesperado generando el contenido.";
}

// ---------------------------------------------------------------------------
// Generación completa
// ---------------------------------------------------------------------------

export async function generateAiContent(input: Record<string, unknown>): Promise<
  | { generationId: string; result: AiResult }
  | { error: string }
> {
  const parsed = aiGenerateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const params = parsed.data;

  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const context = await buildBrandContext(supabase, params.clientId);
  if ("error" in context) return { error: context.error };

  let productoNombre: string | null = null;
  if (params.productoId) {
    productoNombre =
      context.products.find((p) => p.id === params.productoId)?.nombre ?? null;
  }

  const userPrompt = buildGenerationPrompt({
    tipo: params.tipoContenido,
    tema: params.tema,
    objetivo: params.objetivo,
    productoNombre,
    fechaPublicacion: params.fechaPublicacion,
  });

  try {
    const generation = await generateStructured<AiResult>({
      staticSystem: STATIC_SYSTEM,
      brandContext: context.contextText,
      userPrompt,
      schema: aiResultSchemas[params.tipoContenido],
    });

    const { data: row, error: insertError } = await supabase
      .from("ai_generations")
      .insert({
        client_id: params.clientId,
        requested_by: profile?.id ?? null,
        tipo_contenido: params.tipoContenido,
        tema: params.tema,
        objetivo: params.objetivo,
        producto_id: params.productoId,
        fecha_publicacion: params.fechaPublicacion,
        modelo: generation.model,
        resultado: generation.data as unknown as Record<string, unknown>,
        status: "ok",
        input_tokens: generation.inputTokens,
        output_tokens: generation.outputTokens,
      })
      .select("id")
      .single();

    if (insertError) return { error: insertError.message };
    return { generationId: row.id, result: generation.data };
  } catch (e) {
    // Registrar el fallo también, para diagnóstico (mejor esfuerzo).
    await supabase.from("ai_generations").insert({
      client_id: params.clientId,
      requested_by: profile?.id ?? null,
      tipo_contenido: params.tipoContenido,
      tema: params.tema,
      objetivo: params.objetivo,
      producto_id: params.productoId,
      fecha_publicacion: params.fechaPublicacion,
      modelo: AI_MODEL,
      status: "error",
      error: errorMessage(e),
    });
    return { error: errorMessage(e) };
  }
}

// ---------------------------------------------------------------------------
// Regeneración de una sola sección
// ---------------------------------------------------------------------------

export async function regenerateAiSection(
  input: Record<string, unknown>,
  /** Resultado con las ediciones locales del usuario (si editó antes de regenerar). */
  editedResult?: Record<string, unknown>,
): Promise<
  | { generationId: string; result: AiResult }
  | { error: string }
> {
  const parsed = aiRegenerateSectionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const { generationId, seccion } = parsed.data;

  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: prev, error: prevError } = await supabase
    .from("ai_generations")
    .select("*")
    .eq("id", generationId)
    .maybeSingle();
  if (prevError) return { error: prevError.message };
  if (!prev || !prev.resultado) return { error: "No se encontró la generación original." };

  const context = await buildBrandContext(supabase, prev.client_id);
  if ("error" in context) return { error: context.error };

  const currentResult = (editedResult ?? prev.resultado) as unknown as AiResult;
  const productoNombre = prev.producto_id
    ? (context.products.find((p) => p.id === prev.producto_id)?.nombre ?? null)
    : null;

  const userPrompt = buildSectionPrompt({
    tipo: prev.tipo_contenido,
    tema: prev.tema,
    objetivo: prev.objetivo,
    productoNombre,
    seccion: seccion as AiSection,
    currentResult,
  });

  try {
    const generation = await generateStructured<Partial<AiResult>>({
      staticSystem: STATIC_SYSTEM,
      brandContext: context.contextText,
      userPrompt,
      schema: sectionSchema(seccion as AiSection),
    });

    const merged: AiResult = { ...currentResult, ...generation.data };

    const { data: row, error: insertError } = await supabase
      .from("ai_generations")
      .insert({
        client_id: prev.client_id,
        requested_by: profile?.id ?? null,
        tipo_contenido: prev.tipo_contenido,
        tema: prev.tema,
        objetivo: prev.objetivo,
        producto_id: prev.producto_id,
        fecha_publicacion: prev.fecha_publicacion,
        seccion_regenerada: seccion,
        modelo: generation.model,
        resultado: merged as unknown as Record<string, unknown>,
        status: "ok",
        input_tokens: generation.inputTokens,
        output_tokens: generation.outputTokens,
      })
      .select("id")
      .single();

    if (insertError) return { error: insertError.message };
    return { generationId: row.id, result: merged };
  } catch (e) {
    return { error: errorMessage(e) };
  }
}

// ---------------------------------------------------------------------------
// Guardar el resultado como content_item
// ---------------------------------------------------------------------------

/** Compone el campo `guion` legible según el tipo (slides, escenas, etc.). */
function formatGuion(tipo: AiContentType, r: AiResult): string | null {
  const lines: string[] = [];

  if (tipo === "carrusel" && r.slides) {
    r.slides.forEach((s, i) => {
      lines.push(`SLIDE ${i + 1}: ${s.titulo}`);
      lines.push(s.texto);
      lines.push(`Visual: ${s.idea_visual}`);
      lines.push("");
    });
  } else if ((tipo === "reel" || tipo === "tiktok") && (r.guion || r.escenas)) {
    if (r.guion) {
      lines.push("GUION (voz en off):", r.guion, "");
    }
    r.escenas?.forEach((e, i) => {
      lines.push(`ESCENA ${i + 1}: ${e.descripcion}`);
      if (e.texto_en_pantalla) lines.push(`Texto en pantalla: ${e.texto_en_pantalla}`);
      if (e.voz_en_off) lines.push(`Voz en off: ${e.voz_en_off}`);
      lines.push("");
    });
  } else if (tipo === "historia" && r.secuencia_historia) {
    r.secuencia_historia.forEach((h, i) => {
      lines.push(`HISTORIA ${i + 1}: ${h.descripcion}`);
      if (h.texto) lines.push(`Texto: ${h.texto}`);
      if (h.interaccion) lines.push(`Interacción: ${h.interaccion}`);
      lines.push(`Visual: ${h.idea_visual}`);
      lines.push("");
    });
    if (r.interaccion_sugerida) lines.push(`Interacción sugerida: ${r.interaccion_sugerida}`);
  } else if (tipo === "email" && r.email) {
    lines.push(`ASUNTO: ${r.email.asunto}`);
    lines.push(`PREHEADER: ${r.email.preheader}`);
    lines.push("", r.email.cuerpo);
  } else if (tipo === "campana") {
    if (r.campana_concepto) lines.push("CONCEPTO:", r.campana_concepto, "");
    r.campana_piezas?.forEach((p, i) => {
      lines.push(`PIEZA ${i + 1} [${p.tipo}]: ${p.titulo}`);
      lines.push(p.descripcion);
      lines.push("");
    });
  }

  const out = lines.join("\n").trim();
  return out ? out : null;
}

export async function saveAiGenerationAsContent(
  generationId: string,
  /** Resultado con las ediciones locales del usuario; si viene, pisa el guardado. */
  editedResult?: Record<string, unknown>,
): Promise<
  | { contentItemId: string }
  | { error: string }
> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: gen, error: genError } = await supabase
    .from("ai_generations")
    .select("*")
    .eq("id", generationId)
    .maybeSingle();
  if (genError) return { error: genError.message };
  if (!gen || !gen.resultado) return { error: "No se encontró la generación." };

  if (editedResult) {
    await supabase
      .from("ai_generations")
      .update({ resultado: editedResult })
      .eq("id", generationId);
  }

  const r = (editedResult ?? gen.resultado) as unknown as AiResult;

  const observaciones = [
    `Generado con IA (${gen.tipo_contenido}). Tema: ${gen.tema}`,
    r.notas_disenador ? `Notas para el diseñador: ${r.notas_disenador}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const { data: item, error: insertError } = await supabase
    .from("content_items")
    .insert({
      client_id: gen.client_id,
      titulo: r.titulo_interno || gen.tema,
      descripcion: gen.objetivo,
      tipo_contenido: KIND_BY_AI_TYPE[gen.tipo_contenido],
      objetivo: gen.objetivo,
      // Ya trae copy y guion completos: entra al pipeline en "guion", no "idea".
      status: "guion",
      created_by: profile?.id ?? null,
      fecha_publicacion: gen.fecha_publicacion,
      hook: r.hook,
      guion: formatGuion(gen.tipo_contenido, r),
      copy: r.copy || null,
      cta: r.cta || null,
      hashtags: r.hashtags ?? [],
      observaciones_internas: observaciones,
    })
    .select("id")
    .single();

  if (insertError) return { error: insertError.message };

  // Enlaza la generación con la publicación creada (auditoría / futuro entrenamiento).
  await supabase
    .from("ai_generations")
    .update({ content_item_id: item.id })
    .eq("id", generationId);

  revalidatePath("/content");
  revalidatePath(`/clients/${gen.client_id}/publicaciones`);
  return { contentItemId: item.id };
}
