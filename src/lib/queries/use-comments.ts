"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/keys";
import type { CommentWithAuthor } from "@/lib/types/domain";

type Parent = { contentItemId: string } | { storyId: string };

function parentColumn(parent: Parent) {
  return "contentItemId" in parent
    ? { column: "content_item_id" as const, id: parent.contentItemId }
    : { column: "story_id" as const, id: parent.storyId };
}

export function useComments(parent: Parent) {
  const queryClient = useQueryClient();
  const { column, id } = parentColumn(parent);
  const queryKey =
    "contentItemId" in parent
      ? queryKeys.comments.forContentItem(parent.contentItemId)
      : queryKeys.comments.forStory(parent.storyId);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("comments")
        .select("*, author:profiles(id,full_name,avatar_url,role)")
        .eq(column, id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as CommentWithAuthor[];
    },
  });

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`comments-${column}-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `${column}=eq.${id}` },
        () => {
          queryClient.invalidateQueries({ queryKey });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [column, id]);

  return query;
}
