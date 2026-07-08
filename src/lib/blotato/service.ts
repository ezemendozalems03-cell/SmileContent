import "server-only";

import { getBlotatoEnv } from "@/lib/env";

/**
 * blotatoService — único punto de contacto con la API de Blotato.
 * Server-only: la API key jamás llega al frontend; los componentes hablan
 * con server actions (src/lib/actions/publishing.ts) que llaman acá.
 *
 * API verificada contra https://help.blotato.com/api (jul 2026):
 *   base https://backend.blotato.com/v2, header `blotato-api-key`.
 *   GET  /users/me/accounts                        → { items: [{id, platform, fullname, username}] }
 *   GET  /users/me/accounts/:id/subaccounts        → { items: [{id, accountId, name}] } (pageId de FB/LinkedIn)
 *   POST /posts                                    → 201 { postSubmissionId } (scheduledTime ISO en la raíz)
 *   GET  /posts/:postSubmissionId                  → { status: in-progress|published|failed, publicUrl?, errorMessage? }
 *   mediaUrls: cualquier URL pública, sin upload previo.
 */

export const BLOTATO_PLATFORMS = [
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "linkedin",
  "twitter",
  "threads",
  "pinterest",
  "bluesky",
] as const;
export type BlotatoPlatform = (typeof BLOTATO_PLATFORMS)[number];

export type BlotatoAccount = {
  id: string;
  platform: string;
  fullname: string | null;
  username: string | null;
};

export type BlotatoSubaccount = { id: string; accountId: string; name: string | null };

export type BlotatoTargetExtras = {
  /** Instagram: post normal (undefined), reel o historia. */
  instagramMediaType?: "reel" | "story";
  /** Facebook: página destino (obligatorio para Facebook). */
  facebookPageId?: string;
  facebookMediaType?: "reel" | "story";
  /** LinkedIn: página de empresa (opcional; sin pageId publica en el perfil). */
  linkedinPageId?: string;
  /** YouTube (obligatorios). */
  youtubeTitle?: string;
  youtubePrivacyStatus?: "public" | "private" | "unlisted";
  /** TikTok. */
  tiktokPrivacyLevel?: "PUBLIC_TO_EVERYONE" | "SELF_ONLY" | "MUTUAL_FOLLOW_FRIENDS" | "FOLLOWER_OF_CREATOR";
  tiktokIsAiGenerated?: boolean;
};

export type BlotatoPostPayload = {
  post: {
    accountId: string;
    content: {
      text: string;
      mediaUrls: string[];
      platform: BlotatoPlatform;
    };
    target: Record<string, unknown> & { targetType: BlotatoPlatform };
  };
  scheduledTime?: string;
};

class BlotatoError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "BlotatoError";
  }
}

async function blotatoFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { BLOTATO_API_KEY, BLOTATO_BASE_URL } = getBlotatoEnv();
  const response = await fetch(`${BLOTATO_BASE_URL}${path}`, {
    ...init,
    headers: {
      "blotato-api-key": BLOTATO_API_KEY,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new BlotatoError(
      `Blotato respondió ${response.status}: ${body.slice(0, 500) || response.statusText}`,
      response.status,
    );
  }
  return (await response.json()) as T;
}

export async function getConnectedAccounts(): Promise<BlotatoAccount[]> {
  const data = await blotatoFetch<{ items: BlotatoAccount[] }>("/users/me/accounts");
  return data.items ?? [];
}

export async function getSubaccounts(accountId: string): Promise<BlotatoSubaccount[]> {
  const data = await blotatoFetch<{ items: BlotatoSubaccount[] }>(
    `/users/me/accounts/${encodeURIComponent(accountId)}/subaccounts`,
  );
  return data.items ?? [];
}

/** Crea (publica ya) o programa un post. Devuelve el id de seguimiento externo. */
export async function createPost(payload: BlotatoPostPayload): Promise<{ postSubmissionId: string }> {
  return blotatoFetch<{ postSubmissionId: string }>("/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type BlotatoPostStatus = {
  postSubmissionId: string;
  status: "in-progress" | "published" | "failed";
  publicUrl?: string | null;
  errorMessage?: string | null;
};

export async function getPostStatus(postSubmissionId: string): Promise<BlotatoPostStatus> {
  return blotatoFetch<BlotatoPostStatus>(`/posts/${encodeURIComponent(postSubmissionId)}`);
}

/**
 * Arma el payload de Blotato a partir de los datos de Content OS.
 * Cada plataforma exige campos distintos en `target`; acá vive TODO ese
 * conocimiento para que el resto de la app no sepa nada de Blotato.
 */
export function mapContentOSToBlotatoPayload(params: {
  accountId: string;
  platform: BlotatoPlatform;
  caption: string;
  mediaUrls: string[];
  scheduledAt: string | null; // ISO; null = publicar ahora
  extras: BlotatoTargetExtras;
}): BlotatoPostPayload | { error: string } {
  const { platform, extras } = params;
  let target: Record<string, unknown> & { targetType: BlotatoPlatform };

  switch (platform) {
    case "instagram":
      target = {
        targetType: "instagram",
        ...(extras.instagramMediaType ? { mediaType: extras.instagramMediaType } : {}),
      };
      break;
    case "facebook":
      if (!extras.facebookPageId) return { error: "Facebook necesita la página destino (pageId)." };
      target = {
        targetType: "facebook",
        pageId: extras.facebookPageId,
        ...(extras.facebookMediaType ? { mediaType: extras.facebookMediaType } : {}),
      };
      break;
    case "linkedin":
      target = {
        targetType: "linkedin",
        ...(extras.linkedinPageId ? { pageId: extras.linkedinPageId } : {}),
      };
      break;
    case "youtube":
      if (!extras.youtubeTitle?.trim()) return { error: "YouTube necesita un título." };
      target = {
        targetType: "youtube",
        title: extras.youtubeTitle,
        privacyStatus: extras.youtubePrivacyStatus ?? "public",
        shouldNotifySubscribers: true,
      };
      break;
    case "tiktok":
      target = {
        targetType: "tiktok",
        privacyLevel: extras.tiktokPrivacyLevel ?? "PUBLIC_TO_EVERYONE",
        disabledComments: false,
        disabledDuet: false,
        disabledStitch: false,
        isBrandedContent: false,
        isYourBrand: false,
        isAiGenerated: extras.tiktokIsAiGenerated ?? false,
      };
      break;
    case "twitter":
    case "threads":
    case "bluesky":
      target = { targetType: platform };
      break;
    case "pinterest":
      return { error: "Pinterest todavía no está soportado desde Content OS." };
    default:
      return { error: `Plataforma no soportada: ${platform}` };
  }

  return {
    post: {
      accountId: params.accountId,
      content: {
        text: params.caption,
        mediaUrls: params.mediaUrls,
        platform,
      },
      target,
    },
    ...(params.scheduledAt ? { scheduledTime: params.scheduledAt } : {}),
  };
}
