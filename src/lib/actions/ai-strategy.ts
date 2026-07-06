"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { generateStructured } from "@/lib/ai/provider";
import {
  STRATEGY_SYSTEM,
  buildAnalyzePrompt,
  buildCalendarFillPrompt,
  buildIdeasPrompt,
  buildMonthlyPlanPrompt,
} from "@/lib/ai/strategy-prompts";
import {
  calendarFillSchema,
  ideasBatchSchema,
  monthlyPlanSchema,
  strategyReportSchema,
  type CalendarFillResult,
  type CalendarProposal,
  type IdeasBatchResult,
  type MonthlyPlanResult,
  type StrategyReportResult,
} from "@/lib/ai/strategy-schemas";
import { loadStrategyContext, pilarIdByName } from "@/lib/strategy/context";
import { applyProposalsSchema } from "@/lib/validation/strategy";
import type { ContentKind } from "@/lib/types/database.types";

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Error inesperado.";
}

function revalidateEstrategia(clientId: string) {
  revalidatePath(`/clients/${clientId}/estrategia`);
}

/** historia (IA) → story (content_kind); el resto coincide. */
function toContentKind(tipo: string): ContentKind {
  if (tipo === "historia" || tipo === "story") return "story";
  if (tipo === "reel") return "reel";
  if (tipo === "tiktok") return "tiktok";
  return "post";
}

// ---------------------------------------------------------------------------
// "Analizar marca"
// ---------------------------------------------------------------------------

export async function analyzeBrandStrategy(clientId: string): Promise<
  | { reportId: string; result: StrategyReportResult }
  | { error: string }
> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const ctx = await loadStrategyContext(supabase, clientId);
  if ("error" in ctx) return { error: ctx.error };

  try {
    const gen = await generateStructured<StrategyReportResult>({
      staticSystem: STRATEGY_SYSTEM,
      brandContext: ctx.brand.contextText,
      userPrompt: buildAnalyzePrompt(ctx.situacionText),
      schema: strategyReportSchema,
    });

    const { data: report, error: reportError } = await supabase
      .from("strategy_reports")
      .insert({
        client_id: clientId,
        resumen: gen.data.resumen,
        resultado: gen.data as unknown as Record<string, unknown>,
        modelo: gen.model,
        input_tokens: gen.inputTokens,
        output_tokens: gen.outputTokens,
        created_by: profile?.id ?? null,
      })
      .select("id")
      .single();
    if (reportError) return { error: reportError.message };

    // Las recomendaciones "nueva" del análisis anterior quedan obsoletas.
    await supabase
      .from("content_recommendations")
      .delete()
      .eq("client_id", clientId)
      .eq("estado", "nueva")
      .eq("origen", "ia");

    if (gen.data.recomendaciones.length > 0) {
      await supabase.from("content_recommendations").insert(
        gen.data.recomendaciones.map((r) => ({
          client_id: clientId,
          report_id: report.id,
          tipo: r.tipo,
          titulo: r.titulo,
          detalle: r.detalle,
          severidad: r.severidad,
          origen: "ia" as const,
        })),
      );
    }

    revalidateEstrategia(clientId);
    return { reportId: report.id, result: gen.data };
  } catch (e) {
    return { error: errorMessage(e) };
  }
}

// ---------------------------------------------------------------------------
// Plan mensual
// ---------------------------------------------------------------------------

export async function generateMonthlyPlanAi(
  clientId: string,
  mes: string, // "YYYY-MM"
): Promise<{ planId: string; result: MonthlyPlanResult } | { error: string }> {
  if (!/^\d{4}-\d{2}$/.test(mes)) return { error: "Mes inválido." };
  const mesDate = `${mes}-01`;

  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const ctx = await loadStrategyContext(supabase, clientId);
  if ("error" in ctx) return { error: ctx.error };

  try {
    const gen = await generateStructured<MonthlyPlanResult>({
      staticSystem: STRATEGY_SYSTEM,
      brandContext: ctx.brand.contextText,
      userPrompt: buildMonthlyPlanPrompt(ctx.situacionText, mes),
      schema: monthlyPlanSchema,
    });

    const { data: plan, error: planError } = await supabase
      .from("monthly_plans")
      .upsert(
        {
          client_id: clientId,
          mes: mesDate,
          resumen: gen.data.resumen,
          cantidad_contenidos: gen.data.cantidad_contenidos,
          resultado: gen.data as unknown as Record<string, unknown>,
          modelo: gen.model,
          input_tokens: gen.inputTokens,
          output_tokens: gen.outputTokens,
          created_by: profile?.id ?? null,
        },
        { onConflict: "client_id,mes" },
      )
      .select("id")
      .single();
    if (planError) return { error: planError.message };

    revalidateEstrategia(clientId);
    return { planId: plan.id, result: gen.data };
  } catch (e) {
    return { error: errorMessage(e) };
  }
}

