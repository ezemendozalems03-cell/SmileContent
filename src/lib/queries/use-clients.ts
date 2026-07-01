"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/keys";
import type { Client } from "@/lib/types/domain";

/** Lightweight client list for filter dropdowns/pickers (global content views). */
export function useClientsList() {
  return useQuery({
    queryKey: queryKeys.clients,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, logo_url, status")
        .order("name");
      if (error) throw error;
      return data as Pick<Client, "id" | "name" | "logo_url" | "status">[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
