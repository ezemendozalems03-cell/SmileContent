import { Suspense } from "react";
import { StoriesWorkspace } from "@/components/stories/stories-workspace";

export default function StoriesPage() {
  return (
    <Suspense>
      <StoriesWorkspace title="Historias" />
    </Suspense>
  );
}
