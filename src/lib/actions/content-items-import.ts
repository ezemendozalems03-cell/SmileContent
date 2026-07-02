"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import {
  parseHashtags,
  normalizeKey,
  resolveEnumValue,
  parseLenientDate,
  parseLenientTime,
  parseCount,
} from "@/lib/import/content-csv-normalize";
import { CONTENT_STATUS_ORDER, CONTENT_STATUS_LABELS, CONTENT_KIND_LABELS, CONTENT_PRIORITY_LABELS } from "@/lib/constants/pipeline-status";
import type { ContentKind, ContentStatus, ContentPriority } from "@/lib/types/database.types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** One CSV row after client-side column mapping: target-field keys, human-readable string values. */
export type MappedContentRow = {
  titulo?: string;
  descripcion?: string;
  pilar?: string;
  subpilar?: string;
  formato?: string;
  sub_formato?: string;
  tipo_contenido?: string;
  objetivo?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  fecha_publicacion?: string;
  hora_sugerida?: string;
  hook?: string;
  guion?: string;
  copy?: string;
  cta?: string;
  hashtags?: string;
  link_drive?: string;
  link_canva?: string;
  link_capcut?: string;
  link_publicacion_final?: string;
  vistas?: string;
  likes?: string;
  comentarios_count?: string;
  compartidos?: string;
  guardados?: string;
  consultas_generadas?: string;
  observaciones_internas?: string;
};

export type ImportContentItemsInput = {
  clientId: string;
  rows: MappedContentRow[];
};

export type ImportedRow = { rowIndex: number; titulo: string; contentItemId: string; warnings: string[] };
export type SkippedRow = { rowIndex: number; titulo: string; reason: string };
export type FailedRow = { rowIndex: number; titulo: string; reason: string };

export type ImportContentItemsResult =
  | { error: string }
  | { imported: ImportedRow[]; skipped: SkippedRow[]; failed: FailedRow[] };

function buildTaxonomyMap(
  rows: { id: string; client_id: string | null; name: string }[],
  clientId: string,
): Map<string, string> {
  const map = new Map<string, string>();
  // Insert globals first, then client-scoped — client-scoped wins on a name collision.
  for (const r of rows.filter((r) => r.client_id === null)) map.set(normalizeKey(r.name), r.id);
  for (const r of rows.filter((r) => r.client_id === clientId)) map.set(normalizeKey(r.name), r.id);
  return map;
}

function buildChildMap<K extends "pillar_id" | "format_id">(
  rows: Record<K, string>[] & { id: string; name: string }[],
  parentKey: K,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const r of rows) map.set(`${r[parentKey]}:${normalizeKey(r.name)}`, r.id);
  return map;
}

async function resolveOrCreateTaxonomy(
  supabase: SupabaseServerClient,
  table: "pillars" | "formats",
  map: Map<string, string>,
  rawName: string | undefined,
  clientId: string,
): Promise<string | null> {
  const name = rawName?.trim();
  if (!name) return null;
  const key = normalizeKey(name);
  const existing = map.get(key);
  if (existing) return existing;
  const { data, error } = await supabase.from(table).insert({ client_id: clientId, name }).select("id").single();
  if (error || !data) return null;
  map.set(key, data.id);
  return data.id;
}

async function resolveOrCreateChildTaxonomy(
  supabase: SupabaseServerClient,
  table: "subpillars" | "sub_formats",
  parentColumn: "pillar_id" | "format_id",
  map: Map<string, string>,
  parentId: string,
  rawName: string,
): Promise<string | null> {
  const name = rawName.trim();
  const key = `${parentId}:${normalizeKey(name)}`;
  const existing = map.get(key);
  if (existing) return existing;
  const { data, error } = await supabase
    .from(table)
    .insert({ [parentColumn]: parentId, name } as never)
    .select("id")
    .single();
  if (error || !data) return null;
  map.set(key, data.id);
  return data.id;
}

/**
 * Bulk-imports CSV rows into content_items for a single client, mirroring
 * bulkScheduleIdeas's shape: sequential loop (dedup set + taxonomy maps must
 * update between rows), never throws on a bad row, buckets every row into
 * imported/skipped/failed with a human-readable reason.
 */
