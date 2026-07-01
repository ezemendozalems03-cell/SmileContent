import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";

type Item = {
  id: string;
  titulo: string;
  updated_at: string;
  client_name: string | null;
};

export function RecentActivityFeed({ items }: { items: Item[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad reciente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.length === 0 ? (
          <EmptyState icon={Activity} title="Todavía no hay actividad" />
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              href={`/content/${item.id}`}
              className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-accent/40"
            >
              <div className="min-w-0">
                <p className="truncate">
                  <span className="font-medium">{item.titulo}</span>{" "}
                  <span className="text-muted-foreground">se actualizó</span>
                </p>
                <p className="text-xs text-muted-foreground">{item.client_name}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true, locale: es })}
              </span>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
