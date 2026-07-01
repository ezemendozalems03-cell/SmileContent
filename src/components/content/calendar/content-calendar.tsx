"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventContentArg } from "@fullcalendar/core";
import { Skeleton } from "@/components/ui/skeleton";
import { CONTENT_STATUS_COLORS, CONTENT_STATUS_LABELS } from "@/lib/constants/pipeline-status";
import type { ContentItemWithRelations } from "@/lib/types/domain";

function renderEventContent(arg: EventContentArg) {
  const item = arg.event.extendedProps.item as ContentItemWithRelations;
  return (
    <div
      className={`flex items-center gap-1 truncate rounded-sm border px-1 py-0.5 text-[11px] leading-tight ${CONTENT_STATUS_COLORS[item.status]}`}
      title={item.titulo}
    >
      <span className="truncate">{item.titulo}</span>
    </div>
  );
}

export function ContentCalendar({
  items,
  isLoading,
  detailBasePath,
}: {
  items: ContentItemWithRelations[];
  isLoading: boolean;
  detailBasePath: string;
}) {
  const router = useRouter();

  const events = useMemo(
    () =>
      items
        .filter((item) => Boolean(item.fecha_publicacion))
        .map((item) => ({
          id: item.id,
          title: item.titulo,
          date: item.fecha_publicacion!,
          extendedProps: { item },
        })),
    [items],
  );

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="content-calendar h-full p-4">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        height="100%"
        firstDay={1}
        locale="es"
        headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
        buttonText={{ today: "Hoy" }}
        dayMaxEvents={3}
        events={events}
        eventContent={renderEventContent}
        eventClick={(info) => router.push(`${detailBasePath}/${info.event.id}`)}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        {CONTENT_STATUS_LABELS.publicado} y el resto de los estados se distinguen por color — igual
        que en el Kanban.
      </p>
    </div>
  );
}
