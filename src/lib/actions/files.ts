"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import type { FileKind } from "@/lib/types/database.types";

export async function createFileRecord(params: {
  clientId: string;
  contentItemId?: string;
  storyId?: string;
  kind: FileKind;
  fileName: string;
  storagePath: string;
  mimeType: string | null;
  sizeBytes: number;
}) {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { error } = await supabase.from("files").insert({
    client_id: params.clientId,
    content_item_id: params.contentItemId ?? null,
    story_id: params.storyId ?? null,
    kind: params.kind,
    file_name: params.fileName,
    storage_path: params.storagePath,
    mime_type: params.mimeType,
    size_bytes: params.sizeBytes,
    uploaded_by: profile?.id ?? null,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteFile(id: string, storagePath: string) {
  const supabase = await createClient();
  await supabase.storage.from("content-files").remove([storagePath]);
  const { error } = await supabase.from("files").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}
