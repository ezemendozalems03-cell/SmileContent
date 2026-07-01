import { addDays, format } from "date-fns";
import {
  Building2,
  FileText,
  Palette,
  Scissors,
  Clock,
  CheckCircle,
  Send,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { UpcomingPublications } from "@/components/dashboard/upcoming-publications";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { RecentActivityFeed } from "@/components/dashboard/recent-activity-feed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/lib/types/domain";

export default async function DashboardPage() {
  const supabase = await createClient();
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const in7Days = format(addDays(now, 7), "yyyy-MM-dd");

  const [{ data: statsData }, { data: upcoming }, { data: overdue }, { data: recent }, { data: correccionesRows }] =
    await Promise.all([
      supabase.rpc("dashboard_stats"),
      supabase
        .from("content_items")
        .select("id, titulo, fecha_publicacion, status, client:clients(name)")
        .gte("fecha_publicacion", today)
        .lte("fecha_publicacion", in7Days)
        .order("fecha_publicacion", { ascending: true })
        .limit(8),
      supabase
        .from("content_items")
        .select("id, titulo, fecha_publicacion, client:clients(name)")
        .lt("fecha_publicacion", today)
        .not("status", "in", "(publicado,archivado,medido)")
        .order("fecha_publicacion", { ascending: true })
        .limit(8),
      supabase
        .from("content_items")
        .select("id, titulo, updated_at, client:clients(name)")
        .order("updated_at", { ascending: false })
        .limit(8),
      supabase
        .from("content_items")
        .select("client:clients(name)")
        .eq("status", "correcciones"),
    ]);

  const stats = (statsData ?? {}) as Partial<DashboardStats>;

  const correccionesPorCliente = new Map<string, number>();
  for (const row of correccionesRows ?? []) {
    const name = (row.client as unknown as { name: string } | null)?.name ?? "Sin cliente";
    correccionesPorCliente.set(name, (correccionesPorCliente.get(name) ?? 0) + 1);
  }
  const topCorrecciones = Array.from(correccionesPorCliente.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  function mapItem<T extends Record<string, unknown>>(item: T) {
    const client = item.client as unknown as { name: string } | null;
    const { client: _client, ...rest } = item;
    void _client;
    return { ...rest, client_name: client?.name ?? null };
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Panorama general de la agencia.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Clientes activos" value={stats.clientes_activos ?? 0} icon={Building2} />
        <StatCard label="Contenidos este mes" value={stats.contenidos_mes ?? 0} icon={FileText} />
        <StatCard label="Posts pendientes" value={stats.pendientes_posts ?? 0} icon={Clock} />
        <StatCard label="Historias pendientes" value={stats.pendientes_historias ?? 0} icon={Clock} />
        <StatCard label="Reels pendientes" value={stats.pendientes_reels ?? 0} icon={Clock} />
        <StatCard label="En diseño" value={stats.en_diseno ?? 0} icon={Palette} />
        <StatCard label="En edición" value={stats.en_edicion ?? 0} icon={Scissors} />
        <StatCard label="Esperando aprobación" value={stats.esperando_aprobacion ?? 0} icon={Send} />
        <StatCard label="Aprobados" value={stats.aprobados ?? 0} icon={CheckCircle} />
        <StatCard label="Publicados" value={stats.publicados ?? 0} icon={Sparkles} />
        <StatCard label="Correcciones pendientes" value={stats.correcciones_pendientes ?? 0} icon={AlertCircle} />
        <StatCard label="Avance mensual" value={stats.avance_mensual_pct ?? 0} suffix="%" icon={FileText} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <UpcomingPublications items={(upcoming ?? []).map((i) => mapItem(i)) as never} />
        <AlertsPanel items={(overdue ?? []).map((i) => mapItem(i)) as never} />
        <RecentActivityFeed items={(recent ?? []).map((i) => mapItem(i)) as never} />
      </div>

      {topCorrecciones.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Clientes con más correcciones pendientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {topCorrecciones.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between px-2 py-1.5 text-sm">
                <span>{name}</span>
                <span className="text-muted-foreground">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
