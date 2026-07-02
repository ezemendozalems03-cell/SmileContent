import type { ContentStatus, StoryStatus } from "@/lib/types/database.types";

export const CONTENT_STATUS_ORDER: ContentStatus[] = [
  "idea",
  "investigacion",
  "guion",
  "diseno",
  "grabacion",
  "edicion",
  "revision_interna",
  "enviado_al_cliente",
  "correcciones",
  "aprobado",
  "programado",
  "publicado",
  "medido",
  "archivado",
];

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  idea: "Idea",
  investigacion: "Investigación",
  guion: "Guion",
  diseno: "Diseño",
  grabacion: "Grabación",
  edicion: "Edición",
  revision_interna: "Revisión interna",
  enviado_al_cliente: "Enviado al cliente",
  correcciones: "Correcciones",
  aprobado: "Aprobado",
  programado: "Programado",
  publicado: "Publicado",
  medido: "Medido",
  archivado: "Archivado",
};

/** Tailwind classes per status — used by status-badge.tsx and Kanban columns. */
export const CONTENT_STATUS_COLORS: Record<ContentStatus, string> = {
  idea: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  investigacion: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  guion: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  diseno: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
  grabacion: "bg-pink-500/15 text-pink-300 border-pink-500/30",
  edicion: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  revision_interna: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  enviado_al_cliente: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  correcciones: "bg-red-500/15 text-red-300 border-red-500/30",
  aprobado: "bg-lime-500/15 text-lime-300 border-lime-500/30",
  programado: "bg-teal-500/15 text-teal-300 border-teal-500/30",
  publicado: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  medido: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  archivado: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

export const CONTENT_PRIORITY_LABELS = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  urgente: "Urgente",
} as const;

export const CONTENT_PRIORITY_COLORS: Record<string, string> = {
  baja: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  media: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  alta: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  urgente: "bg-red-500/15 text-red-300 border-red-500/30",
};

export const CONTENT_KIND_LABELS = {
  post: "Post",
  story: "Historia",
  reel: "Reel",
  tiktok: "TikTok",
} as const;

export const CLIENT_STATUS_LABELS = {
  activo: "Activo",
  pausado: "Pausado",
  finalizado: "Finalizado",
  prospecto: "Prospecto",
} as const;

export const CLIENT_STATUS_COLORS: Record<string, string> = {
  activo: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  pausado: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  finalizado: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  prospecto: "bg-sky-500/15 text-sky-300 border-sky-500/30",
};

export const STORY_STATUS_ORDER: StoryStatus[] = ["idea", "diseno", "lista", "programada", "publicada", "archivada"];

export const STORY_STATUS_LABELS = {
  idea: "Idea",
  diseno: "Diseño",
  lista: "Lista",
  programada: "Programada",
  publicada: "Publicada",
  archivada: "Archivada",
} as const;

export const FILE_KIND_LABELS = {
  miniatura: "Miniatura",
  archivo_editable: "Archivo editable",
  archivo_final: "Archivo final",
  otro: "Otro",
} as const;

export const STORY_STATUS_COLORS: Record<string, string> = {
  idea: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  diseno: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
  lista: "bg-teal-500/15 text-teal-300 border-teal-500/30",
  programada: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  publicada: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  archivada: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};
