"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createFileRecord } from "@/lib/actions/files";
import { useInvalidateFiles } from "@/lib/queries/use-files";
import { cn } from "@/lib/utils";
import type { FileKind } from "@/lib/types/database.types";

type Parent = { contentItemId: string } | { storyId: string };

export function FileUploader({
  clientId,
  parent,
  kind,
  label,
}: {
  clientId: string;
  parent: Parent;
  kind: FileKind;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const invalidateFiles = useInvalidateFiles();

  async function handleFiles(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    setUploading(true);
    const parentId = "contentItemId" in parent ? parent.contentItemId : parent.storyId;
    const storagePath = `${clientId}/${parentId}/${kind}/${crypto.randomUUID()}-${file.name}`;

    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from("content-files")
      .upload(storagePath, file);

    if (uploadError) {
      setUploading(false);
      toast.error("No se pudo subir el archivo", { description: uploadError.message });
      return;
    }

    const result = await createFileRecord({
      clientId,
      contentItemId: "contentItemId" in parent ? parent.contentItemId : undefined,
      storyId: "storyId" in parent ? parent.storyId : undefined,
      kind,
      fileName: file.name,
      storagePath,
      mimeType: file.type || null,
      sizeBytes: file.size,
    });

    setUploading(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Archivo subido");
    invalidateFiles(parent);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-4 py-6 text-center transition-colors",
        dragOver && "border-primary bg-accent/30",
      )}
    >
      <UploadCloud className="size-5 text-muted-foreground" />
      <p className="text-xs text-muted-foreground">
        {uploading ? "Subiendo…" : label ?? "Arrastrá un archivo o hacé clic para subir"}
      </p>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
