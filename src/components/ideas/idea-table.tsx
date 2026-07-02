"use client";

import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Lightbulb } from "lucide-react";
import { getIdeaColumns } from "@/components/ideas/idea-table-columns";
import type { IdeaWithRelations } from "@/lib/types/domain";

export function IdeaTable({
  ideas,
  isLoading,
  showClient,
  onRowClick,
  selectedIds,
  onToggleSelect,
}: {
  ideas: IdeaWithRelations[];
  isLoading: boolean;
  showClient: boolean;
  onRowClick: (idea: IdeaWithRelations) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}) {
  const table = useReactTable({
    data: ideas,
    columns: getIdeaColumns({ showClient, selectedIds, onToggleSelect }),
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="space-y-2 p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (ideas.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Lightbulb}
          title="No hay ideas"
          description="Creá la primera idea o ajustá los filtros."
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="cursor-pointer" onClick={() => onRowClick(row.original)}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
