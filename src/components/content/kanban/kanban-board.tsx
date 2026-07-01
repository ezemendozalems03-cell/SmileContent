"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import { KanbanColumn } from "@/components/content/kanban/kanban-column";
import { Skeleton } from "@/components/ui/skeleton";
import { CONTENT_STATUS_ORDER } from "@/lib/constants/pipeline-status";
import { updateContentItemStatus } from "@/lib/actions/content-items";
import { queryKeys } from "@/lib/queries/keys";
import type { ContentStatus } from "@/lib/types/database.types";
import type { ContentItemWithRelations } from "@/lib/types/domain";

export function KanbanBoard({
  items,
  isLoading,
  detailBasePath,
}: {
  items: ContentItemWithRelations[];
  isLoading: boolean;
  detailBasePath: string;
}) {
  const queryClient = useQueryClient();
  // Optimistic status overrides applied on top of the fetched `items` prop,
  // so a drag feels instant without needing to mirror props into state.
  const [statusOverrides, setStatusOverrides] = useState<Record<string, ContentStatus>>({});
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const byStatus = useMemo(() => {
    const map = new Map<ContentStatus, ContentItemWithRelations[]>();
    for (const status of CONTENT_STATUS_ORDER) map.set(status, []);
    for (const item of items) {
      const status = statusOverrides[item.id] ?? item.status;
      map.get(status)?.push(statusOverrides[item.id] ? { ...item, status } : item);
    }
    return map;
  }, [items, statusOverrides]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const newStatus = over.id as ContentStatus;
    const item = items.find((i) => i.id === active.id);
    if (!item) return;

    const currentStatus = statusOverrides[item.id] ?? item.status;
    if (currentStatus === newStatus) return;

    setStatusOverrides((prev) => ({ ...prev, [item.id]: newStatus }));

    const result = await updateContentItemStatus(item.id, newStatus);
    if (result?.error) {
      setStatusOverrides((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      toast.error("No se pudo mover la publicación", { description: result.error });
      return;
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.contentItems.all });
  }

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-80 w-72 shrink-0" />
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex h-full gap-3 overflow-x-auto p-4">
        {CONTENT_STATUS_ORDER.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            items={byStatus.get(status) ?? []}
            detailBasePath={detailBasePath}
          />
        ))}
      </div>
    </DndContext>
  );
}
