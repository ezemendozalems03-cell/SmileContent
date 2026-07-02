export type CsvFieldKind =
  | "text"
  | "url"
  | "hashtags"
  | "date"
  | "time"
  | "number"
  | "taxonomy_pilar"
  | "taxonomy_subpilar"
  | "taxonomy_formato"
  | "taxonomy_subformato"
  | "enum_tipo_contenido"
  | "enum_status"
  | "enum_priority"
  | "assignee_name";

export type CsvFieldDef = {
  key: string;
  label: string;
  kind: CsvFieldKind;
  required?: boolean;
};

/**
 * Single source of truth for importable content_items fields, consumed by
 * both the column-mapping Selects and the server-side normalizer so the two
 * never drift apart. Deliberately excludes campaign_id (decorative elsewhere
 * in this app), feedback_cliente (client-portal-only, read-only internally),
 * client_id (chosen once per import, not per row), and system-managed
 * columns (id/created_by/created_at/updated_at/search_vector).
 */
export const CSV_IMPORTABLE_FIELDS: CsvFieldDef[] = [
  { key: "titulo", label: "Título", kind: "text", required: true },
  { key: "descripcion", label: "Descripción", kind: "text" },
  { key: "pilar", label: "Pilar", kind: "taxonomy_pilar" },
  { key: "subpilar", label: "Subpilar", kind: "taxonomy_subpilar" },
  { key: "formato", label: "Formato", kind: "taxonomy_formato" },
  { key: "sub_formato", label: "Sub formato", kind: "taxonomy_subformato" },
  { key: "tipo_contenido", label: "Tipo de contenido", kind: "enum_tipo_contenido" },
  { key: "objetivo", label: "Objetivo", kind: "text" },
  { key: "status", label: "Estado", kind: "enum_status" },
  { key: "priority", label: "Prioridad", kind: "enum_priority" },
  { key: "assignee", label: "Responsable", kind: "assignee_name" },
  { key: "fecha_publicacion", label: "Fecha de publicación", kind: "date" },
  { key: "hora_sugerida", label: "Hora sugerida", kind: "time" },
  { key: "hook", label: "Hook", kind: "text" },
  { key: "guion", label: "Guion", kind: "text" },
  { key: "copy", label: "Copy", kind: "text" },
  { key: "cta", label: "CTA", kind: "text" },
  { key: "hashtags", label: "Hashtags", kind: "hashtags" },
  { key: "link_drive", label: "Link Drive", kind: "url" },
  { key: "link_canva", label: "Link Canva", kind: "url" },
  { key: "link_capcut", label: "Link CapCut", kind: "url" },
  { key: "link_publicacion_final", label: "Link publicación final", kind: "url" },
  { key: "vistas", label: "Vistas", kind: "number" },
  { key: "likes", label: "Likes", kind: "number" },
  { key: "comentarios_count", label: "Comentarios", kind: "number" },
  { key: "compartidos", label: "Compartidos", kind: "number" },
  { key: "guardados", label: "Guardados", kind: "number" },
  { key: "consultas_generadas", label: "Consultas generadas", kind: "number" },
  { key: "observaciones_internas", label: "Observaciones internas", kind: "text" },
];

/** Sentinel for "don't import this CSV column" in the mapping Select, mirroring the app-wide "__none__" convention. */
export const CSV_IGNORE_VALUE = "__ignore__";
