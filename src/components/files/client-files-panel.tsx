"use client";

import { useFiles } from "@/lib/queries/use-files";
import { FileList } from "@/components/files/file-list";
import { FILE_KIND_LABELS } from "@/lib/constants/pipeline-status";
import type { FileKind } from "@/lib/types/database.types";

const KINDS: FileKind[] = ["archivo_final", "miniatura"];

export function ClientFilesPanel({ contentItemId }: { contentItemId: string }) {
  const { data: files } = useFiles({ contentItemId });

  return (
    <div className="space-y-5">
      {KINDS.map((kind) => (
        <div key={kind} className="space-y-2">
          <p className="text-sm font-medium">{FILE_KIND_LABELS[kind]}</p>
          <FileList files={(files ?? []).filter((f) => f.kind === kind)} parent={{ contentItemId }} readOnly />
        </div>
      ))}
    </div>
  );
}
