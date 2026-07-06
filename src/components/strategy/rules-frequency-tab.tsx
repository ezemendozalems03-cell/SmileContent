"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Gauge, ListChecks, Target, Trash2 } from "lucide-react";
import {
  createClientObjective,
  createStrategyRule,
  deleteClientObjective,
  deleteStrategyRule,
  toggleStrategyRule,
  updateClientObjective,
  upsertStrategySettings,
} from "@/lib/actions/strategy";
import {
  useClientObjectives,
  useInvalidateStrategy,
  useStrategyRules,
  useStrategySettings,
} from "@/lib/queries/use-strategy";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StrategyRuleCategoria } from "@/lib/types/database.types";

const CATEGORIA_LABELS: Record<StrategyRuleCategoria, string> = {
  secuencia: "Secuencia",
  frecuencia: "Frecuencia",
  contenido: "Contenido",
  otro: "Otro",
};

const PRIORIDAD_LABELS: Record<string, string> = {
  "5": "5 · Máxima",
  "4": "4 · Alta",
  "3": "3 · Media",
  "2": "2 · Baja",
  "1": "1 · Mínima",
};

function FrequencyCard({ clientId }: { clientId: string }) {
  const { data: settings, isLoading } = useStrategySettings(clientId);
  const invalidate = useInvalidateStrategy();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<{ posts: string; reels: string; historias: string; notas: string } | null>(null);

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  const v = values ?? {
    posts: String(settings?.posts_semanales ?? 3),
    reels: String(settings?.reels_semanales ?? 1),
    historias: String(settings?.historias_semanales ?? 5),
    notas: settings?.notas ?? "",
  };

  function handleSave() {
    startTransition(async () => {
      const result = await upsertStrategySettings(clientId, {
        posts_semanales: v.posts,
        reels_semanales: v.reels,
        historias_semanales: v.historias,
        notas: v.notas,
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Frecuencia guardada. La IA la respeta al planificar.");
      invalidate(clientId);
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Gauge className="size-4 text-primary" /> Frecuencia de publicación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Posts / semana</Label>
            <Input
              type="number"
              min={0}
              value={v.posts}
              onChange={(e) => setValues({ ...v, posts: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Reels / semana</Label>
            <Input
              type="number"
              min={0}
              value={v.reels}
              onChange={(e) => setValues({ ...v, reels: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Historias / semana</Label>
            <Input
              type="number"
              min={0}
              value={v.historias}
              onChange={(e) => setValues({ ...v, historias: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Notas</Label>
          <Textarea
            rows={2}
            value={v.notas}
            onChange={(e) => setValues({ ...v, notas: e.target.value })}
            placeholder="Ej: los reels salen martes y jueves; no publicar domingos."
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={pending}>
            {pending ? "Guardando..." : "Guardar frecuencia"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RulesCard({ clientId }: { clientId: string }) {
  const { data: rules, isLoading } = useStrategyRules(clientId);
  const invalidate = useInvalidateStrategy();
  const [regla, setRegla] = useState("");
  const [categoria, setCategoria] = useState<StrategyRuleCategoria>("otro");
  const [pending, startTransition] = useTransition();

  function handleAdd() {
    startTransition(async () => {
      const result = await createStrategyRule(clientId, { regla, categoria });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setRegla("");
      toast.success("Regla creada. La IA la respetará siempre.");
      invalidate(clientId);
    });
  }

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ListChecks className="size-4 text-primary" /> Reglas estratégicas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Ej: “Nunca publicar dos promociones seguidas”, “Siempre educación antes de conversión”,
          “Un testimonio por semana”, “Una pregunta cada diez publicaciones”.
        </p>
        <div className="space-y-2 rounded-md border border-border p-3">
          <Textarea
            rows={2}
            value={regla}
            onChange={(e) => setRegla(e.target.value)}
            placeholder="Nueva regla..."
          />
          <div className="flex items-center justify-between gap-2">
            <Select
              items={CATEGORIA_LABELS}
              value={categoria}
              onValueChange={(val) => setCategoria((val as StrategyRuleCategoria) ?? "otro")}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORIA_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleAdd} disabled={pending || !regla.trim()}>
              Agregar regla
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          {(rules ?? []).map((r) => (
            <div key={r.id} className="flex items-start gap-3 rounded-md border border-border p-3">
              <div className="min-w-0 flex-1">
                <p className={r.activo ? "text-sm" : "text-sm text-muted-foreground line-through"}>
                  {r.regla}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{CATEGORIA_LABELS[r.categoria]}</p>
              </div>
              <Switch
                size="sm"
                checked={r.activo}
                onCheckedChange={async (val) => {
                  const result = await toggleStrategyRule(r.id, clientId, Boolean(val));
                  if (result?.error) toast.error(result.error);
                  invalidate(clientId);
                }}
              />
              <button
                type="button"
                onClick={async () => {
                  if (!confirm("¿Eliminar esta regla?")) return;
                  const result = await deleteStrategyRule(r.id, clientId);
                  if (result?.error) toast.error(result.error);
                  invalidate(clientId);
                }}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ObjectivesCard({ clientId }: { clientId: string }) {
  const { data: objectives, isLoading } = useClientObjectives(clientId);
  const invalidate = useInvalidateStrategy();
  const [objetivo, setObjetivo] = useState("");
  const [prioridad, setPrioridad] = useState("3");
  const [pending, startTransition] = useTransition();

  function handleAdd() {
    startTransition(async () => {
      const result = await createClientObjective(clientId, { objetivo, prioridad });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setObjetivo("");
      invalidate(clientId);
    });
  }

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Target className="size-4 text-primary" /> Objetivos del cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Ej: generar consultas, vender productos, posicionar marca, conseguir seguidores, generar
          comunidad. La IA prioriza el contenido según estos objetivos.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-48 flex-1 space-y-2">
            <Label>Objetivo</Label>
            <Input value={objetivo} onChange={(e) => setObjetivo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Prioridad</Label>
            <Select items={PRIORIDAD_LABELS} value={prioridad} onValueChange={(v) => setPrioridad(v ?? "3")}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORIDAD_LABELS)
                  .sort((a, b) => Number(b[0]) - Number(a[0]))
                  .map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} disabled={pending || !objetivo.trim()}>
            Agregar
          </Button>
        </div>
        <div className="space-y-2">
          {(objectives ?? []).map((o) => (
            <div key={o.id} className="flex items-center gap-3 rounded-md border border-border p-3">
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                P{o.prioridad}
              </span>
              <p className={`min-w-0 flex-1 text-sm ${o.activo ? "" : "text-muted-foreground line-through"}`}>
                {o.objetivo}
              </p>
              <Switch
                size="sm"
                checked={o.activo}
                onCheckedChange={async (val) => {
                  const result = await updateClientObjective(o.id, clientId, { activo: Boolean(val) });
                  if (result?.error) toast.error(result.error);
                  invalidate(clientId);
                }}
              />
              <button
                type="button"
                onClick={async () => {
                  if (!confirm("¿Eliminar este objetivo?")) return;
                  const result = await deleteClientObjective(o.id, clientId);
                  if (result?.error) toast.error(result.error);
                  invalidate(clientId);
                }}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function RulesFrequencyTab({ clientId }: { clientId: string }) {
  return (
    <div className="space-y-4">
      <FrequencyCard clientId={clientId} />
      <ObjectivesCard clientId={clientId} />
      <RulesCard clientId={clientId} />
    </div>
  );
}
