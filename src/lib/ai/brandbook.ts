import "server-only";

import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { generateStructured } from "@/lib/ai/provider";

type Supabase = SupabaseClient<Database>;

/**
 * Extraccion de un brandbook PDF → Memoria de Marca completa.
 *
 * El esquema espeja las columnas de brand_memory / brand_voice /
 * brand_visual_identity / brand_products. Mismas reglas de structured outputs
 * que schemas.ts: strictObject, null-unions en strings, arrays siempre
 * presentes (vacios = "el PDF no lo menciona").
 */

const s = z.union([z.string(), z.null()]);
const arr = z.array(z.string());

const productoSchema = z.strictObject({
  nombre: z.string(),
  kind: z.enum(["producto", "servicio"]),
  descripcion: s,
  beneficios: arr,
  caracteristicas: arr,
  diferenciales: arr,
  precio: s,
  promociones: s,
  publico_objetivo: s,
});

export const brandbookExtractionSchema = z.strictObject({
  // General (brand_memory)
  nombre_comercial: s,
  rubro: s,
  descripcion: s,
  historia: s,
  mision: s,
  vision: s,
  valores: arr,
  // Público objetivo (brand_memory)
  publico_edad: s,
  publico_pais: s,
  publico_ciudad: s,
  publico_nivel_socioeconomico: s,
  publico_problemas: arr,
  publico_deseos: arr,
  publico_objeciones: arr,
  publico_intereses: arr,
  publico_lenguaje: s,
  // Redes / competidores / objetivos (brand_memory)
  red_instagram: s,
  red_facebook: s,
  red_tiktok: s,
  red_sitio_web: s,
  red_whatsapp: s,
  competidores: arr,
  objetivos_marketing: arr,
  // Identidad de comunicación (brand_voice)
  tono: s,
  personalidad: s,
  nivel_formalidad: s,
  emojis_permitidos: arr,
  emojis_prohibidos: arr,
  palabras_permitidas: arr,
  palabras_prohibidas: arr,
  frases_tipicas: arr,
  ctas_habituales: arr,
  // Identidad visual (brand_visual_identity)
  logo_descripcion: s,
  colores: arr,
  tipografias: arr,
  estilo_fotografico: s,
  estilo_grafico: s,
  estilo_carruseles: s,
  estilo_historias: s,
  estilo_reels: s,
  // Productos y servicios (brand_products)
  productos: z.array(productoSchema),
});

export type BrandbookExtraction = z.infer<typeof brandbookExtractionSchema>;

const EXTRACT_SYSTEM = `Eres un estratega de marca de una agencia de marketing. Recibes el brandbook (manual de marca) de un cliente en PDF y tu trabajo es extraer TODA la informacion util para cargar la Memoria de Marca de la plataforma Content OS.

Reglas:
- Extrae solo lo que el documento realmente dice o muestra. NO inventes datos.
- Si un campo no aparece en el documento, devuelve null (o lista vacia).
- Los colores van con su codigo hex si figura (ej: "#1A1A2E azul noche").
- "publico_lenguaje" describe como habla el publico; "nivel_formalidad" como habla la MARCA.
- En "productos" carga cada producto o servicio con todo el detalle disponible.
- Si el documento muestra la personalidad/tono con ejemplos, resumelos en frases utilizables.
- Escribe todo en espanol.`;

const EXTRACT_PROMPT = `Lee el brandbook adjunto completo (texto, tablas y lo que se vea en las imagenes) y completa el JSON con toda la informacion de marca que contenga.`;

const EXTRACT_PROMPT_TEXT = `Lee el siguiente texto (brandbook / informacion de marca pegada por el equipo) y completa el JSON con toda la informacion de marca que contenga:`;

/** Fuente del brandbook: PDF adjunto o texto pegado. */
export type BrandbookSource =
  | { kind: "pdf"; base64: string; name: string }
  | { kind: "text"; text: string };

/** Campos de la extracción → tabla destino. */
const MEMORY_KEYS = [
  "nombre_comercial", "rubro", "descripcion", "historia", "mision", "vision", "valores",
  "publico_edad", "publico_pais", "publico_ciudad", "publico_nivel_socioeconomico",
  "publico_problemas", "publico_deseos", "publico_objeciones", "publico_intereses", "publico_lenguaje",
  "red_instagram", "red_facebook", "red_tiktok", "red_sitio_web", "red_whatsapp",
  "competidores", "objetivos_marketing",
] as const;
const VOICE_KEYS = [
  "tono", "personalidad", "nivel_formalidad", "emojis_permitidos", "emojis_prohibidos",
  "palabras_permitidas", "palabras_prohibidas", "frases_tipicas", "ctas_habituales",
] as const;
const VISUAL_KEYS = [
  "logo_descripcion", "colores", "tipografias", "estilo_fotografico", "estilo_grafico",
  "estilo_carruseles", "estilo_historias", "estilo_reels",
] as const;

