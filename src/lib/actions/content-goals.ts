"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import type { ContentKind } from "@/lib/types/database.types";

/**
 * The unique index on content_goals is a functional index
 * (coalesce(formato_id, zero-uuid)) so it can't be targeted via a plain
 * Postgres `ON CONFLICT (columns...)` upsert -- find-then-write instead.
 */
export async function upsertContentGoal(params: {
  clientId: string;
  year: number;
  month: number;
  tipoContenido: ContentKind;
  formatoId: string | null;
  targetCount: number;
}) {
  if (!Number.isInteger(params.targetCount) || params.targetCount < 0) {
    return { error: "El objetivo debe ser un número entero no negativo." };
  }

  const supabase = await createClient();
  let existingQuery = supabase
    .from("content_goals")
    .select("id")
    .eq("client_id", params.clientId)
    .eq("year", params.year)
    .eq("month", params.month)
    .eq("tipo_contenido", params.tipoContenido);
  existingQuery = params.formatoId
    ? existingQuery.eq("formato_id", params.formatoId)
    : existingQuery.is("formato_id", null);

  const { data: existing, error: findError } = await existingQuery.maybeSingle();
  if (findError) return { error: findError.message };

  if (existing) {
    const { error } = await supabase
      .from("content_goals")
      .update({ target_count: params.targetCount })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const profile = await getCurrentProfile();
    const { error } = await supabase.from("content_goals").insert({
      client_id: params.clientId,
      year: params.year,
      month: params.month,
      tipo_contenido: params.tipoContenido,
      formato_id: params.formatoId,
      target_count: params.targetCount,
      created_by: profile?.id ?? null,
    });
    if (error) return { error: error.message };
  }

  revalidatePath(`/clients/${params.clientId}/metricas`);
  return { success: true };
}

export async function deleteContentGoal(id: string, clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("content_goals").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/clients/${clientId}/metricas`);
  return { success: true };
}
