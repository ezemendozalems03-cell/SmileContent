"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  BrainCircuit,
  CalendarPlus,
  Info,
  Lightbulb,
  OctagonAlert,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { analyzeBrandStrategy } from "@/lib/actions/ai-strategy";
import { updateRecommendationEstado } from "@/lib/actions/strategy";
import {
  useContentRecommendations,
  useInvalidateStrategy,
  useLatestStrategyReport,
  useStrategySettings,
  useStrategySnapshot,
} from "@/lib/queries/use-strategy";
import { strategyReportSchema } from "@/lib/ai/strategy-schemas";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarFillDialog } from "@/components/strategy/calendar-fill-dialog";
import { GenerateIdeasDialog } from "@/components/strategy/generate-ideas-dialog";
import type { DistribucionItem } from "@/lib/strategy/snapshot";
import type { ContentRecommendation } from "@/lib/types/domain";

const TIPO_LABELS: Record<string, string> = {
  post: "Posts",
  reel: "Reels",
  tiktok: "TikToks",
  story: "Historias",
  historia: "Historias",
};

// ---------------------------------------------------------------------------
// Piezas visuales (un solo tono para magnitud; el texto siempre en tokens de
// tinta; severidad = ícono + etiqueta, nunca solo color)
// ---------------------------------------------------------------------------

function StatTile({
  label,
  real,
  objetivo,
}: {
  label: string;
  real: number;
  objetivo: number | null;
}) {
  const pct = objetivo && objetivo > 0 ? Math.min(100, Math.round((real / objetivo) * 100)) : null;
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">
        {real}
        <span className="ml-1 text-sm font-normal text-muted-foreground">/ sem</span>
      </p>
      {objetivo !== null ? (
        <>
          <p className="mt-0.5 text-xs text-muted-foreground">objetivo: {objetivo} por semana</p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted" role="presentation">
            <div
              className="h-1.5 rounded-full bg-primary"
              style={{ width: `${pct ?? 0}%` }}
            />
          </div>
        </>
      ) : (
        <p className="mt-0.5 text-xs text-muted-foreground">sin objetivo configurado</p>
      )}
    </div>
  );
}

