"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export type PillarStats = {
  ideaCountByPilar: Map<string, number>;
  ideaCountBySubpilar: Map<string, number>;
  scheduledCountByPilar: Map<string, number>;
  scheduledCountBySubpilar: Map<string, number>;
};

function count(rows: { pilar_id: string | null }[] | null, key: "pilar_id"): Map<string, number>;
function count(rows: { subpilar_id: string | null }[] | null, key: "subpilar_id"): Map<string, number>;
function count(
  rows: ({ pilar_id: string | null } | { subpilar_id: string | null })[] | null,
  key: "pilar_id" | "subpilar_id",
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows ?? []) {
    const id = (row as Record<string, string | null>)[key];
    if (!id) continue;
    map.set(id, (map.get(id) ?? 0) + 1);
  }
  return map;
}

/** Idea-count and scheduled-content-count per pillar/subpillar. clientId omitted = aggregate across all clients (used by the global Pilares y formatos page). */
export function usePillarStats(clientId?: string) {
  return useQuery({
    queryKey: ["pillar-stats", clientId ?? "all"],
    queryFn: async (): Promise<PillarStats> => {
      const supabase = createClient();

      let ideasQuery = supabase.from("ideas").select("pilar_id, subpilar_id");
      let scheduledQuery = supabase
        .from("content_items")
        .select("pilar_id, subpilar_id")
        .not("fecha_publicacion", "is", null);

      if (clientId) {
        ideasQuery = ideasQuery.eq("client_id", clientId);
        scheduledQuery = scheduledQuery.eq("client_id", clientId);
      }

      const [{ data: ideas, error: ideasError }, { data: scheduled, error: scheduledError }] =
        await Promise.all([ideasQuery, scheduledQuery]);

      if (ideasError) throw ideasError;
      if (scheduledError) throw scheduledError;

      return {
        ideaCountByPilar: count(ideas, "pilar_id"),
        ideaCountBySubpilar: count(ideas, "subpilar_id"),
        scheduledCountByPilar: count(scheduled, "pilar_id"),
        scheduledCountBySubpilar: count(scheduled, "subpilar_id"),
      };
    },
  });
}
