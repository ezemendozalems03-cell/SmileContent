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
import { StoryKanbanColumn } from "@/components/stories/story-kanban-column";
import { Skeleton } from "@/components/ui/skeleton";
import { STORY_STATUS_ORDER } from "@/lib/constants/pipeline-status";
import { updateStoryStatus } from "@/lib/actions/stories";
import { queryKeys } from "@/lib/queries/keys";
import type { StoryStatus } from "@/lib/types/database.types";
import type { StoryWithRelations } from "@/lib/types/domain";

export function StoryKanbanBoard({
  stories,
  isLoading,
  onEdit,
}: {
  stories: StoryWithRelations[];
  isLoading: boolean;
  onEdit: (story: StoryWithRelations) => void;
}) {
  const queryClient = useQueryClient();
  const [statusOverrides, setStatusOverrides] = useState<Record<string, StoryStatus>>({});
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const byStatus = useMemo(() => {
    const map = new Map<StoryStatus, StoryWithRelations[]>();
    for (const status of STORY_STATUS_ORDER) map.set(status, []);
    for (const story of stories) {
      const status = statusOverrides[story.id] ?? story.status;
      map.get(status)?.push(statusOverrides[story.id] ? { ...story, status } : story);
    }
    return map;
  }, [stories, statusOverrides]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const newStatus = over.id as StoryStatus;
    const story = stories.find((s) => s.id === active.id);
    if (!story) return;

    const currentStatus = statusOverrides[story.id] ?? story.status;
    if (currentStatus === newStatus) return;

    setStatusOverrides((prev) => ({ ...prev, [story.id]: newStatus }));

    const result = await updateStoryStatus(story.id, newStatus);
    if (result?.error) {
      setStatusOverrides((prev) => {
        const next = { ...prev };
        delete next[story.id];
        return next;
      });
      toast.error("No se pudo mover la historia", { description: result.error });
      return;
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.stories.all });
  }

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-80 w-56 shrink-0" />
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex h-full gap-2 overflow-x-auto p-4">
        {STORY_STATUS_ORDER.map((status) => (
          <StoryKanbanColumn key={status} status={status} stories={byStatus.get(status) ?? []} onEdit={onEdit} />
        ))}
      </div>
    </DndContext>
  );
}
