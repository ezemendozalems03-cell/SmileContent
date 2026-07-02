"use client";

import { useState } from "react";
import { toast } from "sonner";
import { File as FileIcon, Download, Trash2, Pencil, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { renameBrandAsset, deleteBrandAsset } from "@/lib/actions/brand-assets";
import { useInvalidateBrandAssets } from "@/lib/queries/use-brand-assets";
import { Input } from "@/components/ui/input";
import type { BrandAsset } from "@/lib/types/domain";

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AssetRow({ asset, clientId }: { asset: BrandAsset; clientId: string }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(asset.name);
  const invalidateBrandAssets = useInvalidateBrandAssets();

  async function handleDownload() {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("content-files")
      .createSignedUrl(asset.storage_path, 60);
    if (error || !data) {
      toast.error("No se pudo generar el link de descarga");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  async function handleRename() {
    const result = await renameBrandAsset(asset.id, clientId, name);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setEditing(false);
    invalidateBrandAssets(clientId);
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar ${asset.name}?`)) return;
    const result = await deleteBrandAsset(asset.id, clientId, asset.storage_path);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    invalidateBrandAssets(clientId);
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-sm">
      <FileIcon className="size-4 shrink-0 text-muted-foreground" />
      {editing ? (
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-7 flex-1"
          autoFocus
        />
      ) : (
        <span className="min-w-0 flex-1 truncate">{asset.name}</span>
      )}
      <span className="shrink-0 text-xs text-muted-foreground">{formatSize(asset.size_bytes)}</span>
      {editing ? (
        <>
          <button type="button" onClick={handleRename} className="shrink-0 text-muted-foreground hover:text-foreground">
            <Check className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setName(asset.name);
            }}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </>
      ) : (
        <button type="button" onClick={() => setEditing(true)} className="shrink-0 text-muted-foreground hover:text-foreground">
          <Pencil className="size-3.5" />
        </button>
      )}
      <button type="button" onClick={handleDownload} className="shrink-0 text-muted-foreground hover:text-foreground">
        <Download className="size-3.5" />
      </button>
      <button type="button" onClick={handleDelete} className="shrink-0 text-muted-foreground hover:text-destructive">
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

export function BrandAssetList({ assets, clientId }: { assets: BrandAsset[]; clientId: string }) {
  const groups = new Map<string, BrandAsset[]>();
  for (const asset of assets) {
    const key = asset.asset_type ?? "Otro";
    groups.set(key, [...(groups.get(key) ?? []), asset]);
  }

  return (
    <div className="space-y-5">
      {[...groups.entries()].map(([category, items]) => (
        <div key={category} className="space-y-2">
          <p className="text-sm font-medium">{category}</p>
          <div className="space-y-1.5">
            {items.map((asset) => (
              <AssetRow key={asset.id} asset={asset} clientId={clientId} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
