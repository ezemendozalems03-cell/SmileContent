"use client";

import { useFiles } from "@/lib/queries/use-files";
import { FileUploader } from "@/components/files/file-uploader";
import { FileList } from "@/components/files/file-list";
import { FILE_KIND_LABELS } from "@/lib/constants/pipeline-status";
import type { FileKind } from "@/lib/types/database.types";

const KINDS: FileKind[] = ["miniatura", "archivo_editable", "archivo_final"];

export function ContentFilesPanel({ clientId, contentItemId }: { clientId: string; contentItemId: string }) {
  const { data: files } = useFiles({ contentItemId });

  return (
    <div className="space-y-5">
      {KINDS.map((kind) => (
        <div key={kind} className="space-y-2">
          <p className="text-sm font-medium">{FILE_KIND_LABELS[kind]}</p>
          <FileUploader clientId={clientId} parent={{ contentItemId }} kind={kind} />
          <FileList files={(files ?? []).filter((f) => f.kind === kind)} parent={{ contentItemId }} />
        </div>
      ))}
    </div>
  );
}
