import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientSubNav } from "@/components/layout/client-sub-nav";
import { StatusBadge } from "@/components/shared/status-badge";
import { CLIENT_STATUS_COLORS, CLIENT_STATUS_LABELS } from "@/lib/constants/pipeline-status";

export default async function ClientDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("*").eq("id", clientId).single();

  if (!client) notFound();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{client.name}</h1>
          {client.rubro ? <p className="text-sm text-muted-foreground">{client.rubro}</p> : null}
        </div>
        <StatusBadge
          label={CLIENT_STATUS_LABELS[client.status]}
          colorClass={CLIENT_STATUS_COLORS[client.status]}
        />
      </div>
      <ClientSubNav clientId={clientId} />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
