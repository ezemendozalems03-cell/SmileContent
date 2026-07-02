import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : null));

// "__none__" is the sentinel value used by "Sin X" Select items app-wide
// (base-ui Select can't submit a real empty string via a native form field).
const optionalUuid = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v && v !== "__none__" ? v : null));

export const storyFormSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio."),
  fecha: z.string().trim().min(1, "La fecha es obligatoria."),
  hora: optionalText,
  story_type_id: optionalUuid,
  objetivo: optionalText,
  status: z.enum(["idea", "diseno", "lista", "programada", "publicada", "archivada"]),
  assignee_id: optionalUuid,
  texto: optionalText,
  sticker: optionalText,
  link: optionalText,
  cta: optionalText,
  observacion: optionalText,
  respuesta_esperada: optionalText,
});
