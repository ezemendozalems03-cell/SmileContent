import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : null));

export const brandAssetSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio."),
  asset_type: optionalText,
});

export const renameBrandAssetSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio."),
});
