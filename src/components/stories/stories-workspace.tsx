"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Rows3, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoriesList } from "@/components/stories/stories-list";
import { StoriesDailyCalendar } from "@/components/stories/stories-daily-calendar";
import { StoryDetailSheet } from "@/components/stories/story-detail-sheet";
import { useStories } from "@/lib/queries/use-stories";
import { cn } from "@/lib/utils";

export function StoriesWorkspace({ clientId, title }: { clientId?: string; title?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const view = !clientId ? "list" : searchParams.get("view") === "list" ? "list" : "daily";
  const { data: stories, isLoading } = useStories(clientId);

  function setView(next: "list" | "daily") {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "daily") params.delete("view");
    else params.set("view", next);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  const selectedStory = stories?.find((s) => s.id === selectedStoryId);
  const sheetClientId = clientId ?? selectedStory?.client_id ?? "";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <h1 className="text-xl font-semibold tracking-tight">{title ?? "Historias"}</h1>
        <div className="flex items-center gap-2">
          {clientId ? (
            <div className="flex items-center rounded-lg border border-border p-0.5">
              <button
                type="button"
                onClick={() => setView("daily")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
                  view === "daily" ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                <CalendarRange className="size-3.5" />
                Calendario diario
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
                  view === "list" ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                <Rows3 className="size-3.5" />
                Lista
              </button>
            </div>
          ) : null}
          {clientId ? (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              Nueva historia
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {view === "list" ? (
          <StoriesList
            stories={stories ?? []}
            isLoading={isLoading}
            onSelect={setSelectedStoryId}
            showClient={!clientId}
          />
        ) : (
          <StoriesDailyCalendar
            stories={stories ?? []}
            isLoading={isLoading}
            onSelect={setSelectedStoryId}
          />
        )}
      </div>

      {sheetClientId ? (
        <StoryDetailSheet
          clientId={sheetClientId}
          story={selectedStory}
          open={Boolean(selectedStoryId)}
          onOpenChange={(open) => !open && setSelectedStoryId(null)}
        />
      ) : null}
      {clientId ? (
        <StoryDetailSheet clientId={clientId} open={creating} onOpenChange={setCreating} />
      ) : null}
    </div>
  );
}
