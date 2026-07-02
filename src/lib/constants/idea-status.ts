import type { IdeaStatus } from "@/lib/types/database.types";

export const IDEA_STATUS_ORDER: IdeaStatus[] = [
  "idea",
  "en_desarrollo",
  "aprobado",
  "calendarizado",
  "publicado",
];

export const IDEA_STATUS_LABELS: Record<IdeaStatus, string> = {
  idea: "Idea",
  en_desarrollo: "En desarrollo",
  aprobado: "Aprobado",
  calendarizado: "Calendarizado",
  publicado: "Publicado",
};

export const IDEA_STATUS_COLORS: Record<IdeaStatus, string> = {
  idea: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  en_desarrollo: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  aprobado: "bg-lime-500/15 text-lime-300 border-lime-500/30",
  calendarizado: "bg-teal-500/15 text-teal-300 border-teal-500/30",
  publicado: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};
