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
import { IdeaKanbanColumn } from "@/components/ideas/idea-kanban-column";
import { Skeleton } from "@/components/ui/skeleton";
import { IDEA_STATUS_ORDER } from "@/lib/constants/idea-status";
import { updateIdeaStatus } from "@/lib/actions/ideas";
import { queryKeys } from "@/lib/queries/keys";
import type { IdeaStatus } from "@/lib/types/database.types";
import type { IdeaWithRelations } from "@/lib/types/domain";

export function IdeaKanbanBoard({
  ideas,
  isLoading,
  onEdit,
}: {
  ideas: IdeaWithRelations[];
  isLoading: boolean;
  onEdit: (idea: IdeaWithRelations) => void;
}) {
  const queryClient = useQueryClient();
  const [statusOverrides, setStatusOverrides] = useState<Record<string, IdeaStatus>>({});
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const byStatus = useMemo(() => {
    const map = new Map<IdeaStatus, IdeaWithRelations[]>();
    for (const status of IDEA_STATUS_ORDER) map.set(status, []);
    for (const idea of ideas) {
      const status = statusOverrides[idea.id] ?? idea.status;
      map.get(status)?.push(statusOverrides[idea.id] ? { ...idea, status } : idea);
    }
    return map;
  }, [ideas, statusOverrides]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const newStatus = over.id as IdeaStatus;
    const idea = ideas.find((i) => i.id === active.id);
    if (!idea) return;

    const currentStatus = statusOverrides[idea.id] ?? idea.status;
    if (currentStatus === newStatus) return;

    setStatusOverrides((prev) => ({ ...prev, [idea.id]: newStatus }));

    const result = await updateIdeaStatus(idea.id, newStatus);
    if (result?.error) {
      setStatusOverrides((prev) => {
        const next = { ...prev };
        delete next[idea.id];
        return next;
      });
      toast.error("No se pudo mover la idea", { description: result.error });
      return;
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.ideas.all });
  }

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-80 w-56 shrink-0" />
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex h-full gap-2 overflow-x-auto p-4">
        {IDEA_STATUS_ORDER.map((status) => (
          <IdeaKanbanColumn key={status} status={status} ideas={byStatus.get(status) ?? []} onEdit={onEdit} />
        ))}
      </div>
    </DndContext>
  );
}
