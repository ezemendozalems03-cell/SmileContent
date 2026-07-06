"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/keys";
import { getStrategySnapshot } from "@/lib/actions/strategy";
import type { StrategySnapshot } from "@/lib/strategy/snapshot";
import type {
  Campaign,
  ClientObjective,
  ContentRecommendation,
  MonthlyPlan,
  StrategyReport,
  StrategyRule,
  StrategySettings,
} from "@/lib/types/domain";

/** El snapshot se calcula en el servidor (server action como queryFn). */
export function useStrategySnapshot(clientId: string) {
  return useQuery({
    queryKey: queryKeys.strategy.snapshot(clientId),
    queryFn: async () => {
      const result = await getStrategySnapshot(clientId);
      if ("error" in result) throw new Error(result.error);
      return result as StrategySnapshot;
    },
  });
}

export function useStrategySettings(clientId: string) {
  return useQuery({
    queryKey: queryKeys.strategy.settings(clientId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("strategy_settings")
        .select("*")
        .eq("client_id", clientId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as StrategySettings | null;
    },
  });
}

export function useStrategyRules(clientId: string) {
  return useQuery({
    queryKey: queryKeys.strategy.rules(clientId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("strategy_rules")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as StrategyRule[];
    },
  });
}

export function useClientObjectives(clientId: string) {
  return useQuery({
    queryKey: queryKeys.strategy.objectives(clientId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("client_objectives")
        .select("*")
        .eq("client_id", clientId)
        .order("prioridad", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ClientObjective[];
    },
  });
}

export function useContentRecommendations(clientId: string) {
  return useQuery({
    queryKey: queryKeys.strategy.recommendations(clientId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("content_recommendations")
        .select("*")
        .eq("client_id", clientId)
        .eq("estado", "nueva")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as ContentRecommendation[];
    },
  });
}

export function useLatestStrategyReport(clientId: string) {
  return useQuery({
    queryKey: queryKeys.strategy.reports(clientId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("strategy_reports")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as StrategyReport | null;
    },
  });
}

export function useMonthlyPlans(clientId: string) {
  return useQuery({
    queryKey: queryKeys.strategy.plans(clientId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("monthly_plans")
        .select("*")
        .eq("client_id", clientId)
        .order("mes", { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data ?? []) as MonthlyPlan[];
    },
  });
}

export function useCampaigns(clientId: string) {
  return useQuery({
    queryKey: queryKeys.strategy.campaigns(clientId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Campaign[];
    },
  });
}

export function useInvalidateStrategy() {
  const queryClient = useQueryClient();
  return (clientId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.strategy.all(clientId) });
  };
}
