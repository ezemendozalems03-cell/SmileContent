"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys, type IdeaFilters } from "@/lib/queries/keys";
import type { IdeaWithRelations } from "@/lib/types/domain";
import type { IdeaStatus, ContentKind, ContentPriority } from "@/lib/types/database.types";

const SELECT_WITH_RELATIONS =
  "*, pilar:pillars(id,name), subpilar:subpillars(id,name), formato:formats(id,name), sub_formato:sub_formats(id,name), client:clients(id,name), creator:profiles(id,full_name,avatar_url)";

export function useIdeas(filters: IdeaFilters = {}) {
  return useQuery({
    queryKey: queryKeys.ideas.list(filters),
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase.from("ideas").select(SELECT_WITH_RELATIONS);

      if (filters.clientId) query = query.eq("client_id", filters.clientId);
      if (filters.pilarId) query = query.eq("pilar_id", filters.pilarId);
      if (filters.subpilarId) query = query.eq("subpilar_id", filters.subpilarId);
      if (filters.tipoContenido) query = query.eq("tipo_contenido", filters.tipoContenido as ContentKind);
      if (filters.statuses?.length) query = query.in("status", filters.statuses as IdeaStatus[]);
      if (filters.priority) query = query.eq("priority", filters.priority as ContentPriority);
      if (filters.search) query = query.textSearch("search_vector", filters.search, { type: "websearch" });

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as IdeaWithRelations[];
    },
  });
}
