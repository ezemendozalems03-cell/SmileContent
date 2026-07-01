"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/keys";
import type { FileRow } from "@/lib/types/domain";

type Parent = { contentItemId: string } | { storyId: string };

export function useFiles(parent: Parent) {
  const column = "contentItemId" in parent ? "content_item_id" : "story_id";
  const id = "contentItemId" in parent ? parent.contentItemId : parent.storyId;
  const queryKey =
    "contentItemId" in parent
      ? queryKeys.files.forContentItem(parent.contentItemId)
      : queryKeys.files.forStory(parent.storyId);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq(column, id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as FileRow[];
    },
  });
}

export function useInvalidateFiles() {
  const queryClient = useQueryClient();
  return (parent: Parent) => {
    const queryKey =
      "contentItemId" in parent
        ? queryKeys.files.forContentItem(parent.contentItemId)
        : queryKeys.files.forStory(parent.storyId);
    queryClient.invalidateQueries({ queryKey });
  };
}
