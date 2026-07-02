import { Card, CardContent } from "@/components/ui/card";
import { CONTENT_KIND_LABELS } from "@/lib/constants/pipeline-status";
import { cn } from "@/lib/utils";
import type { MonthlyGoalProgress } from "@/lib/types/domain";

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-sky-500" : "bg-amber-500",
        )}
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  );
}

export function GoalsProgressPanel({ progress }: { progress: MonthlyGoalProgress[] }) {
  if (progress.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no hay objetivos configurados para este mes.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {progress.map((g) => {
        const label = CONTENT_KIND_LABELS[g.tipo_contenido] + (g.formato_nombre ? ` — ${g.formato_nombre}` : "");
        return (
          <Card key={`${g.tipo_contenido}-${g.formato_id ?? "generic"}`}>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-semibold tracking-tight">
                {g.scheduled_count}
                <span className="text-base font-normal text-muted-foreground">/{g.target_count}</span>
              </p>
              <ProgressBar pct={g.pct_complete} />
              <p className="text-xs text-muted-foreground">
                {g.published_count} publicados · faltan {g.remaining_count} · {g.pct_complete}%
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
