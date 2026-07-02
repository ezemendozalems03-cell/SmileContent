"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lightbulb, Trash2, ArrowUpRight, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/shared/status-badge";
import { deleteIdea, promoteIdea } from "@/lib/actions/ideas";
import { queryKeys } from "@/lib/queries/keys";
import { CONTENT_KIND_LABELS, CONTENT_PRIORITY_COLORS, CONTENT_PRIORITY_LABELS } from "@/lib/constants/pipeline-status";
import { IDEA_STATUS_COLORS, IDEA_STATUS_LABELS } from "@/lib/constants/idea-status";
import type { IdeaWithRelations } from "@/lib/types/domain";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function IdeaCard({
  idea,
  onEdit,
  selected,
  onToggleSelect,
}: {
  idea: IdeaWithRelations;
  onEdit: () => void;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("¿Eliminar esta idea?")) return;
    const result = await deleteIdea(idea.id);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.ideas.all });
  }

  async function handlePromote(e: React.MouseEvent) {
    e.stopPropagation();
    const result = await promoteIdea(idea.id);
    if ("id" in result) {
      toast.success("Idea promovida a publicación");
      queryClient.invalidateQueries({ queryKey: queryKeys.ideas.all });
      router.push(`/content/${result.id}`);
    } else {
      toast.error(result.error);
    }
  }

  const canPromote = idea.status !== "calendarizado" && idea.status !== "publicado";

  return (
    <Card className="h-full cursor-pointer transition-colors hover:bg-accent/40" onClick={onEdit}>
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            {onToggleSelect ? (
              <Checkbox
                checked={Boolean(selected)}
                onCheckedChange={() => onToggleSelect()}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Lightbulb className="size-4.5" />
              </div>
            )}
            <p className="font-medium leading-tight">{idea.title}</p>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>

        {idea.description ? (
          <p className="line-clamp-2 flex-1 text-xs text-muted-foreground">{idea.description}</p>
        ) : (
          <div className="flex-1" />
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge label={IDEA_STATUS_LABELS[idea.status]} colorClass={IDEA_STATUS_COLORS[idea.status]} className="text-[10px]" />
          <StatusBadge
            label={CONTENT_PRIORITY_LABELS[idea.priority]}
            colorClass={CONTENT_PRIORITY_COLORS[idea.priority]}
            className="text-[10px]"
          />
          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
            {CONTENT_KIND_LABELS[idea.tipo_contenido]}
          </span>
          {idea.client ? (
            <span className="rounded-full border border-border px-2 py-0.5 text-xs">{idea.client.name}</span>
          ) : (
            <span className="rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground">
              Sin cliente
            </span>
          )}
          {idea.pilar ? (
            <span className="rounded-full border border-border px-2 py-0.5 text-xs">{idea.pilar.name}</span>
          ) : null}
          {idea.subpilar ? (
            <span className="rounded-full border border-border px-2 py-0.5 text-xs">{idea.subpilar.name}</span>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <Avatar size="sm">
            <AvatarImage src={idea.creator?.avatar_url ?? undefined} alt={idea.creator?.full_name ?? ""} />
            <AvatarFallback className="text-[10px]">{initials(idea.creator?.full_name ?? "?")}</AvatarFallback>
          </Avatar>

          {idea.promoted_content_item_id ? (
            <Link
              href={`/content/${idea.promoted_content_item_id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs font-medium text-emerald-400"
            >
              <Check className="size-3.5" />
              Promovida
            </Link>
          ) : canPromote ? (
            <Button variant="outline" size="xs" onClick={handlePromote}>
              <ArrowUpRight className="size-3.5" />
              Promover
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
