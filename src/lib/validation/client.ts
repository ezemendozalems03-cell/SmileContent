import { z } from "zod";

export const clientFormSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio."),
  slug: z
    .string()
    .trim()
    .min(2, "El slug es obligatorio.")
    .regex(/^[a-z0-9-]+$/, "Solo minusculas, numeros y guiones."),
  rubro: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["activo", "pausado", "finalizado", "prospecto"]),
  plan_contratado: z.string().trim().optional().or(z.literal("")),
  fecha_inicio: z.string().trim().optional().or(z.literal("")),
  instagram_url: z.string().trim().url("URL invalida.").optional().or(z.literal("")),
  tiktok_url: z.string().trim().url("URL invalida.").optional().or(z.literal("")),
  brand_manual_url: z.string().trim().url("URL invalida.").optional().or(z.literal("")),
  brand_typography: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

const DIACRITICS_REGEX = /[̀-ͯ]/g;

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
