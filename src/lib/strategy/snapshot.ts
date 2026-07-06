import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Supabase = SupabaseClient<Database>;

/**
 * Foto determinística del estado de contenido de un cliente. Es la mitad
 * "medible" del motor estratégico: distribución de pilares/tipos, frecuencia
 * real vs objetivo, señales de repetición y huecos del calendario. La otra
 * mitad (interpretación) la hace la IA recibiendo este snapshot en el prompt.
 */

const LOOKBACK_DAYS = 60;
const LOOKAHEAD_DAYS = 14;

export type DistribucionItem = { nombre: string; count: number; pct: number };

export type StrategySnapshot = {
  desde: string;
  hasta: string;
  totalPublicaciones: number;
  distribucionPilares: DistribucionItem[];
  distribucionTipos: DistribucionItem[];
  /** días desde la última pieza de cada tipo (null = nunca) */
  diasSinPublicar: { post: number | null; reel: number | null; tiktok: number | null; historia: number | null };
  /** promedio semanal real (últimas 4 semanas) */
  frecuenciaReal: { posts: number; reels: number; historias: number };
  /** fechas de los próximos LOOKAHEAD_DAYS días sin nada agendado */
  huecosCalendario: string[];
  /** próximos contenidos ya agendados */
  proximos: { fecha: string; titulo: string; tipo: string; pilar: string | null }[];
  /** señales de repetición (exactas, no semánticas) */
  repeticion: {
    ctasRepetidos: { texto: string; veces: number }[];
    hooksParecidos: { inicio: string; veces: number }[];
    rachaPilar: { pilar: string; veces: number } | null;
  };
  titulosRecientes: { fecha: string | null; titulo: string; tipo: string; pilar: string | null }[];
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor(Math.abs(a.getTime() - b.getTime()) / 86_400_000);
}

