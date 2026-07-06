import { Suspense } from "react";
import { BrandMemoryWorkspace } from "@/components/brand-memory/brand-memory-workspace";

export default async function ClientMemoriaPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  return (
    <div className="p-6">
      <Suspense>
        <BrandMemoryWorkspace clientId={clientId} />
      </Suspense>
    </div>
  );
}
