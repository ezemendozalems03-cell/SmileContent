import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import type {
  BrandExample,
  BrandLearning,
  BrandMemory,
  BrandProduct,
  BrandVisualIdentity,
  BrandVoice,
} from "@/lib/types/domain";

type Supabase = SupabaseClient<Database>;

export type BrandContext = {
  clientName: string;
  contextText: string;
  /** true si existe al menos la ficha general de brand_memory. */
  hasMemory: boolean;
  products: Pick<BrandProduct, "id" | "nombre" | "kind">[];
};

function section(title: string, body: string | null | undefined): string {
  const trimmed = (body ?? "").trim();
  if (!trimmed) return "";
  return `## ${title}\n${trimmed}\n`;
}

function field(label: string, value: string | null | undefined): string {
  const v = (value ?? "").trim();
  return v ? `- ${label}: ${v}\n` : "";
}

function list(label: string, values: string[] | null | undefined): string {
  if (!values || values.length === 0) return "";
  return `- ${label}: ${values.join(", ")}\n`;
}

function productBlock(p: BrandProduct): string {
  let out = `### ${p.nombre}${p.kind === "servicio" ? " (servicio)" : ""}\n`;
  out += field("Descripcion", p.descripcion);
  out += list("Beneficios", p.beneficios);
  out += list("Caracteristicas", p.caracteristicas);
  out += list("Diferenciales", p.diferenciales);
  out += field("Precio", p.precio);
  out += field("Promociones", p.promociones);
  out += field("Publico objetivo", p.publico_objetivo);
  return out;
}

function exampleBlock(e: BrandExample, index: number): string {
  let out = `### Ejemplo ${index + 1}: ${e.titulo} (${e.tipo_contenido})\n`;
  out += field("Hook", e.hook);
  out += field("Guion", e.guion);
  out += field("Copy", e.copy);
  out += field("CTA", e.cta);
  out += list("Hashtags", e.hashtags);
  out += field("Notas", e.notas);
  return out;
}

/**
 * Carga toda la memoria de marca de un cliente y la compila en un bloque de
 * texto estable (mismo orden siempre) que se inyecta como system prompt.
 * El orden deterministico importa: permite que el prompt caching de la API
 * reutilice el contexto entre generaciones consecutivas del mismo cliente.
 *
 * Usa el supabase client del usuario autenticado, asi RLS decide el acceso.
 */
