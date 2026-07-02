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

const optionalDate = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : null));

export const ideaSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio."),
  description: optionalText,
  pilar_id: optionalUuid,
  subpilar_id: optionalUuid,
  formato_id: optionalUuid,
  sub_formato_id: optionalUuid,
  client_id: optionalUuid,
  tipo_contenido: z.enum(["post", "story", "reel", "tiktok"]).default("post"),
  status: z.enum(["idea", "en_desarrollo", "aprobado", "calendarizado", "publicado"]).default("idea"),
  priority: z.enum(["baja", "media", "alta", "urgente"]).default("media"),
  hook: optionalText,
  guion: optionalText,
  copy: optionalText,
  cta: optionalText,
  observaciones_internas: optionalText,
  feedback_cliente: optionalText,
  fecha_sugerida: optionalDate,
});
