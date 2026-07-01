"use client";

import { useMemo, useState } from "react";
import { addWeeks, eachDayOfInterval, endOfWeek, format, isToday, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { STORY_STATUS_COLORS, STORY_STATUS_LABELS } from "@/lib/constants/pipeline-status";
import { cn } from "@/lib/utils";
import type { StoryWithRelations } from "@/lib/types/domain";

export function StoriesDailyCalendar({
  stories,
  isLoading,
  onSelect,
}: {
  stories: StoryWithRelations[];
  isLoading: boolean;
  onSelect: (id: string) => void;
}) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const days = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) }),
    [weekStart],
  );

  const storiesByDay = useMemo(() => {
    const map = new Map<string, StoryWithRelations[]>();
    for (const story of stories) {
      const key = story.fecha;
      const list = map.get(key) ?? [];
      list.push(story);
      map.set(key, list);
    }
    for (const list of map.values()) list.sort((a, b) => (a.hora ?? "").localeCompare(b.hora ?? ""));
    return map;
  }, [stories]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-7 gap-3 p-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center gap-2">
        <Button variant="outline" size="icon-sm" onClick={() => setWeekStart((d) => addWeeks(d, -1))}>
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
        >
          Hoy
        </Button>
        <Button variant="outline" size="icon-sm" onClick={() => setWeekStart((d) => addWeeks(d, 1))}>
          <ChevronRight className="size-4" />
        </Button>
        <span className="ml-2 text-sm text-muted-foreground">
          {format(weekStart, "d MMM", { locale: es })} –{" "}
          {format(endOfWeek(weekStart, { weekStartsOn: 1 }), "d MMM yyyy", { locale: es })}
        </span>
      </div>

      <div className="grid flex-1 grid-cols-7 gap-3 overflow-y-auto">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayStories = storiesByDay.get(key) ?? [];
          return (
            <div key={key} className="flex flex-col rounded-lg bg-muted/30">
              <div
                className={cn(
                  "flex items-baseline justify-between rounded-t-lg px-2.5 py-2 text-xs font-medium",
                  isToday(day) ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span className="capitalize">{format(day, "EEE", { locale: es })}</span>
                <span>{format(day, "d")}</span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-2 pt-0">
                {dayStories.map((story) => (
                  <button
                    key={story.id}
                    onClick={() => onSelect(story.id)}
                    className="space-y-1.5 rounded-md border border-border bg-card p-2 text-left text-xs shadow-sm hover:shadow-md"
                  >
                    <p className="line-clamp-2 font-medium leading-snug">{story.nombre}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{story.hora ?? "—"}</span>
                      <StatusBadge
                        label={STORY_STATUS_LABELS[story.status]}
                        colorClass={STORY_STATUS_COLORS[story.status]}
                        className="text-[10px]"
                      />
                    </div>
                  </button>
                ))}
                {dayStories.length === 0 ? (
                  <div className="flex-1 rounded-md border border-dashed border-border/60 p-2 text-center text-[11px] text-muted-foreground/50">
                    —
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
