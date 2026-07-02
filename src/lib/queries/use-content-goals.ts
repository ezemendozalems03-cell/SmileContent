"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { ContentGoal } from "@/lib/types/domain";

export type ContentGoalWithFormat = ContentGoal & { formato: { id: string; name: string } | null };

export function useContentGoals(clientId: string, year: number, month: number) {
  return useQuery({
    queryKey: ["content-goals", clientId, year, month],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("content_goals")
        .select("*, formato:formats(id,name)")
        .eq("client_id", clientId)
        .eq("year", year)
        .eq("month", month);
      if (error) throw error;
      return (data ?? []) as unknown as ContentGoalWithFormat[];
    },
  });
}
