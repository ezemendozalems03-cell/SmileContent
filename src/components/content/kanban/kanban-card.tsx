"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { CONTENT_PRIORITY_COLORS, CONTENT_PRIORITY_LABELS } from "@/lib/constants/pipeline-status";
import { cn } from "@/lib/utils";
import type { ContentItemWithRelations } from "@/lib/types/domain";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function KanbanCard({
  item,
  detailBasePath,
}: {
  item: ContentItemWithRelations;
  detailBasePath: string;
}) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
  });

  return (
    <motion.div
      ref={setNodeRef}
      layout
      {...listeners}
      {...attributes}
      onClick={() => !isDragging && router.push(`${detailBasePath}/${item.id}`)}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "cursor-grab space-y-1.5 rounded-lg border border-border bg-card p-2.5 text-sm shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing",
        isDragging && "opacity-50",
      )}
    >
      <p className="line-clamp-2 text-[13px] font-medium leading-snug">{item.titulo}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {item.formato ? (
          <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {item.formato.name}
          </span>
        ) : null}
        {item.pilar ? (
          <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {item.pilar.name}
          </span>
        ) : null}
        <StatusBadge
          label={CONTENT_PRIORITY_LABELS[item.priority]}
          colorClass={CONTENT_PRIORITY_COLORS[item.priority]}
          className="text-[10px]"
        />
      </div>
      <div className="flex items-center justify-between pt-0.5">
        <span className="text-xs text-muted-foreground">{item.fecha_publicacion ?? "Sin fecha"}</span>
        {item.assignee ? (
          <Avatar size="sm">
            <AvatarImage src={item.assignee.avatar_url ?? undefined} alt={item.assignee.full_name} />
            <AvatarFallback className="text-[10px]">{initials(item.assignee.full_name)}</AvatarFallback>
          </Avatar>
        ) : null}
      </div>
    </motion.div>
  );
}
