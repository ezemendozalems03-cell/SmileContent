import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { CONTENT_STATUS_COLORS, CONTENT_STATUS_LABELS } from "@/lib/constants/pipeline-status";

type Item = {
  id: string;
  titulo: string;
  fecha_publicacion: string | null;
  status: keyof typeof CONTENT_STATUS_LABELS;
  client_name: string | null;
};

export function UpcomingPublications({ items }: { items: Item[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximas publicaciones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.length === 0 ? (
          <EmptyState icon={CalendarClock} title="Nada programado en los próximos 7 días" />
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              href={`/content/${item.id}`}
              className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-accent/40"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{item.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  {item.client_name ?? "—"} · {item.fecha_publicacion}
                </p>
              </div>
              <StatusBadge
                label={CONTENT_STATUS_LABELS[item.status]}
                colorClass={CONTENT_STATUS_COLORS[item.status]}
              />
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
