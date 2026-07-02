import type { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  CONTENT_STATUS_COLORS,
  CONTENT_STATUS_LABELS,
  CONTENT_PRIORITY_COLORS,
  CONTENT_PRIORITY_LABELS,
} from "@/lib/constants/pipeline-status";
import type { ContentItemWithRelations } from "@/lib/types/domain";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function getContentColumns({
  showClient,
}: {
  showClient: boolean;
}): ColumnDef<ContentItemWithRelations>[] {
  const columns: ColumnDef<ContentItemWithRelations>[] = [
    {
      accessorKey: "titulo",
      header: "Titulo",
      cell: ({ row }) => (
        <div className="max-w-72 truncate text-sm font-semibold text-foreground">{row.original.titulo}</div>
      ),
    },
  ];

  if (showClient) {
    columns.push({
      id: "client",
      header: "Cliente",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground/80">{row.original.client?.name ?? "—"}</span>
      ),
    });
  }

  columns.push(
    {
      id: "formato",
      header: "Formato",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground/80">{row.original.formato?.name ?? "—"}</span>
      ),
    },
    {
      id: "pilar",
      header: "Pilar",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground/80">{row.original.pilar?.name ?? "—"}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => (
        <StatusBadge
          label={CONTENT_STATUS_LABELS[row.original.status]}
          colorClass={CONTENT_STATUS_COLORS[row.original.status]}
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
      accessorKey: "fecha_publicacion",
      header: "Fecha",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground/80 tabular-nums">
          {row.original.fecha_publicacion ?? "—"}
        </span>
      ),
    },
    {
      id: "assignee",
      header: "Responsable",
      cell: ({ row }) => {
        const assignee = row.original.assignee;
        if (!assignee) return <span className="text-sm text-muted-foreground/80">—</span>;
        return (
          <div className="flex items-center gap-1.5">
            <Avatar size="sm">
              <AvatarImage src={assignee.avatar_url ?? undefined} alt={assignee.full_name} />
              <AvatarFallback className="text-[10px]">{initials(assignee.full_name)}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{assignee.full_name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "vistas",
      header: () => <div className="text-right">Vistas</div>,
      cell: ({ row }) => (
        <div className="text-right text-sm font-medium tabular-nums text-foreground">
          {row.original.vistas.toLocaleString("es-AR")}
        </div>
      ),
    },
  );

  return columns;
}
