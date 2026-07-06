import { z } from "zod";
import { AI_SECTIONS } from "@/lib/ai/schemas";

// Mismo sentinel "__none__" que el resto de la app (ver content-item.ts).
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

export const aiGenerateSchema = z.object({
  clientId: z.string().uuid("Cliente inválido."),
  tema: z.string().trim().min(3, "Describí el tema a generar."),
  tipoContenido: z.enum(["carrusel", "reel", "historia", "post", "tiktok", "email", "campana"]),
  objetivo: optionalText,
  productoId: optionalUuid,
  fechaPublicacion: optionalText,
});

export const aiRegenerateSectionSchema = z.object({
  generationId: z.string().uuid(),
  seccion: z.enum(AI_SECTIONS),
});

export type AiGenerateInput = z.input<typeof aiGenerateSchema>;
