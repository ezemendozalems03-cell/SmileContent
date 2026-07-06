"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarRange, Lightbulb, RefreshCw } from "lucide-react";
import { addPlanIdeasToBank, generateMonthlyPlanAi } from "@/lib/actions/ai-strategy";
import { monthlyPlanSchema } from "@/lib/ai/strategy-schemas";
import { useInvalidateStrategy, useMonthlyPlans } from "@/lib/queries/use-strategy";
import { queryKeys } from "@/lib/queries/keys";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { MonthlyPlan } from "@/lib/types/domain";

function proximoMes(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 7);
}

function mesLabel(mes: string): string {
  return new Date(mes.slice(0, 10) + "T00:00:00").toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });
}

function PlanDetail({ plan }: { plan: MonthlyPlan }) {
  const queryClient = useQueryClient();
  const [sending, setSending] = useState(false);
  const parsed = monthlyPlanSchema.safeParse(plan.resultado);
  if (!parsed.success) {
    return <p className="text-sm text-muted-foreground">El plan tiene un formato inesperado.</p>;
  }
  const data = parsed.data;

  async function handleSendIdeas() {
    setSending(true);
    try {
      const result = await addPlanIdeasToBank(plan.id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`${result.created} ideas enviadas al banco de ideas.`);
      queryClient.invalidateQueries({ queryKey: queryKeys.ideas.all });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm">{data.resumen}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Objetivos del mes
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
            {data.objetivos.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Distribución objetivo de pilares
          </p>
          <div className="mt-2 space-y-2">
            {data.distribucion_pilares.map((d) => (
              <div key={d.pilar}>
                <div className="mb-0.5 flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm">{d.pilar}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {d.porcentaje}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${Math.min(100, d.porcentaje)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Temas</p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
            {data.temas.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Productos a destacar
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
            {data.productos_a_destacar.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Ideas del plan ({data.ideas.length} de {data.cantidad_contenidos} contenidos)
          </p>
          <Button size="sm" variant="outline" onClick={handleSendIdeas} disabled={sending}>
            <Lightbulb className="size-3.5" />
            {sending ? "Enviando..." : "Enviar al banco de ideas"}
          </Button>
        </div>
        <div className="mt-2 space-y-2">
          {data.ideas.map((idea, i) => (
            <div key={i} className="rounded-md border border-border p-2.5 text-sm">
              <p className="font-medium">
                {idea.titulo}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  semana {idea.semana} · {idea.tipo_contenido}
                  {idea.pilar ? ` · ${idea.pilar}` : ""} · dificultad {idea.dificultad} ·{" "}
                  {idea.tiempo_estimado}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{idea.descripcion}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MonthlyPlanTab({ clientId }: { clientId: string }) {
  const plansQuery = useMonthlyPlans(clientId);
  const invalidate = useInvalidateStrategy();
  const [mes, setMes] = useState(proximoMes());
  const [generating, setGenerating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const result = await generateMonthlyPlanAi(clientId, mes);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Plan mensual generado.");
      setSelectedId(result.planId);
      invalidate(clientId);
    } finally {
      setGenerating(false);
    }
  }

  if (plansQuery.isLoading) return <Skeleton className="h-64 w-full" />;

  const plans = plansQuery.data ?? [];
  const selected = plans.find((p) => p.id === selectedId) ?? plans[0] ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label>Mes</Label>
          <Input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="w-44" />
        </div>
        <Button onClick={handleGenerate} disabled={generating || !/^\d{4}-\d{2}$/.test(mes)}>
          {generating ? <RefreshCw className="size-4 animate-spin" /> : <CalendarRange className="size-4" />}
          {generating ? "Generando plan..." : "Generar plan mensual"}
        </Button>
        <p className="text-xs text-muted-foreground">
          El plan del mismo mes se reemplaza al regenerarlo.
        </p>
      </div>

      {plans.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {plans.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              className={`rounded-md border px-2.5 py-1 text-xs capitalize ${
                selected?.id === p.id
                  ? "border-primary text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {mesLabel(p.mes)}
            </button>
          ))}
        </div>
      )}

      {selected ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm capitalize">Plan de {mesLabel(selected.mes)}</CardTitle>
          </CardHeader>
          <CardContent>
            <PlanDetail plan={selected} />
          </CardContent>
        </Card>
      ) : (
        <p className="rounded-md border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
          Todavía no hay planes mensuales. Elegí un mes y generá el primero.
        </p>
      )}
    </div>
  );
}
