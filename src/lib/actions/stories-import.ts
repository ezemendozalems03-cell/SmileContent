"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { normalizeKey, resolveEnumValue, parseLenientDate, parseLenientTime } from "@/lib/import/content-csv-normalize";
import { STORY_STATUS_ORDER, STORY_STATUS_LABELS } from "@/lib/constants/pipeline-status";
import type { StoryStatus } from "@/lib/types/database.types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** One CSV row after client-side column mapping: target-field keys, human-readable string values. */
export type MappedStoryRow = {
  nombre?: string;
  fecha?: string;
  hora?: string;
  story_type?: string;
  objetivo?: string;
  status?: string;
  assignee?: string;
  texto?: string;
  sticker?: string;
  link?: string;
  cta?: string;
  observacion?: string;
  respuesta_esperada?: string;
};

export type ImportStoriesInput = {
  clientId: string;
  rows: MappedStoryRow[];
};

export type ImportedStoryRow = { rowIndex: number; nombre: string; storyId: string; warnings: string[] };
export type SkippedStoryRow = { rowIndex: number; nombre: string; reason: string };
export type FailedStoryRow = { rowIndex: number; nombre: string; reason: string };

export type ImportStoriesResult =
  | { error: string }
  | { imported: ImportedStoryRow[]; skipped: SkippedStoryRow[]; failed: FailedStoryRow[] };

/** story_types has no child table (unlike pillars->subpillars) — a single flat lookup-or-create. */
async function resolveOrCreateStoryType(
  supabase: SupabaseServerClient,
  map: Map<string, string>,
  rawName: string | undefined,
  clientId: string,
): Promise<string | null> {
  const name = rawName?.trim();
  if (!name) return null;
  const key = normalizeKey(name);
  const existing = map.get(key);
  if (existing) return existing;
  const { data, error } = await supabase.from("story_types").insert({ client_id: clientId, name }).select("id").single();
  if (error || !data) return null;
  map.set(key, data.id);
  return data.id;
}

/**
 * Bulk-imports CSV rows into stories for a single client, mirroring
 * importContentItemsFromCsv's shape: sequential loop, never throws, buckets
 * every row into imported/skipped/failed. Dedup key is nombre+fecha (not
 * nombre alone) since stories.fecha is NOT NULL and recurring story concepts
 * reused on a new date must be allowed to re-import.
 */
export async function importStoriesFromCsv(input: ImportStoriesInput): Promise<ImportStoriesResult> {
  if (!input.clientId) return { error: "Seleccioná un cliente antes de importar." };
  if (!input.rows.length) return { error: "El archivo no tiene filas para importar." };

  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: existingStories, error: existingError } = await supabase
    .from("stories")
    .select("nombre, fecha")
    .eq("client_id", input.clientId);
  if (existingError) return { error: existingError.message };
  const seenKeys = new Set((existingStories ?? []).map((s) => `${normalizeKey(s.nombre)}|${s.fecha}`));

  const scope = `client_id.is.null,client_id.eq.${input.clientId}`;
  const [storyTypesRes, profilesRes] = await Promise.all([
    supabase.from("story_types").select("id, client_id, name").or(scope),
    supabase.from("profiles").select("id, full_name").eq("is_active", true),
  ]);
  if (storyTypesRes.error) return { error: storyTypesRes.error.message };
  if (profilesRes.error) return { error: profilesRes.error.message };

  const storyTypeMap = new Map<string, string>();
  for (const t of (storyTypesRes.data ?? []).filter((t) => t.client_id === null)) storyTypeMap.set(normalizeKey(t.name), t.id);
  for (const t of (storyTypesRes.data ?? []).filter((t) => t.client_id === input.clientId)) storyTypeMap.set(normalizeKey(t.name), t.id);
  const assigneeMap = new Map((profilesRes.data ?? []).map((p) => [normalizeKey(p.full_name), p.id]));

  const imported: ImportedStoryRow[] = [];
  const skipped: SkippedStoryRow[] = [];
  const failed: FailedStoryRow[] = [];

  for (let i = 0; i < input.rows.length; i++) {
    const row = input.rows[i];
    const warnings: string[] = [];
    const nombre = (row.nombre ?? "").trim();

    if (!nombre) {
      failed.push({ rowIndex: i, nombre: "(sin nombre)", reason: "El nombre está vacío." });
      continue;
    }

    // fecha is NOT NULL at the DB level (unlike content_items.fecha_publicacion),
    // so a missing/unparseable fecha must be a hard failure, not an
    // imported-with-warning that would otherwise surface as an opaque
    // Postgres constraint violation at insert time.
    const rawFecha = (row.fecha ?? "").trim();
    if (!rawFecha) {
      failed.push({ rowIndex: i, nombre, reason: "La fecha está vacía (es un campo obligatorio)." });
      continue;
    }
    const fecha = parseLenientDate(rawFecha);
    if (!fecha) {
      failed.push({ rowIndex: i, nombre, reason: `No se pudo interpretar la fecha "${rawFecha}".` });
      continue;
    }

    const dedupKey = `${normalizeKey(nombre)}|${fecha}`;
    if (seenKeys.has(dedupKey)) {
      skipped.push({ rowIndex: i, nombre, reason: `Ya existe una historia "${nombre}" con fecha ${fecha} para este cliente.` });
      continue;
    }

    const storyTypeId = await resolveOrCreateStoryType(supabase, storyTypeMap, row.story_type, input.clientId);

    let assigneeId: string | null = null;
    if (row.assignee?.trim()) {
      assigneeId = assigneeMap.get(normalizeKey(row.assignee)) ?? null;
      if (!assigneeId) warnings.push(`No se encontró un responsable activo llamado "${row.assignee}".`);
    }

    let status: StoryStatus = "idea";
    if (row.status?.trim()) {
      const resolved = resolveEnumValue(row.status, STORY_STATUS_ORDER, STORY_STATUS_LABELS);
      if (resolved) status = resolved;
      else warnings.push(`Estado "${row.status}" no reconocido, se usó "Idea".`);
    }

    let hora: string | null = null;
    if (row.hora?.trim()) {
      hora = parseLenientTime(row.hora);
      if (!hora) warnings.push(`No se pudo interpretar la hora "${row.hora}".`);
    }

    const { data: inserted, error: insertError } = await supabase
      .from("stories")
      .insert({
        client_id: input.clientId,
        nombre,
        fecha,
        hora,
        story_type_id: storyTypeId,
        objetivo: row.objetivo?.trim() || null,
        status,
        assignee_id: assigneeId,
        texto: row.texto?.trim() || null,
        sticker: row.sticker?.trim() || null,
        link: row.link?.trim() || null,
        cta: row.cta?.trim() || null,
        observacion: row.observacion?.trim() || null,
        respuesta_esperada: row.respuesta_esperada?.trim() || null,
        created_by: profile?.id ?? null,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      failed.push({ rowIndex: i, nombre, reason: insertError?.message ?? "No se pudo crear la historia." });
      continue;
    }

    seenKeys.add(dedupKey);
    imported.push({ rowIndex: i, nombre, storyId: inserted.id, warnings });
  }

  revalidatePath(`/clients/${input.clientId}/historias`);

  return { imported, skipped, failed };
}
