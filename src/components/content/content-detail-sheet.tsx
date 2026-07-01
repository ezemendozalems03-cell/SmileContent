"use client";

import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ContentDetailPanel } from "@/components/content/content-detail-panel";

export function ContentDetailSheet({ contentItemId }: { contentItemId: string }) {
  const router = useRouter();

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    >
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-2xl">
        <SheetTitle className="sr-only">Detalle de publicación</SheetTitle>
        <ContentDetailPanel contentItemId={contentItemId} onClose={() => router.back()} />
      </SheetContent>
    </Sheet>
  );
}