export async function importContentItemsFromCsv(input: ImportContentItemsInput): Promise<ImportContentItemsResult> {
  if (!input.clientId) return { error: "Seleccioná un cliente antes de importar." };
  if (!input.rows.length) return { error: "El archivo no tiene filas para importar." };

  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: existingItems, error: existingError } = await supabase
    .from("content_items")
    .select("titulo")
    .eq("client_id", input.clientId);
  if (existingError) return { error: existingError.message };
  const seenTitles = new Set((existingItems ?? []).map((i) => normalizeKey(i.titulo)));

  const scope = `client_id.is.null,client_id.eq.${input.clientId}`;
  const [pillarsRes, subpillarsRes, formatsRes, subFormatsRes, profilesRes] = await Promise.all([
    supabase.from("pillars").select("id, client_id, name").or(scope),
    supabase.from("subpillars").select("id, pillar_id, name"),
    supabase.from("formats").select("id, client_id, name").or(scope),
    supabase.from("sub_formats").select("id, format_id, name"),
    supabase.from("profiles").select("id, full_name").eq("is_active", true),
  ]);
  for (const res of [pillarsRes, subpillarsRes, formatsRes, subFormatsRes, profilesRes]) {
    if (res.error) return { error: res.error.message };
  }

  const pillarMap = buildTaxonomyMap(pillarsRes.data ?? [], input.clientId);
  const formatMap = buildTaxonomyMap(formatsRes.data ?? [], input.clientId);
  const subpillarMap = buildChildMap(subpillarsRes.data ?? [], "pillar_id");
  const subFormatMap = buildChildMap(subFormatsRes.data ?? [], "format_id");
  const assigneeMap = new Map((profilesRes.data ?? []).map((p) => [normalizeKey(p.full_name), p.id]));

  const imported: ImportedRow[] = [];
  const skipped: SkippedRow[] = [];
  const failed: FailedRow[] = [];

  for (let i = 0; i < input.rows.length; i++) {
    const row = input.rows[i];
    const warnings: string[] = [];
    const titulo = (row.titulo ?? "").trim();

    if (!titulo) {
      failed.push({ rowIndex: i, titulo: "(sin título)", reason: "El título está vacío." });
      continue;
    }
    const normTitulo = normalizeKey(titulo);
    if (seenTitles.has(normTitulo)) {
      skipped.push({ rowIndex: i, titulo, reason: "Ya existe una publicación con este título para este cliente." });
      continue;
    }

    const pilarId = await resolveOrCreateTaxonomy(supabase, "pillars", pillarMap, row.pilar, input.clientId);
    const formatoId = await resolveOrCreateTaxonomy(supabase, "formats", formatMap, row.formato, input.clientId);

    let subpilarId: string | null = null;
    if (row.subpilar?.trim()) {
      if (!pilarId) {
        warnings.push(`No se pudo asignar el subpilar "${row.subpilar}" porque el pilar no se pudo resolver.`);
      } else {
        subpilarId = await resolveOrCreateChildTaxonomy(supabase, "subpillars", "pillar_id", subpillarMap, pilarId, row.subpilar);
      }
    }
    let subFormatoId: string | null = null;
    if (row.sub_formato?.trim()) {
      if (!formatoId) {
        warnings.push(`No se pudo asignar el sub-formato "${row.sub_formato}" porque el formato no se pudo resolver.`);
      } else {
        subFormatoId = await resolveOrCreateChildTaxonomy(supabase, "sub_formats", "format_id", subFormatMap, formatoId, row.sub_formato);
      }
    }

    let assigneeId: string | null = null;
    if (row.assignee?.trim()) {
      assigneeId = assigneeMap.get(normalizeKey(row.assignee)) ?? null;
      if (!assigneeId) warnings.push(`No se encontró un responsable activo llamado "${row.assignee}".`);
    }

    let tipoContenido: ContentKind = "post";
    if (row.tipo_contenido?.trim()) {
      const resolved = resolveEnumValue(row.tipo_contenido, ["post", "story", "reel", "tiktok"] as const, CONTENT_KIND_LABELS);
      if (resolved) tipoContenido = resolved;
      else warnings.push(`Tipo de contenido "${row.tipo_contenido}" no reconocido, se usó "Post".`);
    }
    let status: ContentStatus = "idea";
    if (row.status?.trim()) {
      const resolved = resolveEnumValue(row.status, CONTENT_STATUS_ORDER, CONTENT_STATUS_LABELS);
      if (resolved) status = resolved;
      else warnings.push(`Estado "${row.status}" no reconocido, se usó "Idea".`);
    }
    let priority: ContentPriority = "media";
    if (row.priority?.trim()) {
      const resolved = resolveEnumValue(row.priority, ["baja", "media", "alta", "urgente"] as const, CONTENT_PRIORITY_LABELS);
      if (resolved) priority = resolved;
      else warnings.push(`Prioridad "${row.priority}" no reconocida, se usó "Media".`);
    }

    let fechaPublicacion: string | null = null;
    if (row.fecha_publicacion?.trim()) {
      fechaPublicacion = parseLenientDate(row.fecha_publicacion);
      if (!fechaPublicacion) warnings.push(`No se pudo interpretar la fecha "${row.fecha_publicacion}".`);
    }
    let horaSugerida: string | null = null;
    if (row.hora_sugerida?.trim()) {
      horaSugerida = parseLenientTime(row.hora_sugerida);
      if (!horaSugerida) warnings.push(`No se pudo interpretar la hora "${row.hora_sugerida}".`);
    }

    const { data: inserted, error: insertError } = await supabase
      .from("content_items")
      .insert({
        client_id: input.clientId,
        titulo,
        descripcion: row.descripcion?.trim() || null,
        pilar_id: pilarId,
        subpilar_id: subpilarId,
        formato_id: formatoId,
        sub_formato_id: subFormatoId,
        tipo_contenido: tipoContenido,
        objetivo: row.objetivo?.trim() || null,
        status,
        priority,
        assignee_id: assigneeId,
        created_by: profile?.id ?? null,
        fecha_publicacion: fechaPublicacion,
        hora_sugerida: horaSugerida,
        hook: row.hook?.trim() || null,
        guion: row.guion?.trim() || null,
        copy: row.copy?.trim() || null,
        cta: row.cta?.trim() || null,
        hashtags: row.hashtags ? parseHashtags(row.hashtags) : [],
        link_drive: row.link_drive?.trim() || null,
        link_canva: row.link_canva?.trim() || null,
        link_capcut: row.link_capcut?.trim() || null,
        link_publicacion_final: row.link_publicacion_final?.trim() || null,
        vistas: parseCount(row.vistas),
        likes: parseCount(row.likes),
        comentarios_count: parseCount(row.comentarios_count),
        compartidos: parseCount(row.compartidos),
        guardados: parseCount(row.guardados),
        consultas_generadas: parseCount(row.consultas_generadas),
        observaciones_internas: row.observaciones_internas?.trim() || null,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      failed.push({ rowIndex: i, titulo, reason: insertError?.message ?? "No se pudo crear la publicación." });
      continue;
    }

    seenTitles.add(normTitulo);
    imported.push({ rowIndex: i, titulo, contentItemId: inserted.id, warnings });
  }

  revalidatePath("/content");

  return { imported, skipped, failed };
}