/** Pasa las ideas de un plan mensual al banco de ideas. */
export async function addPlanIdeasToBank(
  planId: string,
): Promise<{ created: number } | { error: string }> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: plan, error: planError } = await supabase
    .from("monthly_plans")
    .select("*")
    .eq("id", planId)
    .maybeSingle();
  if (planError) return { error: planError.message };
  if (!plan) return { error: "No se encontró el plan." };

  const parsed = monthlyPlanSchema.safeParse(plan.resultado);
  if (!parsed.success) return { error: "El plan guardado tiene un formato inesperado." };

  const { data: pillars } = await supabase
    .from("pillars")
    .select("id, name")
    .or(`client_id.eq.${plan.client_id},client_id.is.null`);

  const mesBase = new Date(`${plan.mes}T00:00:00`);
  const rows = parsed.data.ideas.map((idea) => {
    // Fecha sugerida: lunes aproximado de la semana indicada dentro del mes.
    const dia = Math.min((Math.max(idea.semana, 1) - 1) * 7 + 1, 28);
    const fecha = new Date(mesBase);
    fecha.setDate(dia);
    return {
      client_id: plan.client_id,
      title: idea.titulo,
      description: idea.descripcion,
      pilar_id: pilarIdByName(pillars ?? [], idea.pilar),
      tipo_contenido: toContentKind(idea.tipo_contenido),
      objetivo: idea.objetivo,
      dificultad: idea.dificultad,
      tiempo_estimado: idea.tiempo_estimado,
      fecha_sugerida: fecha.toISOString().slice(0, 10),
      origen: "ia" as const,
      observaciones_internas: `Del plan mensual ${plan.mes.slice(0, 7)} (semana ${idea.semana}).`,
      created_by: profile?.id ?? null,
    };
  });

  if (rows.length === 0) return { error: "El plan no tiene ideas." };
  const { error } = await supabase.from("ideas").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/ideas");
  revalidateEstrategia(plan.client_id);
  return { created: rows.length };
}

// ---------------------------------------------------------------------------
// "Completar automáticamente" el calendario
// ---------------------------------------------------------------------------

export async function proposeCalendarFill(
  clientId: string,
  dias = 14,
): Promise<{ propuestas: CalendarProposal[] } | { error: string }> {
  const supabase = await createClient();
  const ctx = await loadStrategyContext(supabase, clientId);
  if ("error" in ctx) return { error: ctx.error };

  if (ctx.snapshot.huecosCalendario.length === 0) {
    return { error: "No hay huecos en el calendario de los próximos días." };
  }

  try {
    const gen = await generateStructured<CalendarFillResult>({
      staticSystem: STRATEGY_SYSTEM,
      brandContext: ctx.brand.contextText,
      userPrompt: buildCalendarFillPrompt(ctx.situacionText, dias),
      schema: calendarFillSchema,
    });

    // Red de seguridad: solo fechas que realmente son huecos futuros.
    const huecos = new Set(ctx.snapshot.huecosCalendario);
    const propuestas = gen.data.propuestas.filter((p) => huecos.has(p.fecha));
    if (propuestas.length === 0) {
      return { error: "La IA no generó propuestas válidas para los huecos. Intentá de nuevo." };
    }
    return { propuestas };
  } catch (e) {
    return { error: errorMessage(e) };
  }
}

export async function applyCalendarProposals(
  input: Record<string, unknown>,
): Promise<{ created: number } | { error: string }> {
  const parsed = applyProposalsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const { clientId, propuestas } = parsed.data;

  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: pillars } = await supabase
    .from("pillars")
    .select("id, name")
    .or(`client_id.eq.${clientId},client_id.is.null`);

  const rows = propuestas.map((p) => ({
    client_id: clientId,
    titulo: p.titulo,
    descripcion: p.razon || null,
    tipo_contenido: toContentKind(p.tipo_contenido),
    pilar_id: pilarIdByName(pillars ?? [], p.pilar),
    objetivo: p.objetivo || null,
    status: "idea" as const,
    fecha_publicacion: p.fecha,
    hook: p.hook_sugerido,
    observaciones_internas: "Agendado por el motor estratégico (Completar automáticamente).",
    created_by: profile?.id ?? null,
  }));

  const { error } = await supabase.from("content_items").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/content");
  revalidatePath(`/clients/${clientId}/publicaciones`);
  revalidatePath(`/clients/${clientId}/calendario`);
  revalidateEstrategia(clientId);
  return { created: rows.length };
}

// ---------------------------------------------------------------------------
// Ideas IA para el banco
// ---------------------------------------------------------------------------

export async function generateIdeasAi(
  clientId: string,
  cantidad: number,
  enfoque?: string | null,
): Promise<{ created: number } | { error: string }> {
  const n = Math.max(1, Math.min(15, Math.round(cantidad)));

  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const ctx = await loadStrategyContext(supabase, clientId);
  if ("error" in ctx) return { error: ctx.error };

  try {
    const gen = await generateStructured<IdeasBatchResult>({
      staticSystem: STRATEGY_SYSTEM,
      brandContext: ctx.brand.contextText,
      userPrompt: buildIdeasPrompt(ctx.situacionText, n, enfoque),
      schema: ideasBatchSchema,
    });

    const rows = gen.data.ideas.slice(0, n).map((idea) => ({
      client_id: clientId,
      title: idea.titulo,
      description: idea.descripcion,
      pilar_id: pilarIdByName(ctx.pillars, idea.pilar),
      tipo_contenido: toContentKind(idea.tipo_contenido),
      objetivo: idea.objetivo,
      dificultad: idea.dificultad,
      tiempo_estimado: idea.tiempo_estimado,
      hook: idea.hook,
      cta: idea.cta,
      origen: "ia" as const,
      created_by: profile?.id ?? null,
    }));

    if (rows.length === 0) return { error: "La IA no devolvió ideas. Intentá de nuevo." };
    const { error } = await supabase.from("ideas").insert(rows);
    if (error) return { error: error.message };

    revalidatePath("/ideas");
    revalidateEstrategia(clientId);
    return { created: rows.length };
  } catch (e) {
    return { error: errorMessage(e) };
  }
}
