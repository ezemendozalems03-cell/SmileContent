"use client";

import { toast } from "sonner";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadIdeasCsv } from "@/lib/export/ideas-csv";
import { downloadIdeasPdf } from "@/lib/export/ideas-pdf";
import type { IdeaWithRelations } from "@/lib/types/domain";

export function IdeasExportMenu({
  ideas,
  clientName,
}: {
  ideas: IdeaWithRelations[];
  clientName?: string;
}) {
  const disabled = ideas.length === 0;

  function handleCsv() {
    if (disabled) {
      toast.error("No hay ideas para exportar con estos filtros.");
      return;
    }
    downloadIdeasCsv(ideas);
  }

  function handlePdf() {
    if (disabled) {
      toast.error("No hay ideas para exportar con estos filtros.");
      return;
    }
    downloadIdeasPdf(ideas, { clientName });
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button variant="outline" size="sm" disabled={disabled} onClick={handlePdf}>
        <FileDown className="size-3.5" />
        Exportar PDF
      </Button>
      <Button variant="outline" size="sm" disabled={disabled} onClick={handleCsv}>
        <FileSpreadsheet className="size-3.5" />
        Exportar CSV
      </Button>
    </div>
  );
}
