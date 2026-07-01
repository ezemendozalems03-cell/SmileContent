import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Item = {
  id: string;
  titulo: string;
  fecha_publicacion: string | null;
  client_name: string | null;
};

export function AlertsPanel({ items }: { items: Item[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-400" />
          Contenidos atrasados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.length === 0 ? (
          <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-emerald-400" />
            Sin atrasos — todo al día.
          </div>
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              href={`/content/${item.id}`}
              className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-accent/40"
            >
              <span className="truncate font-medium">{item.titulo}</span>
              <span className="shrink-0 text-xs text-red-400">{item.fecha_publicacion}</span>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
