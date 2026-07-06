import { z } from "zod";

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
  .transform((v) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null));

export const strategySettingsSchema = z.object({
  posts_semanales: z.coerce.number().int().min(0).max(50),
  reels_semanales: z.coerce.number().int().min(0).max(50),
  historias_semanales: z.coerce.number().int().min(0).max(100),
  notas: optionalText,
});

export const strategyRuleSchema = z.object({
  regla: z.string().trim().min(1, "La regla no puede estar vacía."),
  categoria: z.enum(["secuencia", "frecuencia", "contenido", "otro"]).optional().default("otro"),
});

export const clientObjectiveSchema = z.object({
  objetivo: z.string().trim().min(1, "El objetivo no puede estar vacío."),
  prioridad: z.coerce.number().int().min(1).max(5).optional().default(3),
});

export const campaignSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio."),
  description: optionalText,
  start_date: optionalDate,
  end_date: optionalDate,
});

// Propuestas de "Completar automáticamente" que el usuario aprobó.
export const applyProposalsSchema = z.object({
  clientId: z.string().uuid(),
  propuestas: z
    .array(
      z.object({
        fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
        tipo_contenido: z.enum(["post", "reel", "story", "tiktok"]),
        titulo: z.string().trim().min(1),
        pilar: z.string().nullable().optional().transform((v) => v ?? null),
        objetivo: z.string().optional().default(""),
        razon: z.string().optional().default(""),
        hook_sugerido: z.string().nullable().optional().transform((v) => v ?? null),
      }),
    )
    .min(1, "No hay propuestas seleccionadas."),
});
