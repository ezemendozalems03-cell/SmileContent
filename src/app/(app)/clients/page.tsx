import Link from "next/link";
import { Plus, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";
import { ClientCard } from "@/components/clients/client-card";
import { EmptyState } from "@/components/shared/empty-state";

export default async function ClientsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada cliente tiene su propio espacio: calendario, publicaciones, historias y biblioteca.
          </p>
        </div>
        {can(profile?.role, "manageClients") ? (
          <Button render={<Link href="/clients/new" />}>
            <Plus className="size-4" />
            Nuevo cliente
          </Button>
        ) : null}
      </div>

      {clients && clients.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title="Todavía no hay clientes"
          description="Creá el primer cliente (por ejemplo, Smile Motors) para empezar a planificar contenido."
          action={
            can(profile?.role, "manageClients") ? (
              <Button render={<Link href="/clients/new" />}>
                <Plus className="size-4" />
                Nuevo cliente
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
