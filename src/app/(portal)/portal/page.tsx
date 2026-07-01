import Link from "next/link";
import { Inbox } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { CONTENT_STATUS_LABELS, CONTENT_STATUS_COLORS } from "@/lib/constants/pipeline-status";

const PENDING_STATUSES = new Set(["enviado_al_cliente", "correcciones"]);

export default async function PortalHomePage() {
  const profile = await getCurrentProfile();

  const supabase = await createClient();
  const { data: items } = await supabase.rpc("get_portal_content_items");
  const pending = (items ?? []).filter((item) => PENDING_STATUSES.has(item.status));

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Hola, {profile?.full_name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Esto es lo que está esperando tu revisión.</p>
      </div>

      {pending && pending.length > 0 ? (
        <div className="space-y-2">
          {pending.map((item) => (
            <Link
              key={item.id}
              href={`/portal/contenido/${item.id}`}
              className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-accent/40"
            >
              <span className="flex-1 font-medium">{item.titulo}</span>
              <StatusBadge label={CONTENT_STATUS_LABELS[item.status]} colorClass={CONTENT_STATUS_COLORS[item.status]} />
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Inbox}
          title="Nada esperando tu revisión"
          description="Cuando tengamos contenido listo para tu aprobación, va a aparecer acá."
        />
      )}
    </div>
  );
}
