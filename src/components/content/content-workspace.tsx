"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, LayoutGrid, Rows3, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentFiltersBar } from "@/components/content/content-filters-bar";
import { ContentTable } from "@/components/content/content-table";
import { KanbanBoard } from "@/components/content/kanban/kanban-board";
import { ContentCalendar } from "@/components/content/calendar/content-calendar";
import { useContentItems } from "@/lib/queries/use-content-items";
import { createDraftContentItem } from "@/lib/actions/content-items";
import { cn } from "@/lib/utils";
import type { ContentKind } from "@/lib/types/database.types";

type View = "table" | "board" | "calendar";

const VIEW_OPTIONS: { value: View; label: string; icon: typeof Rows3 }[] = [
  { value: "table", label: "Tabla", icon: Rows3 },
  { value: "board", label: "Kanban", icon: LayoutGrid },
  { value: "calendar", label: "Calendario", icon: CalendarDays },
];

export function ContentWorkspace({
  clientId,
  lockedFormatKind,
  forcedView,
  title,
}: {
  clientId?: string;
  /** Locks the view to a single tipo_contenido (used by the Reels/TikToks tabs). */
  lockedFormatKind?: ContentKind;
  /** Locks the view and hides the toggle (used by the dedicated Calendario tab). */
  forcedView?: View;
  title?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [creating, setCreating] = useState(false);

  const rawView = searchParams.get("view");
  const view: View = forcedView ?? (rawView === "board" ? "board" : rawView === "calendar" ? "calendar" : "table");
  const basePath = clientId
    ? `/clients/${clientId}/${forcedView === "calendar" ? "calendario" : "publicaciones"}`
    : "/content";
  const detailBasePath = "/content";

  const filters = useMemo(() => {
    const clientFilter = clientId ?? searchParams.get("client") ?? undefined;
    return {
      clientId: clientFilter || undefined,
      pilarId: searchParams.get("pilar") || undefined,
      formatoId: searchParams.get("formato") || undefined,
      statuses: searchParams.get("estado") ? [searchParams.get("estado")!] : undefined,
      assigneeId: searchParams.get("responsable") || undefined,
      search: searchParams.get("q") || undefined,
    };
  }, [clientId, searchParams]);

  const { data: items, isLoading } = useContentItems(filters);

  const visibleItems = useMemo(() => {
    if (!lockedFormatKind || !items) return items ?? [];
    return items.filter((item) => item.tipo_contenido === lockedFormatKind);
  }, [items, lockedFormatKind]);

  function setView(next: View) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "table") params.delete("view");
    else params.set("view", next);
    router.replace(`${basePath}?${params.toString()}`, { scroll: false });
  }

  async function handleCreate() {
    const targetClientId = clientId ?? searchParams.get("client");
    if (!targetClientId) return;
    setCreating(true);
    const result = await createDraftContentItem(targetClientId);
    setCreating(false);
    if ("id" in result) {
      router.push(`${detailBasePath}/${result.id}`);
    }
  }

  const canCreate = Boolean(clientId ?? searchParams.get("client"));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-6 pt-5 pb-1">
        <h1 className="text-xl font-semibold tracking-tight">{title ?? "Contenido"}</h1>
        <div className="flex items-center gap-2">
          {!forcedView ? (
            <div className="flex items-center rounded-lg border border-border p-0.5">
              {VIEW_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setView(value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
                    view === value ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>
          ) : null}
          <Button size="sm" disabled={!canCreate || creating} onClick={handleCreate}>
            <Plus className="size-4" />
            Nueva publicación
          </Button>
        </div>
      </div>

      <ContentFiltersBar clientId={clientId} />

      <div className="flex-1 overflow-auto">
        {view === "table" ? (
          <ContentTable
            items={visibleItems}
            isLoading={isLoading}
            showClient={!clientId}
            basePath={detailBasePath}
          />
        ) : view === "board" ? (
          <KanbanBoard items={visibleItems} isLoading={isLoading} detailBasePath={detailBasePath} />
        ) : (
          <ContentCalendar items={visibleItems} isLoading={isLoading} detailBasePath={detailBasePath} />
        )}
      </div>
    </div>
  );
}
