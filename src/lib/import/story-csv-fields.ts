export type StoryCsvFieldKind =
  | "text"
  | "url"
  | "date"
  | "time"
  | "taxonomy_story_type"
  | "enum_status"
  | "assignee_name";

export type StoryCsvFieldDef = {
  key: string;
  label: string;
  kind: StoryCsvFieldKind;
  required?: boolean;
};

/**
 * Stories' own field catalog — deliberately separate from
 * content-csv-fields.ts (different schema: no priority/hashtags/metrics,
 * flat story_types instead of pilar/subpilar). Single source of truth for
 * the mapping Selects and the server-side normalizer.
 */
export const STORY_CSV_IMPORTABLE_FIELDS: StoryCsvFieldDef[] = [
  { key: "nombre", label: "Nombre", kind: "text", required: true },
  { key: "fecha", label: "Fecha", kind: "date", required: true },
  { key: "hora", label: "Hora", kind: "time" },
  { key: "story_type", label: "Tipo de historia", kind: "taxonomy_story_type" },
  { key: "objetivo", label: "Objetivo", kind: "text" },
  { key: "status", label: "Estado", kind: "enum_status" },
  { key: "assignee", label: "Responsable", kind: "assignee_name" },
  { key: "texto", label: "Texto", kind: "text" },
  { key: "sticker", label: "Sticker", kind: "text" },
  { key: "link", label: "Link", kind: "url" },
  { key: "cta", label: "CTA", kind: "text" },
  { key: "observacion", label: "Observación", kind: "text" },
  { key: "respuesta_esperada", label: "Respuesta esperada", kind: "text" },
];

/** Sentinel for "don't import this CSV column" — same convention as CSV_IGNORE_VALUE. */
export const STORY_CSV_IGNORE_VALUE = "__ignore__";
