"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Plus, Lightbulb, LayoutGrid, Rows3, KanbanSquare, CalendarPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { IdeaCard } from "@/components/ideas/idea-card";
import { IdeaDetailSheet } from "@/components/ideas/idea-detail-sheet";
import { IdeaFiltersBar } from "@/components/ideas/idea-filters-bar";
import { IdeaTable } from "@/components/ideas/idea-table";
import { IdeaKanbanBoard } from "@/components/ideas/idea-kanban-board";
import { IdeasExportMenu } from "@/components/ideas/ideas-export-menu";
import { BulkScheduleModal } from "@/components/ideas/bulk-schedule-modal";
import { useIdeas } from "@/lib/queries/use-ideas";
import { useClientsList } from "@/lib/queries/use-clients";
import { cn } from "@/lib/utils";
import type { IdeaWithRelations } from "@/lib/types/domain";

type View = "cards" | "table" | "kanban";

const VIEW_OPTIONS: { value: View; label: string; icon: typeof Rows3 }[] = [
  { value: "cards", label: "Tarjetas", icon: LayoutGrid },
  { value: "table", label: "Tabla", icon: Rows3 },
  { value: "kanban", label: "Kanban", icon: KanbanSquare },
];

export function IdeasWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [scheduling, setScheduling] = useState(false);

  const { data: clients } = useClientsList();

  const rawView = searchParams.get("view");
  const view: View = rawView === "table" ? "table" : rawView === "kanban" ? "kanban" : "cards";

  const filters = useMemo(
    () => ({
      clientId: searchParams.get("client") || undefined,
      pilarId: searchParams.get("pilar") || undefined,
      subpilarId: searchParams.get("subpilar") || undefined,
      tipoContenido: searchParams.get("tipo") || undefined,
      statuses: searchParams.get("estado") ? [searchParams.get("estado")!] : undefined,
      priority: searchParams.get("prioridad") || undefined,
      search: searchParams.get("q") || undefined,
    }),
    [searchParams],
  );

  const { data: ideas, isLoading } = useIdeas(filters);

  const selectedIdea = useMemo(
    () => ideas?.find((i) => i.id === selectedIdeaId),
    [ideas, selectedIdeaId],
  );

  const selectedIdeas = useMemo(
    () => (ideas ?? []).filter((i) => selectedIds.has(i.id)),
    [ideas, selectedIds],
  );

  // The bulk-scheduler writes to one client's content_items, so every
  // selected idea must resolve to the same client — either via the active
  // filter or because they all happen to share one.
  const bulkClientId = useMemo(() => {
    if (filters.clientId) return filters.clientId;
    const clientIds = new Set(selectedIdeas.map((i) => i.client_id).filter(Boolean));
    return clientIds.size === 1 ? [...clientIds][0]! : null;
  }, [filters.clientId, selectedIdeas]);

  function setView(next: View) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "cards") params.delete("view");
    else params.set("view", next);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function handleEdit(idea: IdeaWithRelations) {
    setSelectedIdeaId(idea.id);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleOpenSchedule() {
    if (!bulkClientId) {
      toast.error("Todas las ideas seleccionadas deben ser del mismo cliente (filtrá por cliente para calendarizar).");
      return;
    }
    setScheduling(true);
  }

  const clientName = filters.clientId ? clients?.find((c) => c.id === filters.clientId)?.name : undefined;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-6 pt-5 pb-1">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Banco de ideas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ideas sueltas para más adelante. Cuando estén listas, promovelas a una publicación real.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <IdeasExportMenu ideas={ideas ?? []} clientName={clientName} />
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            Nueva idea
          </Button>
        </div>
      </div>

      <IdeaFiltersBar />

      {selectedIds.size > 0 ? (
        <div className="flex items-center justify-between gap-2 border-b border-border bg-accent/20 px-6 py-2">
          <span className="text-xs font-medium text-muted-foreground">
            {selectedIds.size} idea{selectedIds.size === 1 ? "" : "s"} seleccionada{selectedIds.size === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleOpenSchedule}>
              <CalendarPlus className="size-3.5" />
              Agregar al calendario
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              <X className="size-3.5" />
              Deseleccionar
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex-1 overflow-auto">
        {view === "table" ? (
          <IdeaTable
            ideas={ideas ?? []}
            isLoading={isLoading}
            showClient
            onRowClick={handleEdit}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
          />
        ) : view === "kanban" ? (
          <IdeaKanbanBoard ideas={ideas ?? []} isLoading={isLoading} onEdit={handleEdit} />
        ) : isLoading ? (
          <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : ideas && ideas.length > 0 ? (
          <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {ideas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onEdit={() => handleEdit(idea)}
                selected={selectedIds.has(idea.id)}
                onToggleSelect={() => toggleSelect(idea.id)}
              />
            ))}
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={Lightbulb}
              title="No hay ideas"
              description="Anotá conceptos sueltos ahora y promovelos a una publicación cuando estén listos."
              action={
                <Button size="sm" onClick={() => setCreating(true)}>
                  <Plus className="size-4" />
                  Nueva idea
                </Button>
              }
            />
          </div>
        )}
      </div>

      <IdeaDetailSheet
        idea={selectedIdea}
        open={Boolean(selectedIdeaId)}
        onOpenChange={(open) => !open && setSelectedIdeaId(null)}
      />
      <IdeaDetailSheet open={creating} onOpenChange={setCreating} />

      <BulkScheduleModal
        open={scheduling}
        onOpenChange={setScheduling}
        ideaIds={[...selectedIds]}
        clientId={bulkClientId}
        onDone={() => setSelectedIds(new Set())}
      />
    </div>
  );
}