export async function buildBrandContext(
  supabase: Supabase,
  clientId: string,
): Promise<BrandContext | { error: string }> {
  const [
    clientRes,
    memoryRes,
    voiceRes,
    visualRes,
    productsRes,
    learningsRes,
    examplesRes,
    pillarsRes,
    subpillarsRes,
    recentRes,
  ] = await Promise.all([
    supabase.from("clients").select("id, name, rubro").eq("id", clientId).maybeSingle(),
    supabase.from("brand_memory").select("*").eq("client_id", clientId).maybeSingle(),
    supabase.from("brand_voice").select("*").eq("client_id", clientId).maybeSingle(),
    supabase.from("brand_visual_identity").select("*").eq("client_id", clientId).maybeSingle(),
    supabase
      .from("brand_products")
      .select("*")
      .eq("client_id", clientId)
      .eq("activo", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("brand_learning")
      .select("*")
      .eq("client_id", clientId)
      .eq("activo", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("brand_examples")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("pillars")
      .select("id, name, client_id")
      .or(`client_id.eq.${clientId},client_id.is.null`)
      .order("name"),
    supabase.from("subpillars").select("id, name, pillar_id").order("name"),
    supabase
      .from("content_items")
      .select("titulo, tipo_contenido, hook, copy, cta, status")
      .eq("client_id", clientId)
      .in("status", ["aprobado", "programado", "publicado", "medido"])
      .order("fecha_publicacion", { ascending: false, nullsFirst: false })
      .limit(5),
  ]);

  if (clientRes.error || !clientRes.data) {
    return { error: "No se encontro el cliente o no tenes acceso." };
  }

  const client = clientRes.data;
  const memory = (memoryRes.data ?? null) as BrandMemory | null;
  const voice = (voiceRes.data ?? null) as BrandVoice | null;
  const visual = (visualRes.data ?? null) as BrandVisualIdentity | null;
  const products = (productsRes.data ?? []) as BrandProduct[];
  const learnings = (learningsRes.data ?? []) as BrandLearning[];
  const examples = (examplesRes.data ?? []) as BrandExample[];
  const pillars = pillarsRes.data ?? [];
  const subpillars = subpillarsRes.data ?? [];
  const recent = recentRes.data ?? [];

  let ctx = `# Memoria de marca: ${memory?.nombre_comercial || client.name}\n\n`;

  // --- Informacion general -------------------------------------------------
  let general = "";
  general += field("Nombre comercial", memory?.nombre_comercial ?? client.name);
  general += field("Rubro", memory?.rubro ?? client.rubro);
  general += field("Descripcion", memory?.descripcion);
  general += field("Historia", memory?.historia);
  general += field("Mision", memory?.mision);
  general += field("Vision", memory?.vision);
  general += list("Valores", memory?.valores);
  ctx += section("Informacion general", general);

  // --- Publico objetivo -----------------------------------------------------
  let audience = "";
  audience += field("Edad", memory?.publico_edad);
  audience += field("Pais", memory?.publico_pais);
  audience += field("Ciudad", memory?.publico_ciudad);
  audience += field("Nivel socioeconomico", memory?.publico_nivel_socioeconomico);
  audience += list("Problemas", memory?.publico_problemas);
  audience += list("Deseos", memory?.publico_deseos);
  audience += list("Objeciones", memory?.publico_objeciones);
  audience += list("Intereses", memory?.publico_intereses);
  audience += field("Lenguaje que usa el publico", memory?.publico_lenguaje);
  ctx += section("Publico objetivo", audience);

  // --- Identidad de comunicacion ---------------------------------------------
  let voiceTxt = "";
  voiceTxt += field("Tono", voice?.tono);
  voiceTxt += field("Personalidad", voice?.personalidad);
  voiceTxt += field("Nivel de formalidad", voice?.nivel_formalidad);
  voiceTxt += list("Emojis permitidos", voice?.emojis_permitidos);
  voiceTxt += list("Emojis PROHIBIDOS", voice?.emojis_prohibidos);
  voiceTxt += list("Palabras permitidas", voice?.palabras_permitidas);
  voiceTxt += list("Palabras PROHIBIDAS (no usar nunca)", voice?.palabras_prohibidas);
  voiceTxt += list("Frases tipicas de la marca", voice?.frases_tipicas);
  voiceTxt += list("CTA habituales", voice?.ctas_habituales);
  ctx += section("Identidad de comunicacion", voiceTxt);

  // --- Identidad visual -------------------------------------------------------
  let visualTxt = "";
  visualTxt += field("Logo", visual?.logo_descripcion);
  visualTxt += list("Colores", visual?.colores);
  visualTxt += list("Tipografias", visual?.tipografias);
  visualTxt += field("Estilo fotografico", visual?.estilo_fotografico);
  visualTxt += field("Estilo grafico", visual?.estilo_grafico);
  visualTxt += field("Estilo de carruseles", visual?.estilo_carruseles);
  visualTxt += field("Estilo de historias", visual?.estilo_historias);
  visualTxt += field("Estilo de reels", visual?.estilo_reels);
  ctx += section("Identidad visual", visualTxt);

  // --- Productos y servicios ---------------------------------------------------
  if (products.length > 0) {
    ctx += "## Productos y servicios\n";
    for (const p of products) ctx += productBlock(p);
    ctx += "\n";
  }

  // --- Pilares de contenido ------------------------------------------------------
  if (pillars.length > 0) {
    let pillarsTxt = "";
    for (const p of pillars) {
      const subs = subpillars.filter((s) => s.pillar_id === p.id).map((s) => s.name);
      pillarsTxt += `- ${p.name}${subs.length ? ` (subpilares: ${subs.join(", ")})` : ""}\n`;
    }
    ctx += section("Pilares de contenido", pillarsTxt);
  }

  // --- Redes / competidores / objetivos --------------------------------------------
  let redes = "";
  redes += field("Instagram", memory?.red_instagram);
  redes += field("Facebook", memory?.red_facebook);
  redes += field("TikTok", memory?.red_tiktok);
  redes += field("Sitio web", memory?.red_sitio_web);
  redes += field("WhatsApp", memory?.red_whatsapp);
  ctx += section("Redes sociales", redes);
  ctx += section("Competidores", list("Competidores", memory?.competidores));
  ctx += section("Objetivos de marketing", list("Objetivos", memory?.objetivos_marketing));

  // --- Aprendizajes ------------------------------------------------------------------
  if (learnings.length > 0) {
    let learnTxt = "";
    for (const l of learnings) learnTxt += `- [${l.categoria}] ${l.contenido}\n`;
    ctx += section("Aprendizajes (reglas acumuladas, respetarlas SIEMPRE)", learnTxt);
  }

  // --- Ejemplos aprobados ---------------------------------------------------------------
  if (examples.length > 0) {
    ctx +=
      "## Publicaciones aprobadas (referencia de estilo)\n" +
      "Estudia el estilo, estructura y voz de estos ejemplos. NO los copies: aprende como escribe la marca.\n";
    examples.forEach((e, i) => {
      ctx += exampleBlock(e, i);
    });
    ctx += "\n";
  }

  // --- Historial reciente -----------------------------------------------------------------
  if (recent.length > 0) {
    let recentTxt = "";
    for (const r of recent) {
      recentTxt += `- [${r.tipo_contenido}] ${r.titulo}${r.hook ? ` — Hook: ${r.hook}` : ""}\n`;
    }
    ctx += section("Contenido reciente (evitar repetir temas/hooks)", recentTxt);
  }

  return {
    clientName: client.name,
    contextText: ctx,
    hasMemory: memory !== null,
    products: products.map((p) => ({ id: p.id, nombre: p.nombre, kind: p.kind })),
  };
}
