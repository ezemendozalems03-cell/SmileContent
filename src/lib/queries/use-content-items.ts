"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys, type ContentItemFilters } from "@/lib/queries/keys";
import type { ContentItemWithRelations } from "@/lib/types/domain";
import type { ContentStatus } from "@/lib/types/database.types";

const SELECT_WITH_RELATIONS =
  "*, client:clients(id,name,logo_url), formato:formats(id,name), sub_formato:sub_formats(id,name), pilar:pillars(id,name), subpilar:subpillars(id,name), assignee:profiles(id,full_name,avatar_url)";

export function useContentItems(filters: ContentItemFilters) {
  return useQuery({
    queryKey: queryKeys.contentItems.list(filters),
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase.from("content_items").select(SELECT_WITH_RELATIONS);

      if (filters.clientId) query = query.eq("client_id", filters.clientId);
      if (filters.pilarId) query = query.eq("pilar_id", filters.pilarId);
      if (filters.formatoId) query = query.eq("formato_id", filters.formatoId);
      if (filters.statuses?.length) query = query.in("status", filters.statuses as ContentStatus[]);
      if (filters.assigneeId) query = query.eq("assignee_id", filters.assigneeId);
      if (filters.dateFrom) query = query.gte("fecha_publicacion", filters.dateFrom);
      if (filters.dateTo) query = query.lte("fecha_publicacion", filters.dateTo);
      if (filters.search) query = query.textSearch("search_vector", filters.search, { type: "websearch" });

      const { data, error } = await query.order("fecha_publicacion", {
        ascending: true,
        nullsFirst: false,
      });

      if (error) throw error;
      return (data ?? []) as unknown as ContentItemWithRelations[];
    },
  });
}

export function useContentItem(id: string | null) {
  return useQuery({
    queryKey: queryKeys.contentItems.detail(id ?? ""),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("content_items")
        .select(SELECT_WITH_RELATIONS)
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as ContentItemWithRelations;
    },
    enabled: Boolean(id),
  });
}
