import { ContentDetailPanel } from "@/components/content/content-detail-panel";

export default async function ContentItemPage({
  params,
}: {
  params: Promise<{ contentId: string }>;
}) {
  const { contentId } = await params;
  return (
    <div className="h-full">
      <ContentDetailPanel contentItemId={contentId} />
    </div>
  );
}
