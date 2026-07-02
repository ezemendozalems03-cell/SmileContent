import { Suspense } from "react";
import { MetricasWorkspace } from "@/components/goals/metricas-workspace";

export default async function ClientMetricasPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  return (
    <div className="p-6">
      <Suspense>
        <MetricasWorkspace clientId={clientId} />
      </Suspense>
    </div>
  );
}
