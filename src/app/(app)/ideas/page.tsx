import { Suspense } from "react";
import { IdeasWorkspace } from "@/components/ideas/ideas-workspace";

export default function IdeasPage() {
  return (
    <Suspense>
      <IdeasWorkspace />
    </Suspense>
  );
}
