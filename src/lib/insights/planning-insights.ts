import { endOfWeek, isWithinInterval, startOfWeek } from "date-fns";
import { CONTENT_KIND_LABELS } from "@/lib/constants/pipeline-status";
import type { ContentItemWithRelations, IdeaWithRelations, MonthlyGoalProgress, Pillar } from "@/lib/types/domain";

export type PlanningInsight = { severity: "info" | "warning"; message: string };

// Tunable thresholds -- adjust here if the agency wants a different sensitivity.
const PILLAR_IMBALANCE_MULTIPLIER = 2;
const IDEA_BACKLOG_MIN_IDEAS = 5;
const IDEA_BACKLOG_MAX_SCHEDULED_RATIO = 0.2;

function groupCount<T>(items: T[], keyFn: (item: T) => string | null): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

export function generatePlanningInsights(input: {
  goalsProgress: MonthlyGoalProgress[];
  ideas: IdeaWithRelations[];
  contentItemsThisMonth: ContentItemWithRelations[];
  pillars: Pillar[];
  today: Date;
}): PlanningInsight[] {
  const insights: PlanningInsight[] = [];

  for (const g of input.goalsProgress) {
    if (g.remaining_count > 0) {
      const label = CONTENT_KIND_LABELS[g.tipo_contenido] + (g.formato_nombre ? ` (${g.formato_nombre})` : "");
      insights.push({
        severity: g.pct_complete < 50 ? "warning" : "info",
        message: `Faltan ${g.remaining_count} ${label.toLowerCase()} para llegar al objetivo mensual.`,
      });
    } else if (g.target_count > 0) {
      const label = CONTENT_KIND_LABELS[g.tipo_contenido] + (g.formato_nombre ? ` (${g.formato_nombre})` : "");
      insights.push({ severity: "info", message: `Objetivo de ${label.toLowerCase()} cumplido.` });
    }
  }

  const countsByPillar = groupCount(input.contentItemsThisMonth, (ci) => ci.pilar_id);
  const totalItems = input.contentItemsThisMonth.length;
  const activePillars = input.pillars.filter((p) => p.is_active);
  const avgShare = activePillars.length > 0 ? totalItems / activePillars.length : 0;

  for (const p of activePillars) {
    const count = countsByPillar.get(p.id) ?? 0;
    if (totalItems > 0 && count === 0) {
      insights.push({ severity: "warning", message: `El pilar "${p.name}" no tiene contenido asignado este mes.` });
    } else if (avgShare > 0 && count > avgShare * PILLAR_IMBALANCE_MULTIPLIER) {
      insights.push({
        severity: "info",
        message: `Hay demasiado contenido del pilar "${p.name}" este mes en comparación con los demás pilares.`,
      });
    }
  }

  const weekStart = startOfWeek(input.today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(input.today, { weekStartsOn: 1 });
  const storiesThisWeek = input.contentItemsThisMonth.filter(
    (ci) =>
      ci.tipo_contenido === "story" &&
      ci.fecha_publicacion &&
      isWithinInterval(new Date(ci.fecha_publicacion), { start: weekStart, end: weekEnd }),
  );
  if (storiesThisWeek.length === 0) {
    insights.push({ severity: "warning", message: "No hay historias programadas para esta semana." });
  }

  const totalIdeas = input.ideas.length;
  const calendarizadas = input.ideas.filter((i) => i.status === "calendarizado" || i.status === "publicado").length;
  if (totalIdeas >= IDEA_BACKLOG_MIN_IDEAS && calendarizadas / totalIdeas < IDEA_BACKLOG_MAX_SCHEDULED_RATIO) {
    insights.push({
      severity: "info",
      message: `Hay ${totalIdeas} ideas creadas pero solo ${calendarizadas} programadas. Considerá agendar más ideas del banco.`,
    });
  }

  return insights;
}
