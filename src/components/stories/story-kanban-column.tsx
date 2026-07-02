"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { STORY_STATUS_COLORS, STORY_STATUS_LABELS } from "@/lib/constants/pipeline-status";
import { StoryKanbanCard } from "@/components/stories/story-kanban-card";
import type { StoryStatus } from "@/lib/types/database.types";
import type { StoryWithRelations } from "@/lib/types/domain";

export function StoryKanbanColumn({
  status,
  stories,
  onEdit,
}: {
  status: StoryStatus;
  stories: StoryWithRelations[];
  onEdit: (story: StoryWithRelations) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex w-56 shrink-0 flex-col rounded-lg bg-muted/30">
      <div className="flex items-center justify-between px-2.5 py-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            STORY_STATUS_COLORS[status],
          )}
        >
          {STORY_STATUS_LABELS[status]}
        </span>
        <span className="text-xs text-muted-foreground">{stories.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto p-2 pt-0 transition-colors",
          isOver && "bg-accent/40",
        )}
      >
        {stories.map((story) => (
          <StoryKanbanCard key={story.id} story={story} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
}
