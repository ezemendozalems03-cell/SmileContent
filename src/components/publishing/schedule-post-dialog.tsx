"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarClock, ExternalLink, Loader2, RefreshCw, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChipsInput } from "@/components/shared/chips-input";
import {
  getContentMediaOptions,
  getSocialAccountPages,
  refreshScheduledPostStatus,
  retryScheduledPost,
  scheduleContentPost,
} from "@/lib/actions/publishing";
import { useScheduledPosts, useSocialAccounts, useInvalidatePublishing } from "@/lib/queries/use-publishing";
import { queryKeys } from "@/lib/queries/keys";
import {
  PUBLISH_STATUS_COLORS,
  PUBLISH_STATUS_LABELS,
  SOCIAL_PLATFORM_LABELS,
} from "@/lib/constants/pipeline-status";
import type { ContentItemWithRelations } from "@/lib/types/domain";

const NONE = "__none__";

function defaultCaption(item: ContentItemWithRelations): string {
  const parts = [item.copy?.trim(), item.cta?.trim()].filter(Boolean);
  const hashtags = (item.hashtags ?? []).map((h) => `#${h.replace(/^#/, "")}`).join(" ");
  if (hashtags) parts.push(hashtags);
  return parts.join("\n\n");
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

// ---------------------------------------------------------------------------
// Historial de envíos
// ---------------------------------------------------------------------------

function AttemptsHistory({ contentItemId }: { contentItemId: string }) {
  const { data: attempts } = useScheduledPosts(contentItemId);
  const invalidate = useInvalidatePublishing();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!attempts || attempts.length === 0) return null;

  async function handleRefresh(id: string) {
    setBusyId(id);
    try {
      const result = await refreshScheduledPostStatus(id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`Estado: ${PUBLISH_STATUS_LABELS[result.status]}`);
      invalidate(contentItemId);
    } finally {
      setBusyId(null);
    }
  }

  async function handleRetry(id: string) {
    setBusyId(id);
    try {
      const result = await retryScheduledPost(id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Reintento enviado a Blotato.");
      invalidate(contentItemId);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Historial de envíos</p>
      <div className="space-y-2">
        {attempts.map((attempt) => (
          <div key={attempt.id} className="space-y-1.5 rounded-md border border-border p-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                label={PUBLISH_STATUS_LABELS[attempt.status]}
                colorClass={PUBLISH_STATUS_COLORS[attempt.status]}
                className="text-[10px]"
              />
              <span className="text-xs text-muted-foreground">
                {SOCIAL_PLATFORM_LABELS[attempt.platform] ?? attempt.platform}
                {attempt.account?.account_name ? ` · ${attempt.account.account_name}` : ""}
              </span>
              <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                {attempt.scheduled_at
                  ? `Programado: ${formatDateTime(attempt.scheduled_at)}`
                  : `Enviado: ${formatDateTime(attempt.created_at)}`}
              </span>
            </div>
            {attempt.published_at ? (
              <p className="text-xs text-emerald-400">
                Publicado el {formatDateTime(attempt.published_at)}
              </p>
            ) : null}
            {attempt.error_message ? (
              <p className="text-xs text-destructive">{attempt.error_message}</p>
            ) : null}
            <div className="flex items-center gap-2">
              {attempt.status !== "published" && attempt.status !== "cancelled" ? (
                <Button
                  variant="outline"
                  size="xs"
                  disabled={busyId === attempt.id}
                  onClick={() => handleRefresh(attempt.id)}
                >
                  <RefreshCw className={busyId === attempt.id ? "size-3 animate-spin" : "size-3"} />
                  Actualizar estado
                </Button>
              ) : null}
              {attempt.status === "failed" ? (
                <Button
                  variant="outline"
                  size="xs"
                  disabled={busyId === attempt.id}
                  onClick={() => handleRetry(attempt.id)}
                >
                  <RotateCcw className="size-3" />
                  Reintentar
                </Button>
              ) : null}
              {attempt.external_post_id ? (
                <a
                  href={attempt.external_post_id}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="size-3" />
                  Ver publicación
                </a>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Diálogo principal
// ---------------------------------------------------------------------------

export function SchedulePostDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ContentItemWithRelations;
}) {
  const invalidate = useInvalidatePublishing();
  const { data: accounts } = useSocialAccounts(item.client_id);
  const clientAccounts = useMemo(
    () => (accounts ?? []).filter((a) => a.client_id === item.client_id && a.is_active),
    [accounts, item.client_id],
  );

  const [accountId, setAccountId] = useState<string>("");
  const [mode, setMode] = useState<"schedule" | "now">("schedule");
  const [fecha, setFecha] = useState(item.fecha_publicacion ?? "");
  const [hora, setHora] = useState(item.hora_sugerida?.slice(0, 5) ?? "10:00");
  const [caption, setCaption] = useState(() => defaultCaption(item));
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [confirm, setConfirm] = useState(false);
  const [sending, setSending] = useState(false);

  // Extras por plataforma
  const [igMediaType, setIgMediaType] = useState<string>(NONE);
  const [pageId, setPageId] = useState<string>(NONE);
  const [ytTitle, setYtTitle] = useState(item.titulo);
  const [ytPrivacy, setYtPrivacy] = useState("public");
  const [ttPrivacy, setTtPrivacy] = useState("PUBLIC_TO_EVERYONE");
  const [ttAi, setTtAi] = useState(false);

  const account = clientAccounts.find((a) => a.id === accountId) ?? null;
  const platform = account?.platform ?? null;

  // Archivos del contenido como URLs firmadas (server action, key privada a salvo).
  const mediaQuery = useQuery({
    queryKey: queryKeys.publishing.media(item.id),
    queryFn: async () => {
      const result = await getContentMediaOptions(item.id);
      if ("error" in result) throw new Error(result.error);
      return result.options;
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  // Páginas (Facebook/LinkedIn) de la cuenta elegida.
  const pagesQuery = useQuery({
    queryKey: ["publishing", "pages", accountId],
    queryFn: async () => {
      const result = await getSocialAccountPages(accountId);
      if ("error" in result) throw new Error(result.error);
      return result.pages;
    },
    enabled: Boolean(accountId) && (platform === "facebook" || platform === "linkedin"),
    staleTime: 5 * 60 * 1000,
  });

  // Al cambiar de cuenta/plataforma, resetear extras y sugerir el tipo de
  // Instagram según el tipo base del contenido ("adjust state during render").
  const [lastPlatform, setLastPlatform] = useState<string | null>(platform);
  if (platform !== lastPlatform) {
    setLastPlatform(platform);
    setPageId(NONE);
    if (platform === "instagram") {
      setIgMediaType(
        item.tipo_contenido === "reel" ? "reel" : item.tipo_contenido === "story" ? "story" : NONE,
      );
    }
  }

  const approved = item.status === "aprobado" || item.status === "programado";

  async function handleSubmit() {
    if (!account) {
      toast.error("Elegí una cuenta social.");
      return;
    }
    let scheduledAt: string | null = null;
    if (mode === "schedule") {
      if (!fecha || !hora) {
        toast.error("Elegí fecha y hora de publicación.");
        return;
      }
      scheduledAt = new Date(`${fecha}T${hora}`).toISOString();
    }

    setSending(true);
    try {
      const result = await scheduleContentPost({
        contentItemId: item.id,
        socialAccountId: account.id,
        scheduledAt,
        caption,
        mediaUrls,
        confirm,
        extras: {
          ...(platform === "instagram" && igMediaType !== NONE
            ? { instagramMediaType: igMediaType as "reel" | "story" }
            : {}),
          ...(platform === "facebook" && pageId !== NONE ? { facebookPageId: pageId } : {}),
          ...(platform === "linkedin" && pageId !== NONE ? { linkedinPageId: pageId } : {}),
          ...(platform === "youtube"
            ? { youtubeTitle: ytTitle, youtubePrivacyStatus: ytPrivacy as "public" | "private" | "unlisted" }
            : {}),
          ...(platform === "tiktok"
            ? {
                tiktokPrivacyLevel: ttPrivacy as "PUBLIC_TO_EVERYONE",
                tiktokIsAiGenerated: ttAi,
              }
            : {}),
        },
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(
        mode === "schedule"
          ? "Programado con Blotato. Se publicará automáticamente."
          : "Enviado a Blotato. Publicándose ahora…",
      );
      setConfirm(false);
      invalidate(item.id);
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && sending) return;
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="size-4 text-primary" />
            Programar con Blotato
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <AttemptsHistory contentItemId={item.id} />

          {!approved ? (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
              Solo se puede programar contenido en estado <b>Aprobado</b>. Este contenido está en
              “{item.status}”.
            </p>
          ) : null}

          {clientAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Este cliente no tiene cuentas sociales asignadas. Andá a Configuración → Canales
              conectados, sincronizá con Blotato y asigná sus cuentas.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Plataforma y cuenta *</Label>
                <Select
                  items={Object.fromEntries(
                    clientAccounts.map((a) => [
                      a.id,
                      `${SOCIAL_PLATFORM_LABELS[a.platform] ?? a.platform} — ${a.account_name ?? a.username ?? a.account_id}`,
                    ]),
                  )}
                  value={accountId || null}
                  onValueChange={(v) => setAccountId(v ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Elegí la cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {SOCIAL_PLATFORM_LABELS[a.platform] ?? a.platform} —{" "}
                        {a.account_name ?? a.username ?? a.account_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Cuándo</Label>
                  <Select
                    items={{ schedule: "Programar fecha y hora", now: "Publicar ahora" }}
                    value={mode}
                    onValueChange={(v) => setMode((v as "schedule" | "now") ?? "schedule")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="schedule">Programar fecha y hora</SelectItem>
                      <SelectItem value="now">Publicar ahora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {mode === "schedule" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="pub-fecha">Fecha</Label>
                      <Input
                        id="pub-fecha"
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pub-hora">Hora</Label>
                      <Input
                        id="pub-hora"
                        type="time"
                        value={hora}
                        onChange={(e) => setHora(e.target.value)}
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pub-caption">Caption</Label>
                <Textarea
                  id="pub-caption"
                  rows={6}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Archivos (URLs públicas de imagen/video)</Label>
                {mediaQuery.data && mediaQuery.data.length > 0 ? (
                  <div className="space-y-1">
                    {mediaQuery.data.map((option) => {
                      const included = mediaUrls.includes(option.url);
                      return (
                        <label key={option.url} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={included}
                            onCheckedChange={() =>
                              setMediaUrls((prev) =>
                                included ? prev.filter((u) => u !== option.url) : [...prev, option.url],
                              )
                            }
                          />
                          <span className="truncate">{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Este contenido no tiene archivos subidos. Podés pegar URLs públicas abajo.
                  </p>
                )}
                <ChipsInput value={mediaUrls} onChange={setMediaUrls} placeholder="https://…" />
              </div>

              {platform === "instagram" ? (
                <div className="space-y-2">
                  <Label>Tipo de publicación (Instagram)</Label>
                  <Select
                    items={{ [NONE]: "Post / Carrusel", reel: "Reel", story: "Historia" }}
                    value={igMediaType}
                    onValueChange={(v) => setIgMediaType(v ?? NONE)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Post / Carrusel</SelectItem>
                      <SelectItem value="reel">Reel</SelectItem>
                      <SelectItem value="story">Historia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {platform === "facebook" || platform === "linkedin" ? (
                <div className="space-y-2">
                  <Label>{platform === "facebook" ? "Página de Facebook *" : "Página de LinkedIn (opcional)"}</Label>
                  <Select
                    items={{
                      [NONE]: platform === "facebook" ? "Elegí la página" : "Perfil personal",
                      ...Object.fromEntries((pagesQuery.data ?? []).map((p) => [p.id, p.name ?? p.id])),
                    }}
                    value={pageId}
                    onValueChange={(v) => setPageId(v ?? NONE)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>
                        {platform === "facebook" ? "Elegí la página" : "Perfil personal"}
                      </SelectItem>
                      {(pagesQuery.data ?? []).map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name ?? p.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {pagesQuery.isLoading ? (
                    <p className="text-xs text-muted-foreground">Cargando páginas…</p>
                  ) : null}
                </div>
              ) : null}

              {platform === "youtube" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="yt-title">Título (YouTube) *</Label>
                    <Input id="yt-title" value={ytTitle} onChange={(e) => setYtTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Privacidad</Label>
                    <Select
                      items={{ public: "Público", unlisted: "No listado", private: "Privado" }}
                      value={ytPrivacy}
                      onValueChange={(v) => setYtPrivacy(v ?? "public")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Público</SelectItem>
                        <SelectItem value="unlisted">No listado</SelectItem>
                        <SelectItem value="private">Privado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : null}

              {platform === "tiktok" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Privacidad (TikTok)</Label>
                    <Select
                      items={{
                        PUBLIC_TO_EVERYONE: "Público",
                        MUTUAL_FOLLOW_FRIENDS: "Amigos",
                        FOLLOWER_OF_CREATOR: "Seguidores",
                        SELF_ONLY: "Solo yo",
                      }}
                      value={ttPrivacy}
                      onValueChange={(v) => setTtPrivacy(v ?? "PUBLIC_TO_EVERYONE")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PUBLIC_TO_EVERYONE">Público</SelectItem>
                        <SelectItem value="MUTUAL_FOLLOW_FRIENDS">Amigos</SelectItem>
                        <SelectItem value="FOLLOWER_OF_CREATOR">Seguidores</SelectItem>
                        <SelectItem value="SELF_ONLY">Solo yo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <label className="flex items-end gap-2 pb-2 text-sm">
                    <Checkbox checked={ttAi} onCheckedChange={(v) => setTtAi(Boolean(v))} />
                    Contenido generado con IA
                  </label>
                </div>
              ) : null}

              <label className="flex items-start gap-2 rounded-md border border-border p-3 text-sm">
                <Checkbox checked={confirm} onCheckedChange={(v) => setConfirm(Boolean(v))} />
                <span>
                  Confirmo que este contenido está <b>aprobado</b> y listo para publicarse en la
                  cuenta seleccionada.
                </span>
              </label>

              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={sending || !approved || !confirm || !account}
                >
                  {sending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Enviando a Blotato…
                    </>
                  ) : mode === "schedule" ? (
                    <>
                      <CalendarClock className="size-4" />
                      Programar con Blotato
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      Publicar ahora
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
