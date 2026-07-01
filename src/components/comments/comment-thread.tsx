"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { CommentComposer } from "@/components/comments/comment-composer";
import { useComments } from "@/lib/queries/use-comments";
import { deleteComment } from "@/lib/actions/comments";
import { useCurrentProfile } from "@/components/layout/current-profile-provider";
import { can } from "@/lib/auth/roles";

type Parent = { contentItemId: string } | { storyId: string };

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function CommentThread({ parent }: { parent: Parent }) {
  const { data: comments, isLoading } = useComments(parent);
  const currentProfile = useCurrentProfile();

  async function handleDelete(commentId: string) {
    const result = await deleteComment(commentId);
    if (result?.error) toast.error(result.error);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto">
        {isLoading ? (
          <>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </>
        ) : comments && comments.length > 0 ? (
          comments.map((comment) => {
            const canDelete =
              comment.author_id === currentProfile?.id || can(currentProfile?.role, "deleteContent");
            return (
              <div key={comment.id} className="group flex gap-2.5">
                <Avatar size="sm" className="mt-0.5">
                  <AvatarImage
                    src={comment.author?.avatar_url ?? undefined}
                    alt={comment.author?.full_name ?? ""}
                  />
                  <AvatarFallback className="text-[10px]">
                    {initials(comment.author?.full_name ?? "?")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{comment.author?.full_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: es })}
                    </span>
                    {canDelete ? (
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        className="ml-auto opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="size-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    ) : null}
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{comment.body}</p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">
            Todavía no hay comentarios. Sé el primero en escribir uno.
          </p>
        )}
      </div>
      <CommentComposer parent={parent} />
    </div>
  );
}
