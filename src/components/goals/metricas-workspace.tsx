"use client";

import { useMemo, useState } from "react";
import { endOfMonth, format, startOfMonth } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GoalsConfigSection } from "@/components/goals/goals-config-section";
import { GoalsProgressPanel } from "@/components/goals/goals-progress-panel";
import { PlanningInsightsPanel } from "@/components/dashboard/planning-insights-panel";
import { useMonthlyGoalsProgress } from "@/lib/queries/use-monthly-goals-progress";
import { useIdeas } from "@/lib/queries/use-ideas";
import { useContentItems } from "@/lib/queries/use-content-items";
import { useTaxonomy } from "@/lib/queries/use-taxonomy";
import { generatePlanningInsights } from "@/lib/insights/planning-insights";

const MONTH_LABELS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function MetricasWorkspace({ clientId }: { clientId: string }) {
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = endOfMonth(monthStart);
  const dateFrom = format(monthStart, "yyyy-MM-dd");
  const dateTo = format(monthEnd, "yyyy-MM-dd");

  const { data: progress } = useMonthlyGoalsProgress(clientId, year, month);
  const { data: ideas } = useIdeas({ clientId });
  const { data: contentItemsThisMonth } = useContentItems({ clientId, dateFrom, dateTo });
  const { data: taxonomy } = useTaxonomy(clientId);

  const insights = useMemo(
    () =>
      generatePlanningInsights({
        goalsProgress: progress ?? [],
        ideas: ideas ?? [],
        contentItemsThisMonth: contentItemsThisMonth ?? [],
        pillars: taxonomy?.pillars ?? [],
        today,
      }),
    [progress, ideas, contentItemsThisMonth, taxonomy, today],
  );

  const years = [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Métricas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Objetivos de contenido, progreso mensual e insights de planificación.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            items={Object.fromEntries(MONTH_LABELS.map((label, i) => [String(i + 1), label]))}
            value={String(month)}
            onValueChange={(v) => v && setMonth(Number(v))}
          >
            <SelectTrigger size="sm" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_LABELS.map((label, i) => (
                <SelectItem key={label} value={String(i + 1)}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            items={Object.fromEntries(years.map((y) => [String(y), String(y)]))}
            value={String(year)}
            onValueChange={(v) => v && setYear(Number(v))}
          >
            <SelectTrigger size="sm" className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <GoalsProgressPanel progress={progress ?? []} />

      <PlanningInsightsPanel insights={insights} />

      <GoalsConfigSection clientId={clientId} year={year} month={month} />
    </div>
  );
}
