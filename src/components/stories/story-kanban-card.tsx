"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { StoryWithRelations } from "@/lib/types/domain";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function StoryKanbanCard({
  story,
  onEdit,
}: {
  story: StoryWithRelations;
  onEdit: (story: StoryWithRelations) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: story.id,
  });

  return (
    <motion.div
      ref={setNodeRef}
      layout
      {...listeners}
      {...attributes}
      onClick={() => !isDragging && onEdit(story)}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "cursor-grab space-y-1.5 rounded-lg border border-border bg-card p-2.5 text-sm shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing",
        isDragging && "opacity-50",
      )}
    >
      <p className="line-clamp-2 text-[13px] font-medium leading-snug">{story.nombre}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {format(parseISO(story.fecha), "d MMM", { locale: es })}
          {story.hora ? ` · ${story.hora.slice(0, 5)}` : ""}
        </span>
        {story.story_type ? (
          <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {story.story_type.name}
          </span>
        ) : null}
      </div>
      <div className="flex items-center justify-between pt-0.5">
        <span className="text-xs text-muted-foreground">{story.client?.name ?? "Sin cliente"}</span>
        {story.assignee ? (
          <Avatar size="sm">
            <AvatarImage src={story.assignee.avatar_url ?? undefined} alt={story.assignee.full_name} />
            <AvatarFallback className="text-[10px]">{initials(story.assignee.full_name)}</AvatarFallback>
          </Avatar>
        ) : null}
      </div>
    </motion.div>
  );
}
