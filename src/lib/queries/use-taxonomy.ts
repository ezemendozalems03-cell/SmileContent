"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/keys";
import type { Pillar, Subpillar, Format, SubFormat, StoryType, ContentObjective } from "@/lib/types/domain";

/** Pillars/formats/story-types visible to a client: global defaults + that client's own additions. */
export function useTaxonomy(clientId?: string) {
  return useQuery({
    queryKey: queryKeys.taxonomy(clientId),
    queryFn: async () => {
      const supabase = createClient();
      const scope = clientId ? `client_id.is.null,client_id.eq.${clientId}` : "client_id.is.null";

      const [pillars, subpillars, formats, subFormats, storyTypes, objectives] = await Promise.all([
        supabase.from("pillars").select("*").or(scope).order("sort_order"),
        supabase.from("subpillars").select("*").order("sort_order"),
        supabase.from("formats").select("*").or(scope).order("sort_order"),
        supabase.from("sub_formats").select("*").order("sort_order"),
        supabase.from("story_types").select("*").or(scope).order("sort_order"),
        // Tolerante a fallos: si la migración 0025 todavía no corrió, la tabla
        // no existe y este select falla — no debe tirar abajo el resto.
        supabase.from("content_objectives").select("*").or(scope).order("sort_order"),
      ]);

      for (const res of [pillars, subpillars, formats, subFormats, storyTypes]) {
        if (res.error) throw res.error;
      }

      return {
        pillars: (pillars.data ?? []) as Pillar[],
        subpillars: (subpillars.data ?? []) as Subpillar[],
        formats: (formats.data ?? []) as Format[],
        subFormats: (subFormats.data ?? []) as SubFormat[],
        storyTypes: (storyTypes.data ?? []) as StoryType[],
        objectives: (objectives.error ? [] : (objectives.data ?? [])) as ContentObjective[],
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
