import { z } from "zod";

/**
 * Programar/publicar un contenido vía Blotato. `confirm` es el "modo seguro":
 * el usuario declara explícitamente que el contenido está aprobado y listo.
 */
export const schedulePostSchema = z.object({
  contentItemId: z.uuid("Contenido inválido."),
  socialAccountId: z.uuid("Elegí una cuenta social."),
  /** ISO 8601; null = publicar ahora. */
  scheduledAt: z.union([z.iso.datetime({ offset: true }), z.null()]),
  caption: z.string().trim().min(1, "El caption no puede estar vacío."),
  mediaUrls: z.array(z.string().url("URL de archivo inválida")).max(10),
  confirm: z.literal(true, {
    error: "Confirmá que el contenido está aprobado y listo para publicarse.",
  }),
  extras: z
    .object({
      instagramMediaType: z.enum(["reel", "story"]).optional(),
      facebookPageId: z.string().trim().min(1).optional(),
      facebookMediaType: z.enum(["reel", "story"]).optional(),
      linkedinPageId: z.string().trim().min(1).optional(),
      youtubeTitle: z.string().trim().min(1).optional(),
      youtubePrivacyStatus: z.enum(["public", "private", "unlisted"]).optional(),
      tiktokPrivacyLevel: z
        .enum(["PUBLIC_TO_EVERYONE", "SELF_ONLY", "MUTUAL_FOLLOW_FRIENDS", "FOLLOWER_OF_CREATOR"])
        .optional(),
      tiktokIsAiGenerated: z.boolean().optional(),
    })
    .default({}),
});

export type SchedulePostInput = z.input<typeof schedulePostSchema>;
