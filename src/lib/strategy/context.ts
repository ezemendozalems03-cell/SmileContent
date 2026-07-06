import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { buildBrandContext, type BrandContext } from "@/lib/ai/brand-context";
import { buildStrategySnapshot, renderSnapshot, type StrategySnapshot } from "@/lib/strategy/snapshot";

type Supabase = SupabaseClient<Database>;

export type StrategyContext = {
  brand: BrandContext;
  snapshot: StrategySnapshot;
  /** Texto para el mensaje de usuario: snapshot + reglas + objetivos + frecuencia + campañas. */
  situacionText: string;
  /** Pilares válidos del cliente (para mapear nombre → id al guardar). */
  pillars: { id: string; name: string }[];
};

/**
 * Contexto completo que el motor estratégico le pasa a la IA:
 * memoria de marca (system, cacheable) + situación actual (snapshot, reglas,
 * objetivos, frecuencia, campañas) que cambia por pedido y va en el user turn.
 */
export async function loadStrategyContext(
  supabase: Supabase,
  clientId: string,
): Promise<StrategyContext | { error: string }> {
  const brand = await buildBrandContext(supabase, clientId);
  if ("error" in brand) return brand;

  const [snapshot, rulesRes, objectivesRes, settingsRes, campaignsRes, pillarsRes] =
    await Promise.all([
      buildStrategySnapshot(supabase, clientId),
      supabase
        .from("strategy_rules")
        .select("regla, categoria")
        .eq("client_id", clientId)
        .eq("activo", true)
        .order("created_at", { ascending: true }),
      supabase
        .from("client_objectives")
        .select("objetivo, prioridad")
        .eq("client_id", clientId)
        .eq("activo", true)
        .order("prioridad", { ascending: false }),
      supabase.from("strategy_settings").select("*").eq("client_id", clientId).maybeSingle(),
      supabase
        .from("campaigns")
        .select("name, description, start_date, end_date")
        .eq("client_id", clientId)
        .eq("is_active", true),
      supabase
        .from("pillars")
        .select("id, name")
        .or(`client_id.eq.${clientId},client_id.is.null`)
        .order("name"),
    ]);

  let text = renderSnapshot(snapshot);

  const objectives = objectivesRes.data ?? [];
  text += "\n# Objetivos del cliente (por prioridad)\n";
  if (objectives.length > 0) {
    for (const o of objectives) text += `- [prioridad ${o.prioridad}/5] ${o.objetivo}\n`;
  } else {
    text += "- (sin objetivos configurados; usar los de la memoria de marca)\n";
  }

  const rules = rulesRes.data ?? [];
  text += "\n# Reglas estratégicas (OBLIGATORIAS, respetarlas siempre)\n";
  if (rules.length > 0) {
    for (const r of rules) text += `- [${r.categoria}] ${r.regla}\n`;
  } else {
    text += "- (sin reglas configuradas)\n";
  }

  const settings = settingsRes.data;
  text += "\n# Frecuencia objetivo configurada\n";
  if (settings) {
    text += `- Posts por semana: ${settings.posts_semanales}\n`;
    text += `- Reels por semana: ${settings.reels_semanales}\n`;
    text += `- Historias por semana: ${settings.historias_semanales}\n`;
    if (settings.notas) text += `- Notas: ${settings.notas}\n`;
  } else {
    text += "- (sin configurar; asumir 3 posts, 1 reel y 5 historias semanales)\n";
  }

  const campaigns = campaignsRes.data ?? [];
  if (campaigns.length > 0) {
    text += "\n# Campañas activas\n";
    for (const c of campaigns) {
      text += `- ${c.name}${c.start_date ? ` (${c.start_date} → ${c.end_date ?? "?"})` : ""}${c.description ? `: ${c.description}` : ""}\n`;
    }
  }

  const pillars = pillarsRes.data ?? [];
  text += "\n# Pilares disponibles (usar EXACTAMENTE estos nombres en el campo `pilar`)\n";
  for (const p of pillars) text += `- ${p.name}\n`;

  return { brand, snapshot, situacionText: text, pillars };
}

/** Mapea el nombre de pilar devuelto por la IA al id real (case-insensitive). */
export function pilarIdByName(
  pillars: { id: string; name: string }[],
  name: string | null | undefined,
): string | null {
  if (!name) return null;
  const target = name.trim().toLowerCase();
  return pillars.find((p) => p.name.trim().toLowerCase() === target)?.id ?? null;
}
