"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { IDEA_STATUS_COLORS, IDEA_STATUS_LABELS } from "@/lib/constants/idea-status";
import { IdeaKanbanCard } from "@/components/ideas/idea-kanban-card";
import type { IdeaStatus } from "@/lib/types/database.types";
import type { IdeaWithRelations } from "@/lib/types/domain";

export function IdeaKanbanColumn({
  status,
  ideas,
  onEdit,
}: {
  status: IdeaStatus;
  ideas: IdeaWithRelations[];
  onEdit: (idea: IdeaWithRelations) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex w-56 shrink-0 flex-col rounded-lg bg-muted/30">
      <div className="flex items-center justify-between px-2.5 py-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            IDEA_STATUS_COLORS[status],
          )}
        >
          {IDEA_STATUS_LABELS[status]}
        </span>
        <span className="text-xs text-muted-foreground">{ideas.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto p-2 pt-0 transition-colors",
          isOver && "bg-accent/40",
        )}
      >
        {ideas.map((idea) => (
          <IdeaKanbanCard key={idea.id} idea={idea} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
}
