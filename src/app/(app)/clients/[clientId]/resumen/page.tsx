import { notFound } from "next/navigation";
import { AtSign, Music2, Calendar, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ClientResumenPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("*").eq("id", clientId).single();
  if (!client) notFound();

  const brandColors = Array.isArray(client.brand_colors) ? (client.brand_colors as string[]) : [];

  return (
    <div className="grid gap-4 p-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Información del cliente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Inicio:</span>
            <span>{client.fecha_inicio ?? "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Plan:</span>
            <span>{client.plan_contratado ?? "—"}</span>
          </div>
          {client.instagram_url ? (
            <a
              href={client.instagram_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <AtSign className="size-4" />
              Instagram
            </a>
          ) : null}
          {client.tiktok_url ? (
            <a
              href={client.tiktok_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Music2 className="size-4" />
              TikTok
            </a>
          ) : null}
          {client.notes ? (
            <p className="sm:col-span-2 text-sm text-muted-foreground">{client.notes}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Marca</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {brandColors.length > 0 ? (
            <div className="flex gap-2">
              {brandColors.map((color) => (
                <div key={color} className="flex flex-col items-center gap-1">
                  <div
                    className="size-8 rounded-full ring-1 ring-border"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[10px] text-muted-foreground">{color}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin colores de marca cargados.</p>
          )}
          {client.brand_typography ? (
            <p className="text-sm">
              <span className="text-muted-foreground">Tipografía: </span>
              {client.brand_typography}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
