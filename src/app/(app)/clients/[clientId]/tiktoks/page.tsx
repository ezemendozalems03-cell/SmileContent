import { Suspense } from "react";
import { ContentWorkspace } from "@/components/content/content-workspace";

export default async function ClientTikToksPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  return (
    <Suspense>
      <ContentWorkspace clientId={clientId} lockedFormatKind="tiktok" title="TikToks" />
    </Suspense>
  );
}
