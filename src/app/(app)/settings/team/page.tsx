import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";
import { InviteMemberForm } from "@/components/settings/invite-member-form";
import { TeamMemberRow } from "@/components/settings/team-member-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TeamSettingsPage() {
  const profile = await getCurrentProfile();
  if (!can(profile?.role, "manageTeam")) redirect("/dashboard");

  const supabase = await createClient();
  const { data: profiles } = await supabase.from("profiles").select("*").order("full_name");

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Equipo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Invitá miembros del equipo y gestioná sus roles y acceso.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invitar miembro</CardTitle>
        </CardHeader>
        <CardContent>
          <InviteMemberForm />
        </CardContent>
      </Card>

      <div className="space-y-2">
        {(profiles ?? []).map((p) => (
          <TeamMemberRow key={p.id} profile={p} isSelf={p.id === profile?.id} />
        ))}
      </div>
    </div>
  );
}
