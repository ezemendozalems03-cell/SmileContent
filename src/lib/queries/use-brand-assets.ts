"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/keys";
import type { BrandAsset } from "@/lib/types/domain";

export function useBrandAssets(clientId: string) {
  return useQuery({
    queryKey: queryKeys.brandAssets.list(clientId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("brand_assets")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BrandAsset[];
    },
  });
}

export function useInvalidateBrandAssets() {
  const queryClient = useQueryClient();
  return (clientId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.brandAssets.list(clientId) });
  };
}
