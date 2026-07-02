"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Upload, Rows3, CalendarRange, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoriesList } from "@/components/stories/stories-list";
import { StoriesDailyCalendar } from "@/components/stories/stories-daily-calendar";
import { StoryKanbanBoard } from "@/components/stories/story-kanban-board";
import { StoryDetailSheet } from "@/components/stories/story-detail-sheet";
import { ImportStoriesCsvDialog } from "@/components/stories/import-stories-csv-dialog";
import { useStories } from "@/lib/queries/use-stories";
import { cn } from "@/lib/utils";

type View = "list" | "daily" | "board";

export function StoriesWorkspace({ clientId, title }: { clientId?: string; title?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);

  const rawView = searchParams.get("view");
  const view: View = !clientId ? "list" : rawView === "list" ? "list" : rawView === "board" ? "board" : "daily";
  const { data: stories, isLoading } = useStories(clientId);

  function setView(next: View) {
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
              <button
                type="button"
                onClick={() => setView("board")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
                  view === "board" ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                <LayoutGrid className="size-3.5" />
                Tablero
              </button>
            </div>
          ) : null}
          {clientId ? (
            <Button size="sm" variant="outline" onClick={() => setImporting(true)}>
              <Upload className="size-4" />
              Importar CSV
            </Button>
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
        ) : view === "board" ? (
          <StoryKanbanBoard
            stories={stories ?? []}
            isLoading={isLoading}
            onEdit={(story) => setSelectedStoryId(story.id)}
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
      {clientId ? (
        <ImportStoriesCsvDialog open={importing} onOpenChange={setImporting} defaultClientId={clientId} />
      ) : null}
    </div>
  );
}
