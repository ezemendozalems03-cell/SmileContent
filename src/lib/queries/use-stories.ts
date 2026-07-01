"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/keys";
import type { StoryWithRelations } from "@/lib/types/domain";

const SELECT_WITH_RELATIONS =
  "*, story_type:story_types(id,name), assignee:profiles(id,full_name,avatar_url), client:clients(id,name)";

export function useStories(clientId?: string) {
  return useQuery({
    queryKey: queryKeys.stories.list(clientId),
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase.from("stories").select(SELECT_WITH_RELATIONS);
      if (clientId) query = query.eq("client_id", clientId);
      const { data, error } = await query.order("fecha", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as StoryWithRelations[];
    },
  });
}
