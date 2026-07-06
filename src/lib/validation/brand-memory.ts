import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : null));

// Las listas llegan desde ChipsInput ya como string[]; se limpian vacios y
// duplicados exactos para que el contexto de la IA no acumule ruido.
const textList = z
  .array(z.string())
  .optional()
  .default([])
  .transform((items) => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of items) {
      const v = raw.trim();
      if (!v || seen.has(v)) continue;
      seen.add(v);
      out.push(v);
    }
    return out;
  });

export const brandMemoryGeneralSchema = z.object({
  nombre_comercial: optionalText,
  rubro: optionalText,
  descripcion: optionalText,
  historia: optionalText,
  mision: optionalText,
  vision: optionalText,
  valores: textList,
});

export const brandMemoryAudienceSchema = z.object({
  publico_edad: optionalText,
  publico_pais: optionalText,
  publico_ciudad: optionalText,
  publico_nivel_socioeconomico: optionalText,
  publico_problemas: textList,
  publico_deseos: textList,
  publico_objeciones: textList,
  publico_intereses: textList,
  publico_lenguaje: optionalText,
});

export const brandMemoryNetworksSchema = z.object({
  red_instagram: optionalText,
  red_facebook: optionalText,
  red_tiktok: optionalText,
  red_sitio_web: optionalText,
  red_whatsapp: optionalText,
  competidores: textList,
  objetivos_marketing: textList,
});

export const brandMemorySchema = brandMemoryGeneralSchema
  .merge(brandMemoryAudienceSchema)
  .merge(brandMemoryNetworksSchema);

export const brandVoiceSchema = z.object({
  tono: optionalText,
  personalidad: optionalText,
  nivel_formalidad: optionalText,
  emojis_permitidos: textList,
  emojis_prohibidos: textList,
  palabras_permitidas: textList,
  palabras_prohibidas: textList,
  frases_tipicas: textList,
  ctas_habituales: textList,
});

export const brandVisualIdentitySchema = z.object({
  logo_descripcion: optionalText,
  colores: textList,
  tipografias: textList,
  estilo_fotografico: optionalText,
  estilo_grafico: optionalText,
  estilo_carruseles: optionalText,
  estilo_historias: optionalText,
  estilo_reels: optionalText,
});

export const brandProductSchema = z.object({
  kind: z.enum(["producto", "servicio"]),
  nombre: z.string().trim().min(1, "El nombre es obligatorio."),
  descripcion: optionalText,
  beneficios: textList,
  caracteristicas: textList,
  diferenciales: textList,
  precio: optionalText,
  promociones: optionalText,
  publico_objetivo: optionalText,
  activo: z.boolean().optional().default(true),
});

export const brandLearningSchema = z.object({
  contenido: z.string().trim().min(1, "El aprendizaje no puede estar vacio."),
  categoria: z.enum(["estilo", "lenguaje", "rendimiento", "otro"]).optional().default("otro"),
});

export const brandExampleSchema = z.object({
  titulo: z.string().trim().min(1, "El titulo es obligatorio."),
  tipo_contenido: z.enum(["post", "story", "reel", "tiktok"]).optional().default("post"),
  hook: optionalText,
  guion: optionalText,
  copy: optionalText,
  cta: optionalText,
  hashtags: textList,
  notas: optionalText,
});

export type BrandMemoryInput = z.input<typeof brandMemorySchema>;
export type BrandVoiceInput = z.input<typeof brandVoiceSchema>;
export type BrandVisualIdentityInput = z.input<typeof brandVisualIdentitySchema>;
export type BrandProductInput = z.input<typeof brandProductSchema>;