function DistributionBars({ title, items }: { title: string; items: DistribucionItem[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos en el período.</p>
        ) : (
          items.map((d) => (
            <div key={d.nombre}>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="truncate text-sm">{TIPO_LABELS[d.nombre] ?? d.nombre}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {d.pct}% ({d.count})
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${d.pct}%` }} />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

const SEVERIDAD_META = {
  alta: { icon: OctagonAlert, label: "Alta", className: "text-destructive" },
  media: { icon: AlertTriangle, label: "Media", className: "text-foreground" },
  info: { icon: Info, label: "Info", className: "text-muted-foreground" },
} as const;

function RecommendationRow({
  rec,
  clientId,
  onChanged,
}: {
  rec: ContentRecommendation;
  clientId: string;
  onChanged: () => void;
}) {
  const meta = SEVERIDAD_META[rec.severidad] ?? SEVERIDAD_META.info;
  const Icon = meta.icon;

  async function setEstado(estado: "aplicada" | "descartada") {
    const result = await updateRecommendationEstado(rec.id, clientId, estado);
    if (result?.error) toast.error(result.error);
    onChanged();
  }

  return (
    <div className="flex items-start gap-3 rounded-md border border-border p-3">
      <Icon className={`mt-0.5 size-4 shrink-0 ${meta.className}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">{rec.titulo}</p>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            {meta.label} · {rec.tipo}
          </span>
        </div>
        {rec.detalle && <p className="mt-0.5 text-xs text-muted-foreground">{rec.detalle}</p>}
      </div>
      <div className="flex shrink-0 gap-1">
        <Button size="sm" variant="ghost" onClick={() => setEstado("aplicada")}>
          Aplicada
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEstado("descartada")}>
          Descartar
        </Button>
      </div>
    </div>
  );
}

function ReportSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel principal
// ---------------------------------------------------------------------------

export function StrategyPanel({ clientId }: { clientId: string }) {
  const snapshotQuery = useStrategySnapshot(clientId);
  const settingsQuery = useStrategySettings(clientId);
  const recsQuery = useContentRecommendations(clientId);
  const reportQuery = useLatestStrategyReport(clientId);
  const invalidate = useInvalidateStrategy();

  const [analyzing, setAnalyzing] = useState(false);
  const [fillOpen, setFillOpen] = useState(false);
  const [ideasOpen, setIdeasOpen] = useState(false);

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const result = await analyzeBrandStrategy(clientId);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Informe estratégico generado.");
      invalidate(clientId);
    } finally {
      setAnalyzing(false);
    }
  }

  const snapshot = snapshotQuery.data;
  const settings = settingsQuery.data;
  const recs = recsQuery.data ?? [];
  const report = reportQuery.data;
  const reportParsed = report ? strategyReportSchema.safeParse(report.resultado) : null;

  if (snapshotQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? (
            <RefreshCw className="size-4 animate-spin" />
          ) : (
            <BrainCircuit className="size-4" />
          )}
          {analyzing ? "Analizando... (puede tardar un minuto)" : "Analizar marca"}
        </Button>
        <Button variant="outline" onClick={() => setFillOpen(true)}>
          <CalendarPlus className="size-4" />
          Completar calendario
        </Button>
        <Button variant="outline" onClick={() => setIdeasOpen(true)}>
          <Lightbulb className="size-4" />
          Generar ideas
        </Button>
      </div>

      {/* Frecuencia real vs objetivo */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Posts"
          real={snapshot?.frecuenciaReal.posts ?? 0}
          objetivo={settings?.posts_semanales ?? null}
        />
        <StatTile
          label="Reels / TikToks"
          real={snapshot?.frecuenciaReal.reels ?? 0}
          objetivo={settings?.reels_semanales ?? null}
        />
        <StatTile
          label="Historias"
          real={snapshot?.frecuenciaReal.historias ?? 0}
          objetivo={settings?.historias_semanales ?? null}
        />
      </div>

      {/* Distribuciones */}
      <div className="grid gap-4 lg:grid-cols-2">
        <DistributionBars
          title="Distribución de pilares (últimos 60 días)"
          items={snapshot?.distribucionPilares ?? []}
        />
        <DistributionBars
          title="Distribución por tipo de contenido"
          items={snapshot?.distribucionTipos ?? []}
        />
      </div>

      {/* Balance del calendario */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Balance del calendario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {snapshot && (
            <>
              <p className="text-muted-foreground">
                Próximos 14 días:{" "}
                {snapshot.huecosCalendario.length === 0
                  ? "sin huecos, todo agendado."
                  : `${snapshot.huecosCalendario.length} días sin contenido agendado.`}
              </p>
              {Object.entries(snapshot.diasSinPublicar)
                .filter(([, dias]) => dias === null || dias >= 7)
                .map(([tipo, dias]) => (
                  <p key={tipo} className="flex items-center gap-2">
                    <AlertTriangle className="size-3.5 text-muted-foreground" />
                    {dias === null
                      ? `Nunca se publicó contenido tipo ${TIPO_LABELS[tipo]?.toLowerCase() ?? tipo}.`
                      : `Hace ${dias} días que no hay ${TIPO_LABELS[tipo]?.toLowerCase() ?? tipo}.`}
                  </p>
                ))}
              {snapshot.repeticion.ctasRepetidos.map((c) => (
                <p key={c.texto} className="flex items-center gap-2">
                  <RefreshCw className="size-3.5 text-muted-foreground" />
                  CTA usado {c.veces} veces: “{c.texto}”.
                </p>
              ))}
              {snapshot.repeticion.rachaPilar && (
                <p className="flex items-center gap-2">
                  <RefreshCw className="size-3.5 text-muted-foreground" />
                  Últimas {snapshot.repeticion.rachaPilar.veces} publicaciones seguidas del pilar “
                  {snapshot.repeticion.rachaPilar.pilar}”.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Alertas estratégicas (recomendaciones IA) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">Alertas y recomendaciones</h2>
        </div>
        {recs.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3 py-5 text-center text-sm text-muted-foreground">
            Sin recomendaciones pendientes. Tocá “Analizar marca” para generar un informe.
          </p>
        ) : (
          <div className="space-y-2">
            {recs.map((rec) => (
              <RecommendationRow
                key={rec.id}
                rec={rec}
                clientId={clientId}
                onChanged={() => invalidate(clientId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Último informe */}
      {report && reportParsed?.success && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Último análisis de marca
              <span className="ml-2 font-normal text-muted-foreground">
                {new Date(report.created_at).toLocaleDateString("es-AR")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{reportParsed.data.resumen}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <ReportSection title="Fortalezas" items={reportParsed.data.fortalezas} />
              <ReportSection title="Debilidades" items={reportParsed.data.debilidades} />
              <ReportSection title="Oportunidades" items={reportParsed.data.oportunidades} />
              <ReportSection title="Contenido faltante" items={reportParsed.data.contenido_faltante} />
              <ReportSection title="Contenido repetido" items={reportParsed.data.contenido_repetido} />
            </div>
            {reportParsed.data.ideas_prioritarias.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Ideas prioritarias
                </p>
                <div className="mt-2 space-y-2">
                  {reportParsed.data.ideas_prioritarias.map((idea, i) => (
                    <div key={i} className="rounded-md border border-border p-2.5 text-sm">
                      <p className="font-medium">
                        {idea.titulo}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {idea.tipo_contenido}
                          {idea.pilar ? ` · ${idea.pilar}` : ""}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{idea.razon}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {fillOpen && (
        <CalendarFillDialog clientId={clientId} open onOpenChange={(o) => !o && setFillOpen(false)} />
      )}
      {ideasOpen && (
        <GenerateIdeasDialog clientId={clientId} open onOpenChange={(o) => !o && setIdeasOpen(false)} />
      )}
    </div>
  );
}
