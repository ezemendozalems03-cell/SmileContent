"use client";

import { toast } from "sonner";
import { File as FileIcon, Download, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { deleteFile } from "@/lib/actions/files";
import { useInvalidateFiles } from "@/lib/queries/use-files";
import type { FileRow } from "@/lib/types/domain";

type Parent = { contentItemId: string } | { storyId: string };

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileList({
  files,
  parent,
  readOnly = false,
}: {
  files: FileRow[];
  parent: Parent;
  readOnly?: boolean;
}) {
  const invalidateFiles = useInvalidateFiles();

  async function handleDownload(file: FileRow) {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("content-files")
      .createSignedUrl(file.storage_path, 60);
    if (error || !data) {
      toast.error("No se pudo generar el link de descarga");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  async function handleDelete(file: FileRow) {
    if (!confirm(`¿Eliminar ${file.file_name}?`)) return;
    const result = await deleteFile(file.id, file.storage_path);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    invalidateFiles(parent);
  }

  if (files.length === 0) {
    return <p className="text-xs text-muted-foreground">Sin archivos todavía.</p>;
  }

  return (
    <div className="space-y-1.5">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-sm"
        >
          <FileIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">{file.file_name}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{formatSize(file.size_bytes)}</span>
          <button type="button" onClick={() => handleDownload(file)} className="shrink-0 text-muted-foreground hover:text-foreground">
            <Download className="size-3.5" />
          </button>
          {readOnly ? null : (
            <button type="button" onClick={() => handleDelete(file)} className="shrink-0 text-muted-foreground hover:text-destructive">
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
