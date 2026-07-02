"use client";

import { Library } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { useBrandAssets } from "@/lib/queries/use-brand-assets";
import { BrandAssetUploader } from "@/components/brand-assets/brand-asset-uploader";
import { BrandAssetList } from "@/components/brand-assets/brand-asset-list";

export function BrandLibraryWorkspace({ clientId }: { clientId: string }) {
  const { data: assets, isLoading } = useBrandAssets(clientId);

  return (
    <div className="space-y-6">
      <BrandAssetUploader clientId={clientId} />

      {isLoading ? null : assets && assets.length > 0 ? (
        <BrandAssetList assets={assets} clientId={clientId} />
      ) : (
        <EmptyState
          icon={Library}
          title="Todavía no hay archivos"
          description="Subí logos, el manual de marca, fotos, videos y plantillas para este cliente."
        />
      )}
    </div>
  );
}
