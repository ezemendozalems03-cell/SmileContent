import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { CONTENT_KIND_LABELS, CONTENT_PRIORITY_LABELS } from "@/lib/constants/pipeline-status";
import { IDEA_STATUS_LABELS } from "@/lib/constants/idea-status";
import type { IdeaWithRelations } from "@/lib/types/domain";

export function buildIdeasPdf(
  ideas: IdeaWithRelations[],
  meta: { clientName?: string; filtersSummary?: string } = {},
): jsPDF {
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(16);
  doc.text(`Reporte de ideas${meta.clientName ? ` — ${meta.clientName}` : ""}`, 14, 16);

  doc.setFontSize(10);
  doc.setTextColor(120);
  const exportedAt = new Date().toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(`Exportado el ${exportedAt}`, 14, 23);
  if (meta.filtersSummary) {
    doc.text(meta.filtersSummary, 14, 29);
  }
  doc.text(`Total: ${ideas.length} idea${ideas.length === 1 ? "" : "s"}`, 14, meta.filtersSummary ? 35 : 29);

  autoTable(doc, {
    startY: meta.filtersSummary ? 40 : 34,
    head: [["Título", "Pilar / Subpilar", "Tipo", "Estado", "Prioridad", "Fecha sugerida", "Notas"]],
    body: ideas.map((idea) => [
      idea.title,
      [idea.pilar?.name, idea.subpilar?.name].filter(Boolean).join(" / ") || "—",
      CONTENT_KIND_LABELS[idea.tipo_contenido],
      IDEA_STATUS_LABELS[idea.status],
      CONTENT_PRIORITY_LABELS[idea.priority],
      idea.fecha_sugerida ?? "—",
      idea.observaciones_internas ?? "",
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 30, 35] },
    columnStyles: { 6: { cellWidth: 60 } },
  });

  return doc;
}

export function downloadIdeasPdf(
  ideas: IdeaWithRelations[],
  meta: { clientName?: string; filtersSummary?: string } = {},
  filename = "ideas.pdf",
) {
  buildIdeasPdf(ideas, meta).save(filename);
}
