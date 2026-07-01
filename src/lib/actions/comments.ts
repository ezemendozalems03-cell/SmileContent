"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";

export async function createComment(
  parent: { contentItemId: string } | { storyId: string },
  body: string,
) {
  const text = body.trim();
  if (!text) return { error: "El comentario no puede estar vacío." };

  const profile = await getCurrentProfile();
  if (!profile) return { error: "No autenticado." };

  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({
    content_item_id: "contentItemId" in parent ? parent.contentItemId : null,
    story_id: "storyId" in parent ? parent.storyId : null,
    author_id: profile.id,
    body: text,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) return { error: error.message };
  return { success: true };
}
