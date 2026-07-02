"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useContentGoals } from "@/lib/queries/use-content-goals";
import { useTaxonomy } from "@/lib/queries/use-taxonomy";
import { upsertContentGoal, deleteContentGoal } from "@/lib/actions/content-goals";
import { CONTENT_KIND_LABELS } from "@/lib/constants/pipeline-status";
import type { ContentKind } from "@/lib/types/database.types";

const BASE_KINDS: ContentKind[] = ["post", "reel", "story", "tiktok"];
const NONE = "__none__";

function BaseKindRow({
  clientId,
  year,
  month,
  kind,
  currentTarget,
}: {
  clientId: string;
  year: number;
  month: number;
  kind: ContentKind;
  currentTarget: number;
}) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(String(currentTarget));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await upsertContentGoal({
      clientId,
      year,
      month,
      tipoContenido: kind,
      formatoId: null,
      targetCount: Number(value) || 0,
    });
    setSaving(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Objetivo guardado");
    queryClient.invalidateQueries({ queryKey: ["content-goals", clientId, year, month] });
    queryClient.invalidateQueries({ queryKey: ["monthly-goals-progress", clientId, year, month] });
  }

  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-sm">{CONTENT_KIND_LABELS[kind]}</span>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-8 w-24"
      />
      <Button size="xs" variant="outline" onClick={handleSave} disabled={saving}>
        Guardar
      </Button>
    </div>
  );
}

function FormatGoalRow({
  clientId,
  year,
  month,
  formatOptions,
}: {
  clientId: string;
  year: number;
  month: number;
  formatOptions: { id: string; name: string }[];
}) {
  const queryClient = useQueryClient();
  const [formatoId, setFormatoId] = useState(NONE);
  const [target, setTarget] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (formatoId === NONE) {
      toast.error("Elegí un formato.");
      return;
    }
    setSaving(true);
    const result = await upsertContentGoal({
      clientId,
      year,
      month,
      tipoContenido: "post",
      formatoId,
      targetCount: Number(target) || 0,
    });
    setSaving(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Objetivo de formato agregado");
    setFormatoId(NONE);
    setTarget("");
    queryClient.invalidateQueries({ queryKey: ["content-goals", clientId, year, month] });
    queryClient.invalidateQueries({ queryKey: ["monthly-goals-progress", clientId, year, month] });
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        items={{ [NONE]: "Elegí un formato", ...Object.fromEntries(formatOptions.map((f) => [f.id, f.name])) }}
        value={formatoId}
        onValueChange={(v) => setFormatoId(v ?? NONE)}
      >
        <SelectTrigger size="sm" className="w-48">
          <SelectValue placeholder="Elegí un formato" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Elegí un formato</SelectItem>
          {formatOptions.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {f.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="number"
        min={0}
        placeholder="Objetivo"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        className="h-8 w-24"
      />
      <Button size="xs" variant="outline" onClick={handleAdd} disabled={saving}>
        <Plus className="size-3.5" />
        Agregar
      </Button>
    </div>
  );
}

export function GoalsConfigSection({ clientId, year, month }: { clientId: string; year: number; month: number }) {
  const queryClient = useQueryClient();
  const { data: goals, isLoading } = useContentGoals(clientId, year, month);
  const { data: taxonomy } = useTaxonomy(clientId);

  const goalByKind = new Map((goals ?? []).filter((g) => !g.formato_id).map((g) => [g.tipo_contenido, g.target_count]));
  const formatGoals = (goals ?? []).filter((g) => g.formato_id);

  async function handleDelete(id: string) {
    const result = await deleteContentGoal(id, clientId);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["content-goals", clientId, year, month] });
    queryClient.invalidateQueries({ queryKey: ["monthly-goals-progress", clientId, year, month] });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Objetivos de contenido</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            {BASE_KINDS.map((kind) => (
              <Skeleton key={kind} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {BASE_KINDS.map((kind) => (
              // Keying on the loaded target forces a remount once real data
              // arrives, instead of leaving the input stuck on 0 from the
              // pre-fetch mount (local input state doesn't resync on props).
              <BaseKindRow
                key={`${kind}-${goalByKind.get(kind) ?? 0}`}
                clientId={clientId}
                year={year}
                month={month}
                kind={kind}
                currentTarget={goalByKind.get(kind) ?? 0}
              />
            ))}
          </div>
        )}

        {formatGoals.length > 0 ? (
          <div className="space-y-1.5 border-t border-border pt-3">
            <Label className="text-xs text-muted-foreground">Objetivos específicos por formato</Label>
            {formatGoals.map((g) => (
              <div key={g.id} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  {g.formato?.name ?? "Formato"} — {g.target_count}
                </span>
                <button type="button" onClick={() => handleDelete(g.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div className="border-t border-border pt-3">
          <Label className="mb-1.5 block text-xs text-muted-foreground">Agregar objetivo específico de formato</Label>
          <FormatGoalRow clientId={clientId} year={year} month={month} formatOptions={taxonomy?.formats ?? []} />
        </div>
      </CardContent>
    </Card>
  );
}
