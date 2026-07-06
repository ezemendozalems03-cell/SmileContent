import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  StatusCell,
  PriorityCell,
  FormatoCell,
  SubFormatoCell,
  PilarCell,
  SubpilarCell,
  ObjetivoCell,
} from "@/components/content/inline-cells";
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
  basePath,
}: {
  showClient: boolean;
  basePath: string;
}): ColumnDef<ContentItemWithRelations>[] {
  const columns: ColumnDef<ContentItemWithRelations>[] = [
    {
      accessorKey: "titulo",
      header: "Nombre",
      cell: ({ row }) => (
        <Link
          href={`${basePath}/${row.original.id}`}
          onClick={(e) => e.stopPropagation()}
          className="block max-w-32 truncate text-[11px] font-semibold text-foreground hover:underline"
        >
          {row.original.titulo}
        </Link>
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
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => <StatusCell item={row.original} />,
    },
    {
      id: "formato",
      header: "Formato",
      cell: ({ row }) => <FormatoCell item={row.original} />,
    },
    {
      id: "sub_formato",
      header: "Sub formato",
      cell: ({ row }) => <SubFormatoCell item={row.original} />,
    },
    {
      id: "objetivo",
      header: "Tipo de contenido",
      cell: ({ row }) => <ObjetivoCell item={row.original} />,
    },
    {
      id: "pilar",
      header: "Pilar",
      cell: ({ row }) => <PilarCell item={row.original} />,
    },
    {
      id: "subpilar",
      header: "Sub pilar",
      cell: ({ row }) => <SubpilarCell item={row.original} />,
    },
    {
      accessorKey: "priority",
      header: "Prioridad",
      cell: ({ row }) => <PriorityCell item={row.original} />,
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
      id: "enlace",
      header: "Enlace",
      cell: ({ row }) => {
        const link =
          row.original.link_publicacion_final ??
          row.original.link_drive ??
          row.original.link_canva ??
          row.original.link_capcut;
        if (!link) return <span className="px-1 text-xs text-muted-foreground/60">—</span>;
        return (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="size-3.5" />
            Abrir
          </a>
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
            <span className="text-sm whitespace-nowrap">{assignee.full_name}</span>
          </div>
        );
      },
    },
  );

  return columns;
}
