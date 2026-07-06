import { z } from "zod";

// "__none__" is the sentinel value used by "Sin X" Select items app-wide
// (base-ui Select can't submit a real empty string via a native form field).
const optionalUuid = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v && v !== "__none__" ? v : null));

const optionalText = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : null));

// Como optionalUuid pero para campos de texto elegidos vía Select ("Sin X" = "__none__").
const optionalSelectText = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v && v !== "__none__" ? v : null));

const optionalUrl = z
  .string()
  .trim()
  .url("URL invalida")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : null));

export const contentItemDetailsSchema = z.object({
  titulo: z.string().trim().min(1, "El titulo es obligatorio."),
  descripcion: optionalText,
  formato_id: optionalUuid,
  sub_formato_id: optionalUuid,
  pilar_id: optionalUuid,
  subpilar_id: optionalUuid,
  tipo_contenido: z.enum(["post", "story", "reel", "tiktok"]),
  objetivo: optionalSelectText,
  fecha_publicacion: optionalText,
  hora_sugerida: optionalText,
});

export const contentItemCopySchema = z.object({
  hook: optionalText,
  guion: optionalText,
  copy: optionalText,
  cta: optionalText,
  hashtags: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) =>
      (v ?? "")
        .split(/[,\s]+/)
        .map((h) => h.replace(/^#/, "").trim())
        .filter(Boolean),
    ),
});

export const contentItemLinksSchema = z.object({
  link_drive: optionalUrl,
  link_canva: optionalUrl,
  link_capcut: optionalUrl,
  link_publicacion_final: optionalUrl,
});

export const contentItemMetricsSchema = z.object({
  vistas: z.coerce.number().int().min(0).optional().default(0),
  likes: z.coerce.number().int().min(0).optional().default(0),
  comentarios_count: z.coerce.number().int().min(0).optional().default(0),
  compartidos: z.coerce.number().int().min(0).optional().default(0),
  guardados: z.coerce.number().int().min(0).optional().default(0),
  consultas_generadas: z.coerce.number().int().min(0).optional().default(0),
});

export const contentItemNotesSchema = z.object({
  observaciones_internas: optionalText,
});

// Edición inline desde la tabla: cada key es opcional; las ausentes no se tocan.
// "__none__" (sentinel de los Select "Sin X") siempre se traduce a null.
const inlineUuid = z.union([
  z.literal("__none__").transform(() => null),
  z.uuid(),
  z.null(),
]);
const inlineText = z.union([
  z.literal("__none__").transform(() => null),
  z
    .string()
    .trim()
    .transform((v) => (v ? v : null)),
  z.null(),
]);

export const contentItemInlinePatchSchema = z
  .object({
    titulo: z.string().trim().min(1, "El titulo es obligatorio."),
    status: z.enum([
      "idea",
      "investigacion",
      "guion",
      "diseno",
      "grabacion",
      "edicion",
      "revision_interna",
      "enviado_al_cliente",
      "correcciones",
      "aprobado",
      "programado",
      "publicado",
      "medido",
      "archivado",
    ]),
    priority: z.enum(["baja", "media", "alta", "urgente"]),
    formato_id: inlineUuid,
    sub_formato_id: inlineUuid,
    pilar_id: inlineUuid,
    subpilar_id: inlineUuid,
    objetivo: inlineText,
  })
  .partial()
  .strict();

export const contentItemFormSchema = contentItemDetailsSchema
  .merge(contentItemCopySchema)
  .merge(contentItemLinksSchema)
  .merge(contentItemMetricsSchema)
  .merge(contentItemNotesSchema);