/** Se queda solo con los campos que el PDF realmente aportó (no pisa lo existente con vacío). */
function pickFilled(
  extraction: BrandbookExtraction,
  keys: readonly (keyof BrandbookExtraction)[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    const value = extraction[key];
    if (value === null) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    out[key] = value;
  }
  return out;
}

export type BrandbookImportSummary = {
  camposCargados: number;
  productosCreados: number;
};

/**
 * Lee el PDF con el proveedor de IA activo y vuelca el resultado en la
 * Memoria de Marca del cliente. Solo escribe los campos que el PDF aportó:
 * el upsert parcial (merge) no pisa lo que ya estaba cargado a mano.
 */
export async function extractAndSaveBrandbook(
  supabase: Supabase,
  clientId: string,
  source: BrandbookSource,
): Promise<BrandbookImportSummary | { error: string }> {
  const generation = await generateStructured<BrandbookExtraction>({
    staticSystem: EXTRACT_SYSTEM,
    brandContext: "",
    userPrompt:
      source.kind === "pdf" ? EXTRACT_PROMPT : `${EXTRACT_PROMPT_TEXT}\n\n---\n${source.text}`,
    schema: brandbookExtractionSchema,
    document:
      source.kind === "pdf"
        ? { data: source.base64, mediaType: "application/pdf", name: source.name }
        : undefined,
  });
  const extraction = generation.data;

  const memoryPatch = pickFilled(extraction, MEMORY_KEYS);
  const voicePatch = pickFilled(extraction, VOICE_KEYS);
  const visualPatch = pickFilled(extraction, VISUAL_KEYS);

  type Tables = Database["public"]["Tables"];
  if (Object.keys(memoryPatch).length > 0) {
    const { error } = await supabase
      .from("brand_memory")
      .upsert(
        { client_id: clientId, ...memoryPatch } as Tables["brand_memory"]["Insert"],
        { onConflict: "client_id" },
      );
    if (error) return { error: error.message };
  }
  if (Object.keys(voicePatch).length > 0) {
    const { error } = await supabase
      .from("brand_voice")
      .upsert(
        { client_id: clientId, ...voicePatch } as Tables["brand_voice"]["Insert"],
        { onConflict: "client_id" },
      );
    if (error) return { error: error.message };
  }
  if (Object.keys(visualPatch).length > 0) {
    const { error } = await supabase
      .from("brand_visual_identity")
      .upsert(
        { client_id: clientId, ...visualPatch } as Tables["brand_visual_identity"]["Insert"],
        { onConflict: "client_id" },
      );
    if (error) return { error: error.message };
  }

  // Productos: solo los que no existen todavía (por nombre, sin distinguir mayúsculas).
  let productosCreados = 0;
  if (extraction.productos.length > 0) {
    const { data: existing } = await supabase
      .from("brand_products")
      .select("nombre")
      .eq("client_id", clientId);
    const existingNames = new Set((existing ?? []).map((p) => p.nombre.trim().toLowerCase()));
    const nuevos = extraction.productos.filter(
      (p) => p.nombre.trim() && !existingNames.has(p.nombre.trim().toLowerCase()),
    );
    if (nuevos.length > 0) {
      const { error } = await supabase.from("brand_products").insert(
        nuevos.map((p) => ({
          client_id: clientId,
          nombre: p.nombre,
          kind: p.kind,
          descripcion: p.descripcion,
          beneficios: p.beneficios,
          caracteristicas: p.caracteristicas,
          diferenciales: p.diferenciales,
          precio: p.precio,
          promociones: p.promociones,
          publico_objetivo: p.publico_objetivo,
        })),
      );
      if (error) return { error: error.message };
      productosCreados = nuevos.length;
    }
  }

  return {
    camposCargados:
      Object.keys(memoryPatch).length + Object.keys(voicePatch).length + Object.keys(visualPatch).length,
    productosCreados,
  };
}

export const BRANDBOOK_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/** Valida y convierte el File del formulario; null si no se adjuntó nada. */
export async function readBrandbookFile(
  value: FormDataEntryValue | null,
): Promise<{ kind: "pdf"; base64: string; name: string } | { error: string } | null> {
  if (!value || typeof value === "string") return null;
  const file = value as File;
  if (file.size === 0) return null;
  if (file.size > BRANDBOOK_MAX_BYTES) {
    return { error: "El PDF supera los 10 MB. Comprimilo o subí una versión más liviana." };
  }
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return { error: "El brandbook tiene que ser un archivo PDF." };
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  return { kind: "pdf", base64, name: file.name || "brandbook.pdf" };
}

/** Valida el texto pegado del formulario; null si no se cargó nada. */
export function readBrandbookText(
  value: FormDataEntryValue | null,
): { kind: "text"; text: string } | { error: string } | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;
  if (text.length < 80) {
    return { error: "El texto es muy corto para extraer la marca. Pegá la información completa." };
  }
  if (text.length > 300_000) {
    return { error: "El texto es demasiado largo. Pegalo en partes o subí el PDF." };
  }
  return { kind: "text", text };
}
