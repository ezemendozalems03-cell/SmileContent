import { Suspense } from "react";
import { StoriesWorkspace } from "@/components/stories/stories-workspace";

export default async function ClientHistoriasPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  return (
    <Suspense>
      <StoriesWorkspace clientId={clientId} title="Historias" />
    </Suspense>
  );
}
