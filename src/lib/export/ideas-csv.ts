import { CONTENT_KIND_LABELS, CONTENT_PRIORITY_LABELS } from "@/lib/constants/pipeline-status";
import { IDEA_STATUS_LABELS } from "@/lib/constants/idea-status";
import type { IdeaWithRelations } from "@/lib/types/domain";

const HEADERS = [
  "id",
  "titulo",
  "descripcion",
  "pilar",
  "subpilar",
  "tipo_contenido",
  "estado",
  "prioridad",
  "gancho",
  "copy",
  "cta",
  "fecha_sugerida",
  "notas",
  "comentarios_cliente",
  "creado_en",
  "actualizado_en",
] as const;

function escapeCsvField(value: string | null | undefined): string {
  const str = value ?? "";
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function ideaToRow(idea: IdeaWithRelations): string[] {
  return [
    idea.id,
    idea.title,
    idea.description ?? "",
    idea.pilar?.name ?? "",
    idea.subpilar?.name ?? "",
    CONTENT_KIND_LABELS[idea.tipo_contenido],
    IDEA_STATUS_LABELS[idea.status],
    CONTENT_PRIORITY_LABELS[idea.priority],
    idea.hook ?? "",
    idea.copy ?? "",
    idea.cta ?? "",
    idea.fecha_sugerida ?? "",
    idea.observaciones_internas ?? "",
    idea.feedback_cliente ?? "",
    idea.created_at,
    idea.updated_at,
  ];
}

export function buildIdeasCsv(ideas: IdeaWithRelations[]): string {
  const lines = [HEADERS.join(",")];
  for (const idea of ideas) {
    lines.push(ideaToRow(idea).map(escapeCsvField).join(","));
  }
  return lines.join("\r\n");
}

export function downloadIdeasCsv(ideas: IdeaWithRelations[], filename = "ideas.csv") {
  const csv = buildIdeasCsv(ideas);
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
