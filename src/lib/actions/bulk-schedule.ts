"use server";

import { revalidatePath } from "next/cache";
import { addDays, format, isAfter, parseISO, startOfISOWeek } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import type { ContentKind, ContentPriority } from "@/lib/types/database.types";

export type BulkScheduleInput = {
  ideaIds: string[];
  clientId: string;
  startDate: string; // 'yyyy-MM-dd'
  endDate: string; // 'yyyy-MM-dd'
  allowedWeekdays: number[]; // 0=Sun..6=Sat
  maxPerWeekByKind: Partial<Record<ContentKind, number>>;
  suggestedTimeByKind: Partial<Record<ContentKind, string>>; // 'HH:mm'
};

export type BulkSchedulePlaced = { ideaId: string; title: string; contentItemId: string; date: string };
export type BulkScheduleUnplaced = { ideaId: string; title: string; reason: string };
export type BulkScheduleResult =
  | { error: string }
  | { placed: BulkSchedulePlaced[]; unplaced: BulkScheduleUnplaced[] };

const PRIORITY_ORDER: Record<ContentPriority, number> = { urgente: 0, alta: 1, media: 2, baja: 3 };

function weekKey(dateStr: string, kind: string) {
  return `${format(startOfISOWeek(parseISO(dateStr)), "yyyy-MM-dd")}:${kind}`;
}

function dateKey(dateStr: string, kind: string) {
  return `${dateStr}:${kind}`;
}

export async function bulkScheduleIdeas(input: BulkScheduleInput): Promise<BulkScheduleResult> {
  if (input.startDate > input.endDate) {
    return { error: "La fecha de inicio debe ser anterior o igual a la fecha de fin." };
  }
  if (!input.allowedWeekdays.length) return { error: "Seleccioná al menos un día permitido." };
  if (!input.ideaIds.length) return { error: "Seleccioná al menos una idea." };

  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: requestedIdeas, error: ideasError } = await supabase
    .from("ideas")
    .select("*")
    .in("id", input.ideaIds)
    .eq("client_id", input.clientId);
  if (ideasError) return { error: ideasError.message };

  const unplaced: BulkScheduleUnplaced[] = [];
  const eligibleIdeas = (requestedIdeas ?? []).filter((idea) => {
    if (idea.status === "calendarizado" || idea.status === "publicado") {
      unplaced.push({ ideaId: idea.id, title: idea.title, reason: "Esta idea ya fue calendarizada o publicada." });
      return false;
    }
    return true;
  });

  const { data: existingItems, error: existingError } = await supabase
    .from("content_items")
    .select("fecha_publicacion, tipo_contenido")
    .eq("client_id", input.clientId)
    .gte("fecha_publicacion", input.startDate)
    .lte("fecha_publicacion", input.endDate)
    .not("fecha_publicacion", "is", null);
  if (existingError) return { error: existingError.message };

  const countByWeekAndKind = new Map<string, number>();
  const countByDateAndKind = new Map<string, number>();

  for (const item of existingItems ?? []) {
    if (!item.fecha_publicacion) continue;
    const wk = weekKey(item.fecha_publicacion, item.tipo_contenido);
    countByWeekAndKind.set(wk, (countByWeekAndKind.get(wk) ?? 0) + 1);
    const dk = dateKey(item.fecha_publicacion, item.tipo_contenido);
    countByDateAndKind.set(dk, (countByDateAndKind.get(dk) ?? 0) + 1);
  }

  const candidateDates: string[] = [];
  let cursor = parseISO(input.startDate);
  const end = parseISO(input.endDate);
  while (!isAfter(cursor, end)) {
    if (input.allowedWeekdays.includes(cursor.getDay())) {
      candidateDates.push(format(cursor, "yyyy-MM-dd"));
    }
    cursor = addDays(cursor, 1);
  }

  const sortedIdeas = [...eligibleIdeas].sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  const placed: BulkSchedulePlaced[] = [];

  for (const idea of sortedIdeas) {
    const kind = idea.tipo_contenido;
    const maxPerWeek = input.maxPerWeekByKind[kind];
    let assignedDate: string | null = null;

    for (const date of candidateDates) {
      if (maxPerWeek !== undefined) {
        const wk = weekKey(date, kind);
        if ((countByWeekAndKind.get(wk) ?? 0) >= maxPerWeek) continue;
      }
      const dk = dateKey(date, kind);
      if ((countByDateAndKind.get(dk) ?? 0) >= 1) continue;

      assignedDate = date;
      break;
    }

    if (!assignedDate) {
      unplaced.push({
        ideaId: idea.id,
        title: idea.title,
        reason: "No se encontró una fecha disponible en el rango con los límites indicados.",
      });
      continue;
    }

    const wk = weekKey(assignedDate, kind);
    countByWeekAndKind.set(wk, (countByWeekAndKind.get(wk) ?? 0) + 1);
    const dk = dateKey(assignedDate, kind);
    countByDateAndKind.set(dk, (countByDateAndKind.get(dk) ?? 0) + 1);

    const { data: contentItem, error: insertError } = await supabase
      .from("content_items")
      .insert({
        client_id: input.clientId,
        titulo: idea.title,
        descripcion: idea.description,
        pilar_id: idea.pilar_id,
        subpilar_id: idea.subpilar_id,
        formato_id: idea.formato_id,
        sub_formato_id: idea.sub_formato_id,
        tipo_contenido: idea.tipo_contenido,
        hook: idea.hook,
        guion: idea.guion,
        copy: idea.copy,
        cta: idea.cta,
        observaciones_internas: idea.observaciones_internas,
        feedback_cliente: idea.feedback_cliente,
        priority: idea.priority,
        status: "programado",
        fecha_publicacion: assignedDate,
        hora_sugerida: input.suggestedTimeByKind[kind] ?? null,
        created_by: profile?.id ?? null,
      })
      .select("id")
      .single();

    if (insertError || !contentItem) {
      unplaced.push({
        ideaId: idea.id,
        title: idea.title,
        reason: insertError?.message ?? "No se pudo crear la publicación.",
      });
      continue;
    }

    await supabase
      .from("ideas")
      .update({ status: "calendarizado", promoted_content_item_id: contentItem.id })
      .eq("id", idea.id);

    placed.push({ ideaId: idea.id, title: idea.title, contentItemId: contentItem.id, date: assignedDate });
  }

  revalidatePath("/ideas");
  revalidatePath("/content");

  return { placed, unplaced };
}
