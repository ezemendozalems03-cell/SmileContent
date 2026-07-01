"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { CircleDot } from "lucide-react";
import { STORY_STATUS_COLORS, STORY_STATUS_LABELS } from "@/lib/constants/pipeline-status";
import type { StoryWithRelations } from "@/lib/types/domain";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function StoriesList({
  stories,
  isLoading,
  onSelect,
  showClient = false,
}: {
  stories: StoryWithRelations[];
  isLoading: boolean;
  onSelect: (id: string) => void;
  showClient?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="p-6">
        <EmptyState icon={CircleDot} title="No hay historias" description="Creá la primera historia para este cliente." />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            {showClient ? <TableHead>Cliente</TableHead> : null}
            <TableHead>Fecha</TableHead>
            <TableHead>Hora</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Responsable</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stories.map((story) => (
            <TableRow key={story.id} className="cursor-pointer" onClick={() => onSelect(story.id)}>
              <TableCell className="font-medium">{story.nombre}</TableCell>
              {showClient ? (
                <TableCell className="text-muted-foreground">{story.client?.name ?? "—"}</TableCell>
              ) : null}
              <TableCell className="text-muted-foreground">{story.fecha}</TableCell>
              <TableCell className="text-muted-foreground">{story.hora ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{story.story_type?.name ?? "—"}</TableCell>
              <TableCell>
                <StatusBadge
                  label={STORY_STATUS_LABELS[story.status]}
                  colorClass={STORY_STATUS_COLORS[story.status]}
                />
              </TableCell>
              <TableCell>
                {story.assignee ? (
                  <div className="flex items-center gap-1.5">
                    <Avatar size="sm">
                      <AvatarImage src={story.assignee.avatar_url ?? undefined} alt={story.assignee.full_name} />
                      <AvatarFallback className="text-[10px]">
                        {initials(story.assignee.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{story.assignee.full_name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
