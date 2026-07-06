"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/keys";
import type {
  BrandExample,
  BrandLearning,
  BrandMemory,
  BrandProduct,
  BrandVisualIdentity,
  BrandVoice,
} from "@/lib/types/domain";

export function useBrandMemory(clientId: string) {
  return useQuery({
    queryKey: queryKeys.brandMemory.memory(clientId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("brand_memory")
        .select("*")
        .eq("client_id", clientId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as BrandMemory | null;
    },
  });
}

export function useBrandVoice(clientId: string) {
  return useQuery({
    queryKey: queryKeys.brandMemory.voice(clientId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("brand_voice")
        .select("*")
        .eq("client_id", clientId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as BrandVoice | null;
    },
  });
}

export function useBrandVisualIdentity(clientId: string) {
  return useQuery({
    queryKey: queryKeys.brandMemory.visual(clientId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("brand_visual_identity")
        .select("*")
        .eq("client_id", clientId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as BrandVisualIdentity | null;
    },
  });
}

export function useBrandProducts(clientId: string) {
  return useQuery({
    queryKey: queryKeys.brandMemory.products(clientId),
    // El diálogo de generación puede montarse sin cliente elegido todavía.
    enabled: clientId.length > 0,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("brand_products")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as BrandProduct[];
    },
  });
}

export function useBrandLearnings(clientId: string) {
  return useQuery({
    queryKey: queryKeys.brandMemory.learnings(clientId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("brand_learning")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BrandLearning[];
    },
  });
}

export function useBrandExamples(clientId: string) {
  return useQuery({
    queryKey: queryKeys.brandMemory.examples(clientId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("brand_examples")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BrandExample[];
    },
  });
}

export function useInvalidateBrandMemory() {
  const queryClient = useQueryClient();
  return (clientId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.brandMemory.all(clientId) });
  };
}
