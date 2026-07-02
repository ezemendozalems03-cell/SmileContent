"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { MonthlyGoalProgress } from "@/lib/types/domain";

export function useMonthlyGoalsProgress(clientId: string, year: number, month: number) {
  return useQuery({
    queryKey: ["monthly-goals-progress", clientId, year, month],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("monthly_goals_progress", {
        p_client_id: clientId,
        p_year: year,
        p_month: month,
      });
      if (error) throw error;
      return (data ?? []) as MonthlyGoalProgress[];
    },
  });
}
