import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlanningInsight } from "@/lib/insights/planning-insights";

export function PlanningInsightsPanel({ insights }: { insights: PlanningInsight[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="size-4 text-sky-400" />
          Insights de planificación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {insights.length === 0 ? (
          <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-emerald-400" />
            El calendario se ve equilibrado.
          </div>
        ) : (
          insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2 rounded-md px-2 py-1.5 text-sm">
              {insight.severity === "warning" ? (
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
              ) : (
                <Info className="mt-0.5 size-3.5 shrink-0 text-sky-400" />
              )}
              <span>{insight.message}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
