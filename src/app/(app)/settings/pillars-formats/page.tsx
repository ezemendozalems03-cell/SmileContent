import { createClient } from "@/lib/supabase/server";
import { PillarsFormatsManager } from "@/components/settings/pillars-formats-manager";

export default async function GlobalPillarsFormatsPage() {
  const supabase = await createClient();

  const [
    { data: pillars },
    { data: subpillars },
    { data: formats },
    { data: subFormats },
    { data: storyTypes },
    { data: objectives },
  ] = await Promise.all([
    supabase.from("pillars").select("*").is("client_id", null).order("sort_order"),
    supabase.from("subpillars").select("*").order("sort_order"),
    supabase.from("formats").select("*").is("client_id", null).order("sort_order"),
    supabase.from("sub_formats").select("*").order("sort_order"),
    supabase.from("story_types").select("*").is("client_id", null).order("sort_order"),
    supabase.from("content_objectives").select("*").is("client_id", null).order("sort_order"),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Pilares y formatos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Valores globales por defecto para todos los clientes. Cada cliente puede sumar los suyos
          propios desde su Configuración.
        </p>
      </div>
      <PillarsFormatsManager
        clientId={null}
        pillars={pillars ?? []}
        subpillars={subpillars ?? []}
        formats={formats ?? []}
        subFormats={subFormats ?? []}
        storyTypes={storyTypes ?? []}
        objectives={objectives ?? []}
      />
    </div>
  );
}
