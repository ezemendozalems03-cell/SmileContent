"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { CONTENT_STATUS_COLORS, CONTENT_STATUS_LABELS } from "@/lib/constants/pipeline-status";
import { KanbanCard } from "@/components/content/kanban/kanban-card";
import type { ContentStatus } from "@/lib/types/database.types";
import type { ContentItemWithRelations } from "@/lib/types/domain";

export function KanbanColumn({
  status,
  items,
  detailBasePath,
}: {
  status: ContentStatus;
  items: ContentItemWithRelations[];
  detailBasePath: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/30">
      <div className="flex items-center justify-between px-3 py-2.5">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            CONTENT_STATUS_COLORS[status],
          )}
        >
          {CONTENT_STATUS_LABELS[status]}
        </span>
        <span className="text-xs text-muted-foreground">{items.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto p-2 pt-0 transition-colors",
          isOver && "bg-accent/40",
        )}
      >
        {items.map((item) => (
          <KanbanCard key={item.id} item={item} detailBasePath={detailBasePath} />
        ))}
      </div>
    </div>
  );
}
