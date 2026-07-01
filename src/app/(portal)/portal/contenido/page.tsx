import Link from "next/link";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { CONTENT_STATUS_LABELS, CONTENT_STATUS_COLORS } from "@/lib/constants/pipeline-status";

export default async function PortalContenidoPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_portal_content_items");
  const items = [...(data ?? [])].sort((a, b) =>
    (b.fecha_publicacion ?? "").localeCompare(a.fecha_publicacion ?? ""),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-xl font-semibold tracking-tight">Contenido</h1>

      {items && items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/portal/contenido/${item.id}`}
              className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-accent/40"
            >
              <span className="flex-1 font-medium">{item.titulo}</span>
              {item.fecha_publicacion ? (
                <span className="text-xs text-muted-foreground">{item.fecha_publicacion}</span>
              ) : null}
              <StatusBadge label={CONTENT_STATUS_LABELS[item.status]} colorClass={CONTENT_STATUS_COLORS[item.status]} />
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={FileText} title="Todavía no hay contenido" />
      )}
    </div>
  );
}
