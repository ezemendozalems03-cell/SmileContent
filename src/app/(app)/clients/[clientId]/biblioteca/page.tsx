import { Suspense } from "react";
import { BrandLibraryWorkspace } from "@/components/brand-assets/brand-library-workspace";

export default async function ClientBibliotecaPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  return (
    <div className="p-6">
      <Suspense>
        <BrandLibraryWorkspace clientId={clientId} />
      </Suspense>
    </div>
  );
}
