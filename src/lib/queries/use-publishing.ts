"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/keys";
import type { ScheduledPost, SocialAccount } from "@/lib/types/domain";

export type ScheduledPostWithAccount = ScheduledPost & {
  account?: Pick<SocialAccount, "id" | "account_name" | "username" | "platform"> | null;
};

/**
 * Cuentas sociales visibles para un cliente: las asignadas a él y las que
 * todavía no tienen cliente (para poder asignarlas). Incluye la fecha de la
 * última publicación exitosa de cada cuenta.
 */
export function useSocialAccounts(clientId?: string) {
  return useQuery({
    queryKey: queryKeys.publishing.accounts(clientId),
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase.from("social_accounts").select("*").order("platform");
      if (clientId) query = query.or(`client_id.eq.${clientId},client_id.is.null`);
      const { data: accounts, error } = await query;
      if (error) throw error;

      const { data: lastPublished } = await supabase
        .from("scheduled_posts")
        .select("social_account_id, published_at")
        .eq("status", "published")
        .not("published_at", "is", null)
        .order("published_at", { ascending: false })
        .limit(200);

      const lastByAccount = new Map<string, string>();
      for (const row of lastPublished ?? []) {
        if (row.social_account_id && !lastByAccount.has(row.social_account_id)) {
          lastByAccount.set(row.social_account_id, row.published_at!);
        }
      }

      return ((accounts ?? []) as SocialAccount[]).map((a) => ({
        ...a,
        last_published_at: lastByAccount.get(a.id) ?? null,
      }));
    },
  });
}

/** Historial de envíos a Blotato de una publicación (todos los intentos). */
export function useScheduledPosts(contentItemId: string) {
  return useQuery({
    queryKey: queryKeys.publishing.forContent(contentItemId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("scheduled_posts")
        .select("*, account:social_accounts(id, account_name, username, platform)")
        .eq("content_item_id", contentItemId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ScheduledPostWithAccount[];
    },
  });
}

export function useInvalidatePublishing() {
  const queryClient = useQueryClient();
  return (contentItemId?: string) => {
    queryClient.invalidateQueries({ queryKey: ["publishing"] });
    queryClient.invalidateQueries({ queryKey: queryKeys.contentItems.all });
    if (contentItemId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.contentItems.detail(contentItemId) });
    }
  };
}
