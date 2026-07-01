import { ContentDetailSheet } from "@/components/content/content-detail-sheet";

export default async function ContentItemModalPage({
  params,
}: {
  params: Promise<{ contentId: string }>;
}) {
  const { contentId } = await params;
  return <ContentDetailSheet contentItemId={contentId} />;
}
