import type { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  CONTENT_KIND_LABELS,
  CONTENT_PRIORITY_COLORS,
  CONTENT_PRIORITY_LABELS,
} from "@/lib/constants/pipeline-status";
import { IDEA_STATUS_COLORS, IDEA_STATUS_LABELS } from "@/lib/constants/idea-status";
import type { IdeaWithRelations } from "@/lib/types/domain";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function getIdeaColumns({
  showClient,
  selectedIds,
  onToggleSelect,
}: {
  showClient: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}): ColumnDef<IdeaWithRelations>[] {
  const columns: ColumnDef<IdeaWithRelations>[] = [];

  if (onToggleSelect) {
    columns.push({
      id: "select",
      header: "",
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds?.has(row.original.id) ?? false}
          onCheckedChange={() => onToggleSelect(row.original.id)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    });
  }

  columns.push({
    accessorKey: "title",
    header: "Título",
    cell: ({ row }) => <div className="max-w-72 truncate font-medium">{row.original.title}</div>,
  });

  if (showClient) {
    columns.push({
      id: "client",
      header: "Cliente",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.client?.name ?? "—"}</span>
      ),
    });
  }

  columns.push(
    {
      id: "pilar",
      header: "Pilar",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.pilar?.name ?? "—"}</span>
      ),
    },
    {
      id: "subpilar",
      header: "Subpilar",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.subpilar?.name ?? "—"}</span>
      ),
    },
    {
      accessorKey: "tipo_contenido",
      header: "Tipo",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{CONTENT_KIND_LABELS[row.original.tipo_contenido]}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => (
        <StatusBadge
          label={IDEA_STATUS_LABELS[row.original.status]}
          colorClass={IDEA_STATUS_COLORS[row.original.status]}
        />
      ),
    },
    {
      accessorKey: "priority",
      header: "Prioridad",
      cell: ({ row }) => (
        <StatusBadge
          label={CONTENT_PRIORITY_LABELS[row.original.priority]}
          colorClass={CONTENT_PRIORITY_COLORS[row.original.priority]}
        />
      ),
    },
    {
      accessorKey: "fecha_sugerida",
      header: "Fecha sugerida",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.fecha_sugerida ?? "—"}</span>
      ),
    },
    {
      id: "creator",
      header: "Creado por",
      cell: ({ row }) => {
        const creator = row.original.creator;
        if (!creator) return <span className="text-sm text-muted-foreground">—</span>;
        return (
          <div className="flex items-center gap-1.5">
            <Avatar size="sm">
              <AvatarImage src={creator.avatar_url ?? undefined} alt={creator.full_name} />
              <AvatarFallback className="text-[10px]">{initials(creator.full_name)}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{creator.full_name}</span>
          </div>
        );
      },
    },
  );

  return columns;
}
