import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateClientAction } from "@/lib/actions/clients";
import { getCurrentProfile } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";
import { ClientForm } from "@/components/clients/client-form";
import { PillarsFormatsManager } from "@/components/settings/pillars-formats-manager";
import { ClientPortalAccess } from "@/components/clients/client-portal-access";
import { SocialAccountsPanel } from "@/components/publishing/social-accounts-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ClientConfiguracionPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("*").eq("id", clientId).single();
  if (!client) notFound();

  const scopeFilter = `client_id.is.null,client_id.eq.${clientId}`;
  const [
    { data: pillars },
    { data: subpillars },
    { data: formats },
    { data: subFormats },
    { data: storyTypes },
    { data: objectives },
  ] = await Promise.all([
    supabase.from("pillars").select("*").or(scopeFilter).order("sort_order"),
    supabase.from("subpillars").select("*").order("sort_order"),
    supabase.from("formats").select("*").or(scopeFilter).order("sort_order"),
    supabase.from("sub_formats").select("*").order("sort_order"),
    supabase.from("story_types").select("*").or(scopeFilter).order("sort_order"),
    supabase.from("content_objectives").select("*").or(scopeFilter).order("sort_order"),
  ]);

  const boundAction = updateClientAction.bind(null, clientId);

  let portalUsers: { profile_id: string; full_name: string; email: string }[] = [];
  if (can(profile?.role, "manageClients")) {
    const { data: clientMembers } = await supabase
      .from("client_members")
      .select("profile_id, profile:profiles(id, full_name, email, role)")
      .eq("client_id", clientId);

    portalUsers = (clientMembers ?? [])
      .map((cm) => cm.profile as unknown as { id: string; full_name: string; email: string; role: string } | null)
      .filter((p): p is { id: string; full_name: string; email: string; role: string } => p?.role === "client")
      .map((p) => ({ profile_id: p.id, full_name: p.full_name, email: p.email }));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Datos del cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientForm action={boundAction} defaultValues={client} submitLabel="Guardar cambios" />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold">Pilares y formatos de este cliente</h2>
        <PillarsFormatsManager
          clientId={clientId}
          pillars={pillars ?? []}
          subpillars={subpillars ?? []}
          formats={formats ?? []}
          subFormats={subFormats ?? []}
          storyTypes={storyTypes ?? []}
          objectives={objectives ?? []}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Canales conectados</CardTitle>
        </CardHeader>
        <CardContent>
          <SocialAccountsPanel clientId={clientId} />
        </CardContent>
      </Card>

      {can(profile?.role, "manageClients") ? (
        <Card>
          <CardHeader>
            <CardTitle>Acceso del cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientPortalAccess clientId={clientId} users={portalUsers} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
