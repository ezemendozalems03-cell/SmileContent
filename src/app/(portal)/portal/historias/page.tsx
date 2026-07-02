import Link from "next/link";
import { CircleDot } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { STORY_STATUS_LABELS, STORY_STATUS_COLORS } from "@/lib/constants/pipeline-status";

export default async function PortalHistoriasPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_portal_stories");
  const items = [...(data ?? [])].sort((a, b) => (b.fecha ?? "").localeCompare(a.fecha ?? ""));

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-xl font-semibold tracking-tight">Historias</h1>

      {items && items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/portal/historias/${item.id}`}
              className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-accent/40"
            >
              <span className="flex-1 font-medium">{item.nombre}</span>
              {item.fecha ? <span className="text-xs text-muted-foreground">{item.fecha}</span> : null}
              <StatusBadge label={STORY_STATUS_LABELS[item.status]} colorClass={STORY_STATUS_COLORS[item.status]} />
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={CircleDot} title="Todavía no hay historias" />
      )}
    </div>
  );
}
