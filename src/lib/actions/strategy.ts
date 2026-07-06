"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { buildStrategySnapshot, type StrategySnapshot } from "@/lib/strategy/snapshot";
import {
  campaignSchema,
  clientObjectiveSchema,
  strategyRuleSchema,
  strategySettingsSchema,
} from "@/lib/validation/strategy";
import type { RecommendationEstado } from "@/lib/types/database.types";

function firstIssue(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Datos inválidos.";
}

function revalidateEstrategia(clientId: string) {
  revalidatePath(`/clients/${clientId}/estrategia`);
}

/** Snapshot determinístico para el panel (queryFn de react-query). */
export async function getStrategySnapshot(
  clientId: string,
): Promise<StrategySnapshot | { error: string }> {
  const supabase = await createClient();
  try {
    return await buildStrategySnapshot(supabase, clientId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo calcular el snapshot." };
  }
}

// ---------------------------------------------------------------------------
// Frecuencia
// ---------------------------------------------------------------------------

export async function upsertStrategySettings(clientId: string, input: Record<string, unknown>) {
  const parsed = strategySettingsSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("strategy_settings")
    .upsert({ client_id: clientId, ...parsed.data }, { onConflict: "client_id" });
  if (error) return { error: error.message };
  revalidateEstrategia(clientId);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Reglas estratégicas
// ---------------------------------------------------------------------------

export async function createStrategyRule(clientId: string, input: Record<string, unknown>) {
  const parsed = strategyRuleSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { error } = await supabase.from("strategy_rules").insert({
    client_id: clientId,
    ...parsed.data,
    created_by: profile?.id ?? null,
  });
  if (error) return { error: error.message };
  revalidateEstrategia(clientId);
  return { success: true };
}

export async function toggleStrategyRule(id: string, clientId: string, activo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("strategy_rules").update({ activo }).eq("id", id);
  if (error) return { error: error.message };
  revalidateEstrategia(clientId);
  return { success: true };
}

export async function deleteStrategyRule(id: string, clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("strategy_rules").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateEstrategia(clientId);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Objetivos del cliente
// ---------------------------------------------------------------------------

export async function createClientObjective(clientId: string, input: Record<string, unknown>) {
  const parsed = clientObjectiveSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("client_objectives")
    .insert({ client_id: clientId, ...parsed.data });
  if (error) return { error: error.message };
  revalidateEstrategia(clientId);
  return { success: true };
}

export async function updateClientObjective(
  id: string,
  clientId: string,
  patch: { prioridad?: number; activo?: boolean },
) {
  const supabase = await createClient();
  const { error } = await supabase.from("client_objectives").update(patch).eq("id", id);
  if (error) return { error: error.message };
  revalidateEstrategia(clientId);
  return { success: true };
}

export async function deleteClientObjective(id: string, clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("client_objectives").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateEstrategia(clientId);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Campañas
// ---------------------------------------------------------------------------

export async function createCampaign(clientId: string, input: Record<string, unknown>) {
  const parsed = campaignSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("campaigns").insert({ client_id: clientId, ...parsed.data });
  if (error) return { error: error.message };
  revalidateEstrategia(clientId);
  return { success: true };
}

export async function updateCampaign(id: string, clientId: string, input: Record<string, unknown>) {
  const parsed = campaignSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("campaigns").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };
  revalidateEstrategia(clientId);
  return { success: true };
}

export async function toggleCampaign(id: string, clientId: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("campaigns").update({ is_active: isActive }).eq("id", id);
  if (error) return { error: error.message };
  revalidateEstrategia(clientId);
  return { success: true };
}

export async function deleteCampaign(id: string, clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("campaigns").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateEstrategia(clientId);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Recomendaciones
// ---------------------------------------------------------------------------

export async function updateRecommendationEstado(
  id: string,
  clientId: string,
  estado: RecommendationEstado,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("content_recommendations")
    .update({ estado })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidateEstrategia(clientId);
  return { success: true };
}
