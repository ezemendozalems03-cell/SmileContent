"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { CONTENT_PRIORITY_COLORS, CONTENT_PRIORITY_LABELS } from "@/lib/constants/pipeline-status";
import { cn } from "@/lib/utils";
import type { IdeaWithRelations } from "@/lib/types/domain";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function IdeaKanbanCard({
  idea,
  onEdit,
}: {
  idea: IdeaWithRelations;
  onEdit: (idea: IdeaWithRelations) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: idea.id,
  });

  return (
    <motion.div
      ref={setNodeRef}
      layout
      {...listeners}
      {...attributes}
      onClick={() => !isDragging && onEdit(idea)}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "cursor-grab space-y-1.5 rounded-lg border border-border bg-card p-2.5 text-sm shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing",
        isDragging && "opacity-50",
      )}
    >
      <p className="line-clamp-2 text-[13px] font-medium leading-snug">{idea.title}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {idea.pilar ? (
          <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {idea.pilar.name}
          </span>
        ) : null}
        <StatusBadge
          label={CONTENT_PRIORITY_LABELS[idea.priority]}
          colorClass={CONTENT_PRIORITY_COLORS[idea.priority]}
          className="text-[10px]"
        />
      </div>
      <div className="flex items-center justify-between pt-0.5">
        <span className="text-xs text-muted-foreground">{idea.client?.name ?? "Sin cliente"}</span>
        {idea.creator ? (
          <Avatar size="sm">
            <AvatarImage src={idea.creator.avatar_url ?? undefined} alt={idea.creator.full_name} />
            <AvatarFallback className="text-[10px]">{initials(idea.creator.full_name)}</AvatarFallback>
          </Avatar>
        ) : null}
      </div>
    </motion.div>
  );
}
