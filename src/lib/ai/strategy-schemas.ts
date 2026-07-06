import { z } from "zod";

/**
 * Esquemas de salida estructurada del motor estratégico. Mismas reglas que
 * schemas.ts: strictObject en todo, null-unions en vez de optionals.
 */

const nullableString = z.union([z.string(), z.null()]);

// --- Informe "Analizar marca" ------------------------------------------------

const recomendacionSchema = z.strictObject({
  tipo: z.enum(["balance", "repeticion", "frecuencia", "oportunidad", "otro"]),
  titulo: z.string(),
  detalle: z.string(),
  severidad: z.enum(["info", "media", "alta"]),
});

const ideaPrioritariaSchema = z.strictObject({
  titulo: z.string(),
  pilar: nullableString,
  tipo_contenido: z.enum(["carrusel", "reel", "historia", "post", "tiktok"]),
  objetivo: z.string(),
  razon: z.string(),
});

export const strategyReportSchema = z.strictObject({
  resumen: z.string(),
  fortalezas: z.array(z.string()),
  debilidades: z.array(z.string()),
  oportunidades: z.array(z.string()),
  contenido_faltante: z.array(z.string()),
  contenido_repetido: z.array(z.string()),
  recomendaciones: z.array(recomendacionSchema),
  ideas_prioritarias: z.array(ideaPrioritariaSchema),
});

export type StrategyReportResult = z.infer<typeof strategyReportSchema>;

// --- Plan mensual ---------------------------------------------------------------

const planIdeaSchema = z.strictObject({
  titulo: z.string(),
  descripcion: z.string(),
  pilar: nullableString,
  tipo_contenido: z.enum(["carrusel", "reel", "historia", "post", "tiktok"]),
  objetivo: z.string(),
  dificultad: z.enum(["baja", "media", "alta"]),
  tiempo_estimado: z.string(),
  semana: z.number().int(),
});

export const monthlyPlanSchema = z.strictObject({
  resumen: z.string(),
  objetivos: z.array(z.string()),
  distribucion_pilares: z.array(
    z.strictObject({ pilar: z.string(), porcentaje: z.number().int() }),
  ),
  cantidad_contenidos: z.number().int(),
  temas: z.array(z.string()),
  productos_a_destacar: z.array(z.string()),
  ideas: z.array(planIdeaSchema),
});

export type MonthlyPlanResult = z.infer<typeof monthlyPlanSchema>;

// --- Completar calendario ------------------------------------------------------------

const propuestaSchema = z.strictObject({
  fecha: z.string(),
  tipo_contenido: z.enum(["post", "reel", "story", "tiktok"]),
  titulo: z.string(),
  pilar: nullableString,
  objetivo: z.string(),
  razon: z.string(),
  hook_sugerido: nullableString,
});

export const calendarFillSchema = z.strictObject({
  propuestas: z.array(propuestaSchema),
});

export type CalendarProposal = z.infer<typeof propuestaSchema>;
export type CalendarFillResult = z.infer<typeof calendarFillSchema>;

// --- Ideas para el banco -----------------------------------------------------------------

const ideaGeneradaSchema = z.strictObject({
  titulo: z.string(),
  descripcion: z.string(),
  pilar: nullableString,
  tipo_contenido: z.enum(["post", "reel", "story", "tiktok"]),
  objetivo: z.string(),
  dificultad: z.enum(["baja", "media", "alta"]),
  tiempo_estimado: z.string(),
  hook: nullableString,
  cta: nullableString,
});

export const ideasBatchSchema = z.strictObject({
  ideas: z.array(ideaGeneradaSchema),
});

export type GeneratedIdea = z.infer<typeof ideaGeneradaSchema>;
export type IdeasBatchResult = z.infer<typeof ideasBatchSchema>;
