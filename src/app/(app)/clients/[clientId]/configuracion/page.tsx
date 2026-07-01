import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateClientAction } from "@/lib/actions/clients";
import { ClientForm } from "@/components/clients/client-form";
import { PillarsFormatsManager } from "@/components/settings/pillars-formats-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ClientConfiguracionPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("*").eq("id", clientId).single();
  if (!client) notFound();

  const scopeFilter = `client_id.is.null,client_id.eq.${clientId}`;
  const [{ data: pillars }, { data: subpillars }, { data: formats }, { data: subFormats }, { data: storyTypes }] =
    await Promise.all([
      supabase.from("pillars").select("*").or(scopeFilter).order("sort_order"),
      supabase.from("subpillars").select("*").order("sort_order"),
      supabase.from("formats").select("*").or(scopeFilter).order("sort_order"),
      supabase.from("sub_formats").select("*").order("sort_order"),
      supabase.from("story_types").select("*").or(scopeFilter).order("sort_order"),
    ]);

  const boundAction = updateClientAction.bind(null, clientId);

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
        />
      </div>
    </div>
  );
}
