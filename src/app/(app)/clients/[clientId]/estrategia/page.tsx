import { Suspense } from "react";
import { StrategyWorkspace } from "@/components/strategy/strategy-workspace";

export default async function ClientEstrategiaPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  return (
    <div className="p-6">
      <Suspense>
        <StrategyWorkspace clientId={clientId} />
      </Suspense>
    </div>
  );
}
