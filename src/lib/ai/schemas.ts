import { z } from "zod";
import type { AiContentType } from "@/lib/types/database.types";

/**
 * Esquemas del resultado que devuelve el modelo, por tipo de contenido.
 *
 * Reglas impuestas por structured outputs de la API de Claude:
 *   - todo objeto debe ser estricto (additionalProperties: false) -> strictObject
 *   - sin optionals: los campos que pueden faltar son union con null, para que
 *     `required` liste todas las claves.
 *   - sin restricciones numericas/minLength (no soportadas).
 */

const nullableString = z.union([z.string(), z.null()]);

const slideSchema = z.strictObject({
  titulo: z.string(),
  texto: z.string(),
  idea_visual: z.string(),
});

const escenaSchema = z.strictObject({
  descripcion: z.string(),
  texto_en_pantalla: nullableString,
  voz_en_off: nullableString,
});

const historiaFrameSchema = z.strictObject({
  descripcion: z.string(),
  texto: nullableString,
  interaccion: nullableString,
  idea_visual: z.string(),
});

const emailSchema = z.strictObject({
  asunto: z.string(),
  preheader: z.string(),
  cuerpo: z.string(),
});

const campanaPiezaSchema = z.strictObject({
  tipo: z.string(),
  titulo: z.string(),
  descripcion: z.string(),
});

const baseFields = {
  titulo_interno: z.string(),
  hook: nullableString,
  copy: z.string(),
  cta: z.string(),
  hashtags: z.array(z.string()),
  notas_disenador: nullableString,
};

const nullField = {
  guion: z.null(),
  slides: z.null(),
  escenas: z.null(),
  secuencia_historia: z.null(),
  interaccion_sugerida: z.null(),
  email: z.null(),
  campana_concepto: z.null(),
  campana_piezas: z.null(),
};

/**
 * Un unico shape (superset) para todos los tipos: las secciones que no
 * aplican se fijan a `z.null()` en el esquema por tipo, asi el modelo no
 * puede rellenarlas y el editor UI trabaja siempre con `AiResult`.
 */
function resultSchemaWith(overrides: Partial<Record<keyof typeof nullField, z.ZodType>>) {
  return z.strictObject({ ...baseFields, ...nullField, ...overrides });
}

export const aiResultSchemas: Record<AiContentType, z.ZodType> = {
  carrusel: resultSchemaWith({ slides: z.array(slideSchema) }),
  reel: resultSchemaWith({
    guion: z.string(),
    escenas: z.array(escenaSchema),
  }),
  tiktok: resultSchemaWith({
    guion: z.string(),
    escenas: z.array(escenaSchema),
  }),
  historia: resultSchemaWith({
    secuencia_historia: z.array(historiaFrameSchema),
    interaccion_sugerida: z.string(),
  }),
  post: resultSchemaWith({}),
  email: resultSchemaWith({ email: emailSchema }),
  campana: resultSchemaWith({
    campana_concepto: z.string(),
    campana_piezas: z.array(campanaPiezaSchema),
  }),
};

export type AiSlide = z.infer<typeof slideSchema>;
export type AiEscena = z.infer<typeof escenaSchema>;
export type AiHistoriaFrame = z.infer<typeof historiaFrameSchema>;

export type AiResult = {
  titulo_interno: string;
  hook: string | null;
  copy: string;
  cta: string;
  hashtags: string[];
  notas_disenador: string | null;
  guion: string | null;
  slides: AiSlide[] | null;
  escenas: AiEscena[] | null;
  secuencia_historia: AiHistoriaFrame[] | null;
  interaccion_sugerida: string | null;
  email: z.infer<typeof emailSchema> | null;
  campana_concepto: string | null;
  campana_piezas: z.infer<typeof campanaPiezaSchema>[] | null;
};

/** Secciones que se pueden regenerar de forma aislada. */
export const AI_SECTIONS = [
  "hook",
  "copy",
  "cta",
  "hashtags",
  "slides",
  "guion",
  "escenas",
  "secuencia_historia",
] as const;

export type AiSection = (typeof AI_SECTIONS)[number];

export const AI_SECTION_LABELS: Record<AiSection, string> = {
  hook: "Hook",
  copy: "Copy",
  cta: "CTA",
  hashtags: "Hashtags",
  slides: "Slides",
  guion: "Guion",
  escenas: "Escenas",
  secuencia_historia: "Secuencia de historia",
};

/** Esquema minimo para regenerar una sola seccion (solo esa clave). */
export function sectionSchema(section: AiSection): z.ZodType {
  const shapes: Record<AiSection, z.ZodType> = {
    hook: z.strictObject({ hook: z.string() }),
    copy: z.strictObject({ copy: z.string() }),
    cta: z.strictObject({ cta: z.string() }),
    hashtags: z.strictObject({ hashtags: z.array(z.string()) }),
    slides: z.strictObject({ slides: z.array(slideSchema) }),
    guion: z.strictObject({ guion: z.string() }),
    escenas: z.strictObject({ escenas: z.array(escenaSchema) }),
    secuencia_historia: z.strictObject({ secuencia_historia: z.array(historiaFrameSchema) }),
  };
  return shapes[section];
}

/** Secciones aplicables segun el tipo (para el menu "Regenerar solo..."). */
export function sectionsForType(tipo: AiContentType): AiSection[] {
  switch (tipo) {
    case "carrusel":
      return ["hook", "slides", "copy", "cta", "hashtags"];
    case "reel":
    case "tiktok":
      return ["hook", "guion", "escenas", "copy", "cta", "hashtags"];
    case "historia":
      return ["secuencia_historia", "copy", "cta", "hashtags"];
    case "email":
      return ["copy", "cta"];
    case "campana":
      return ["hook", "copy", "cta", "hashtags"];
    case "post":
    default:
      return ["hook", "copy", "cta", "hashtags"];
  }
}

export const AI_CONTENT_TYPES: { value: AiContentType; label: string }[] = [
  { value: "carrusel", label: "Carrusel" },
  { value: "reel", label: "Reel" },
  { value: "historia", label: "Historia" },
  { value: "post", label: "Post" },
  { value: "tiktok", label: "TikTok" },
  { value: "email", label: "Email" },
  { value: "campana", label: "Campaña" },
];

/**
 * JSON Schema (draft 2020-12) listo para el modo de salida estructurada de
 * cualquier proveedor (Anthropic output_config.format, Gemini
 * responseJsonSchema, OpenAI text.format json_schema). Los tres exigen el
 * mismo subconjunto estricto, por eso los esquemas de arriba ya son
 * z.strictObject + null-unions sin optionals.
 */
export function toJsonSchema(schema: z.ZodType): Record<string, unknown> {
  return z.toJSONSchema(schema, { target: "draft-2020-12" }) as Record<string, unknown>;
}
