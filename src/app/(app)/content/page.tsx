import { Suspense } from "react";
import { ContentWorkspace } from "@/components/content/content-workspace";

export default function ContentPage() {
  return (
    <Suspense>
      <ContentWorkspace title="Contenido" />
    </Suspense>
  );
}