function distribucion(counts: Map<string, number>): DistribucionItem[] {
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  return [...counts.entries()]
    .map(([nombre, count]) => ({
      nombre,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function buildStrategySnapshot(
  supabase: Supabase,
  clientId: string,
): Promise<StrategySnapshot> {
  const hoy = new Date();
  const desde = new Date(hoy.getTime() - LOOKBACK_DAYS * 86_400_000);
  const hasta = new Date(hoy.getTime() + LOOKAHEAD_DAYS * 86_400_000);

  const [itemsRes, storiesRes, pillarsRes] = await Promise.all([
    supabase
      .from("content_items")
      .select("titulo, tipo_contenido, status, fecha_publicacion, pilar_id, hook, cta")
      .eq("client_id", clientId)
      .neq("status", "archivado")
      .gte("fecha_publicacion", isoDate(desde))
      .lte("fecha_publicacion", isoDate(hasta))
      .order("fecha_publicacion", { ascending: true }),
    supabase
      .from("stories")
      .select("fecha")
      .eq("client_id", clientId)
      .gte("fecha", isoDate(desde))
      .order("fecha", { ascending: true }),
    supabase.from("pillars").select("id, name").or(`client_id.eq.${clientId},client_id.is.null`),
  ]);

  const items = itemsRes.data ?? [];
  const stories = storiesRes.data ?? [];
  const pillarName = new Map((pillarsRes.data ?? []).map((p) => [p.id, p.name]));

  const pasados = items.filter((i) => i.fecha_publicacion && i.fecha_publicacion <= isoDate(hoy));
  const futuros = items.filter((i) => i.fecha_publicacion && i.fecha_publicacion > isoDate(hoy));

  // Distribuciones sobre lo publicado/agendado del período pasado.
  const porPilar = new Map<string, number>();
  const porTipo = new Map<string, number>();
  for (const i of pasados) {
    const pilar = i.pilar_id ? (pillarName.get(i.pilar_id) ?? "Otro") : "Sin pilar";
    porPilar.set(pilar, (porPilar.get(pilar) ?? 0) + 1);
    porTipo.set(i.tipo_contenido, (porTipo.get(i.tipo_contenido) ?? 0) + 1);
  }

  // Días sin publicar por tipo.
  function diasDesde(tipo: string): number | null {
    const ultimos = pasados.filter((i) => i.tipo_contenido === tipo);
    if (ultimos.length === 0) return null;
    const ultima = ultimos[ultimos.length - 1].fecha_publicacion!;
    return daysBetween(hoy, new Date(ultima + "T00:00:00"));
  }
  const historiasPasadas = stories.filter((s) => s.fecha <= isoDate(hoy));
  const diasSinHistoria =
    historiasPasadas.length > 0
      ? daysBetween(hoy, new Date(historiasPasadas[historiasPasadas.length - 1].fecha + "T00:00:00"))
      : null;

  // Frecuencia real: promedio semanal de las últimas 4 semanas.
  const hace28 = isoDate(new Date(hoy.getTime() - 28 * 86_400_000));
  const posts28 = pasados.filter(
    (i) => i.fecha_publicacion! >= hace28 && (i.tipo_contenido === "post"),
  ).length;
  const reels28 = pasados.filter(
    (i) => i.fecha_publicacion! >= hace28 && (i.tipo_contenido === "reel" || i.tipo_contenido === "tiktok"),
  ).length;
  const historias28 = historiasPasadas.filter((s) => s.fecha >= hace28).length;

  // Huecos del calendario próximo.
  const fechasOcupadas = new Set(futuros.map((i) => i.fecha_publicacion!));
  const huecos: string[] = [];
  for (let d = 1; d <= LOOKAHEAD_DAYS; d++) {
    const fecha = isoDate(new Date(hoy.getTime() + d * 86_400_000));
    if (!fechasOcupadas.has(fecha)) huecos.push(fecha);
  }

  // Señales de repetición exacta.
  const ctaCounts = new Map<string, number>();
  const hookCounts = new Map<string, number>();
  for (const i of pasados) {
    const cta = (i.cta ?? "").trim().toLowerCase();
    if (cta) ctaCounts.set(cta, (ctaCounts.get(cta) ?? 0) + 1);
    const inicio = (i.hook ?? "").trim().toLowerCase().split(/\s+/).slice(0, 4).join(" ");
    if (inicio) hookCounts.set(inicio, (hookCounts.get(inicio) ?? 0) + 1);
  }
  const ctasRepetidos = [...ctaCounts.entries()]
    .filter(([, v]) => v >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([texto, veces]) => ({ texto, veces }));
  const hooksParecidos = [...hookCounts.entries()]
    .filter(([, v]) => v >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([inicio, veces]) => ({ inicio, veces }));

  // Racha de pilar al final del historial (¿los últimos N son todos iguales?)
  let rachaPilar: { pilar: string; veces: number } | null = null;
  if (pasados.length >= 2) {
    const ultimo = pasados[pasados.length - 1].pilar_id;
    if (ultimo) {
      let n = 0;
      for (let i = pasados.length - 1; i >= 0 && pasados[i].pilar_id === ultimo; i--) n++;
      if (n >= 3) rachaPilar = { pilar: pillarName.get(ultimo) ?? "?", veces: n };
    }
  }

  return {
    desde: isoDate(desde),
    hasta: isoDate(hasta),
    totalPublicaciones: pasados.length,
    distribucionPilares: distribucion(porPilar),
    distribucionTipos: distribucion(porTipo),
    diasSinPublicar: {
      post: diasDesde("post"),
      reel: diasDesde("reel"),
      tiktok: diasDesde("tiktok"),
      historia: diasSinHistoria,
    },
    frecuenciaReal: {
      posts: Math.round((posts28 / 4) * 10) / 10,
      reels: Math.round((reels28 / 4) * 10) / 10,
      historias: Math.round((historias28 / 4) * 10) / 10,
    },
    huecosCalendario: huecos,
    proximos: futuros.map((i) => ({
      fecha: i.fecha_publicacion!,
      titulo: i.titulo,
      tipo: i.tipo_contenido,
      pilar: i.pilar_id ? (pillarName.get(i.pilar_id) ?? null) : null,
    })),
    repeticion: { ctasRepetidos, hooksParecidos, rachaPilar },
    titulosRecientes: pasados.slice(-20).map((i) => ({
      fecha: i.fecha_publicacion,
      titulo: i.titulo,
      tipo: i.tipo_contenido,
      pilar: i.pilar_id ? (pillarName.get(i.pilar_id) ?? null) : null,
    })),
  };
}

/** Render del snapshot como texto para el prompt (orden estable). */
export function renderSnapshot(s: StrategySnapshot): string {
  let out = `# Estado de contenido (últimos ${LOOKBACK_DAYS} días)\n\n`;
  out += `Total de publicaciones en el período: ${s.totalPublicaciones}\n\n`;

  out += "## Distribución por pilar\n";
  for (const d of s.distribucionPilares) out += `- ${d.nombre}: ${d.pct}% (${d.count})\n`;
  if (s.distribucionPilares.length === 0) out += "- (sin datos)\n";

  out += "\n## Distribución por tipo\n";
  for (const d of s.distribucionTipos) out += `- ${d.nombre}: ${d.pct}% (${d.count})\n`;
  if (s.distribucionTipos.length === 0) out += "- (sin datos)\n";

  out += "\n## Días sin publicar por tipo\n";
  for (const [tipo, dias] of Object.entries(s.diasSinPublicar)) {
    out += `- ${tipo}: ${dias === null ? "nunca publicó" : `${dias} días`}\n`;
  }

  out += `\n## Frecuencia real (promedio semanal, últimas 4 semanas)\n`;
  out += `- Posts: ${s.frecuenciaReal.posts}/sem | Reels+TikToks: ${s.frecuenciaReal.reels}/sem | Historias: ${s.frecuenciaReal.historias}/sem\n`;

  out += `\n## Calendario próximo (${LOOKAHEAD_DAYS} días)\n`;
  out += `- Días SIN contenido agendado: ${s.huecosCalendario.length ? s.huecosCalendario.join(", ") : "ninguno"}\n`;
  for (const p of s.proximos) out += `- ${p.fecha}: [${p.tipo}] ${p.titulo}${p.pilar ? ` (${p.pilar})` : ""}\n`;

  out += "\n## Señales de repetición\n";
  for (const c of s.repeticion.ctasRepetidos) out += `- CTA repetido ${c.veces} veces: "${c.texto}"\n`;
  for (const h of s.repeticion.hooksParecidos) out += `- Hooks que empiezan igual (${h.veces} veces): "${h.inicio}..."\n`;
  if (s.repeticion.rachaPilar) {
    out += `- Últimas ${s.repeticion.rachaPilar.veces} publicaciones seguidas del pilar "${s.repeticion.rachaPilar.pilar}"\n`;
  }
  if (
    s.repeticion.ctasRepetidos.length === 0 &&
    s.repeticion.hooksParecidos.length === 0 &&
    !s.repeticion.rachaPilar
  ) {
    out += "- (sin señales exactas; evaluar repetición temática con los títulos)\n";
  }

  out += "\n## Últimos títulos publicados\n";
  for (const t of s.titulosRecientes) out += `- ${t.fecha ?? "s/f"} [${t.tipo}] ${t.titulo}${t.pilar ? ` (${t.pilar})` : ""}\n`;

  return out;
}
