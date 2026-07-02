"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createBrandAsset } from "@/lib/actions/brand-assets";
import { useInvalidateBrandAssets } from "@/lib/queries/use-brand-assets";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BRAND_ASSET_CATEGORIES } from "@/lib/constants/brand-asset-categories";

const NONE = "__none__";

export function BrandAssetUploader({ clientId }: { clientId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(NONE);
  const [uploading, setUploading] = useState(false);
  const invalidateBrandAssets = useInvalidateBrandAssets();

  function handleFileSelected(fileList: FileList | null) {
    const selected = fileList?.[0];
    if (!selected) return;
    setFile(selected);
    setName(selected.name);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);

    const storagePath = `${clientId}/_brand/${crypto.randomUUID()}-${file.name}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage.from("content-files").upload(storagePath, file);

    if (uploadError) {
      setUploading(false);
      toast.error("No se pudo subir el archivo", { description: uploadError.message });
      return;
    }

    const result = await createBrandAsset({
      clientId,
      name: name.trim() || file.name,
      assetType: category === NONE ? null : category,
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
    invalidateBrandAssets(clientId);
    setFile(null);
    setName("");
    setCategory(NONE);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (!file) {
    return (
      <div
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-4 py-8 text-center transition-colors hover:border-primary hover:bg-accent/30"
      >
        <UploadCloud className="size-5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Hacé clic para subir un archivo de marca</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => handleFileSelected(e.target.files)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="brand-asset-name">Nombre</Label>
          <Input id="brand-asset-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Categoría</Label>
          <Select
            items={{
              [NONE]: "Sin categoría",
              ...Object.fromEntries(BRAND_ASSET_CATEGORIES.map((c) => [c, c])),
            }}
            value={category}
            onValueChange={(v) => setCategory(v ?? NONE)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sin categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Sin categoría</SelectItem>
              {BRAND_ASSET_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="truncate text-xs text-muted-foreground">{file.name}</p>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setFile(null)} disabled={uploading}>
          Cancelar
        </Button>
        <Button type="button" onClick={handleUpload} disabled={uploading}>
          {uploading ? "Subiendo…" : "Subir archivo"}
        </Button>
      </div>
    </div>
  );
}
