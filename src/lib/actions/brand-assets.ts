"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { brandAssetSchema, renameBrandAssetSchema } from "@/lib/validation/brand-asset";

export async function createBrandAsset(params: {
  clientId: string;
  name: string;
  assetType: string | null;
  storagePath: string;
  mimeType: string | null;
  sizeBytes: number;
}) {
  const parsed = brandAssetSchema.safeParse({ name: params.name, asset_type: params.assetType ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const supabase = await createClient();
  const { error } = await supabase.from("brand_assets").insert({
    client_id: params.clientId,
    name: parsed.data.name,
    asset_type: parsed.data.asset_type,
    storage_path: params.storagePath,
    mime_type: params.mimeType,
    size_bytes: params.sizeBytes,
  });

  if (error) return { error: error.message };
  revalidatePath(`/clients/${params.clientId}/biblioteca`);
  return { success: true };
}

export async function renameBrandAsset(id: string, clientId: string, name: string) {
  const parsed = renameBrandAssetSchema.safeParse({ name });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const supabase = await createClient();
  const { error } = await supabase.from("brand_assets").update({ name: parsed.data.name }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/clients/${clientId}/biblioteca`);
  return { success: true };
}

export async function deleteBrandAsset(id: string, clientId: string, storagePath: string) {
  const supabase = await createClient();
  await supabase.storage.from("content-files").remove([storagePath]);
  const { error } = await supabase.from("brand_assets").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/clients/${clientId}/biblioteca`);
  return { success: true };
}
