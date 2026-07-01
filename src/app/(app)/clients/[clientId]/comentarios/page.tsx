import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

type FeedEntry = {
  id: string;
  body: string;
  created_at: string;
  author: { full_name: string; avatar_url: string | null } | null;
  href: string;
  parentLabel: string;
};

export default async function ClientComentariosPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const supabase = await createClient();

  const [{ data: contentItems }, { data: stories }] = await Promise.all([
    supabase.from("content_items").select("id, titulo").eq("client_id", clientId),
    supabase.from("stories").select("id, nombre").eq("client_id", clientId),
  ]);

  const contentItemIds = (contentItems ?? []).map((c) => c.id);
  const storyIds = (stories ?? []).map((s) => s.id);
  const contentTitleById = new Map((contentItems ?? []).map((c) => [c.id, c.titulo]));
  const storyNameById = new Map((stories ?? []).map((s) => [s.id, s.nombre]));

  const [{ data: contentComments }, { data: storyComments }] = await Promise.all([
    contentItemIds.length
      ? supabase
          .from("comments")
          .select("*, author:profiles(id,full_name,avatar_url)")
          .in("content_item_id", contentItemIds)
          .order("created_at", { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] }),
    storyIds.length
      ? supabase
          .from("comments")
          .select("*, author:profiles(id,full_name,avatar_url)")
          .in("story_id", storyIds)
          .order("created_at", { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] }),
  ]);

  const entries: FeedEntry[] = [
    ...(contentComments ?? []).map((c) => ({
      id: c.id,
      body: c.body,
      created_at: c.created_at,
      author: c.author as unknown as FeedEntry["author"],
      href: `/content/${c.content_item_id}`,
      parentLabel: contentTitleById.get(c.content_item_id!) ?? "Publicación",
    })),
    ...(storyComments ?? []).map((c) => ({
      id: c.id,
      body: c.body,
      created_at: c.created_at,
      author: c.author as unknown as FeedEntry["author"],
      href: `/clients/${clientId}/historias`,
      parentLabel: storyNameById.get(c.story_id!) ?? "Historia",
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (entries.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={MessageSquare}
          title="Sin comentarios todavía"
          description="Los comentarios de publicaciones e historias de este cliente aparecen acá."
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 p-6">
      {entries.map((entry) => (
        <Link
          key={entry.id}
          href={entry.href}
          className="flex gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/30"
        >
          <Avatar size="sm">
            <AvatarImage src={entry.author?.avatar_url ?? undefined} alt={entry.author?.full_name ?? ""} />
            <AvatarFallback className="text-[10px]">{initials(entry.author?.full_name ?? "?")}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{entry.author?.full_name}</span>
              <span>en {entry.parentLabel}</span>
              <span className="ml-auto shrink-0">
                {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: es })}
              </span>
            </div>
            <p className="truncate text-sm">{entry.body}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
