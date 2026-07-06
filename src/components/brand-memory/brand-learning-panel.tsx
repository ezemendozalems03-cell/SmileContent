"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Lightbulb, Trash2 } from "lucide-react";
import {
  createBrandLearning,
  deleteBrandLearning,
  toggleBrandLearning,
} from "@/lib/actions/brand-memory";
import { useBrandLearnings, useInvalidateBrandMemory } from "@/lib/queries/use-brand-memory";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BrandLearningCategory } from "@/lib/types/database.types";

const CATEGORIA_LABELS: Record<BrandLearningCategory, string> = {
  estilo: "Estilo",
  lenguaje: "Lenguaje",
  rendimiento: "Rendimiento",
  otro: "Otro",
};

export function BrandLearningPanel({ clientId }: { clientId: string }) {
  const { data: learnings, isLoading } = useBrandLearnings(clientId);
  const invalidate = useInvalidateBrandMemory();
  const [contenido, setContenido] = useState("");
  const [categoria, setCategoria] = useState<BrandLearningCategory>("otro");
  const [pending, startTransition] = useTransition();

  function handleAdd() {
    startTransition(async () => {
      const result = await createBrandLearning(clientId, { contenido, categoria });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setContenido("");
      invalidate(clientId);
      toast.success("Aprendizaje guardado. La IA lo aplicará en cada generación.");
    });
  }

  async function handleToggle(id: string, activo: boolean) {
    const result = await toggleBrandLearning(id, clientId, activo);
    if (result?.error) toast.error(result.error);
    invalidate(clientId);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este aprendizaje?")) return;
    const result = await deleteBrandLearning(id, clientId);
    if (result?.error) toast.error(result.error);
    invalidate(clientId);
  }

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Reglas acumuladas que la IA respeta siempre. Ej: &quot;No usar la palabra financiación&quot;,
        &quot;Hablar siempre de opciones de pago&quot;, &quot;Evitar mucho texto en los diseños&quot;.
      </p>

      <div className="space-y-2 rounded-md border border-border p-3">
        <Textarea
          rows={2}
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          placeholder="Nuevo aprendizaje..."
        />
        <div className="flex items-center justify-between gap-2">
          <Select
            items={CATEGORIA_LABELS}
            value={categoria}
            onValueChange={(v) => setCategoria((v as BrandLearningCategory) ?? "otro")}
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
          <Button size="sm" onClick={handleAdd} disabled={pending || !contenido.trim()}>
            {pending ? "Guardando..." : "Agregar"}
          </Button>
        </div>
      </div>

      {(learnings ?? []).length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          Todavía no hay aprendizajes cargados.
        </p>
      ) : (
        <div className="space-y-2">
          {(learnings ?? []).map((l) => (
            <div key={l.id} className="flex items-start gap-3 rounded-md border border-border p-3">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className={l.activo ? "text-sm" : "text-sm text-muted-foreground line-through"}>
                  {l.contenido}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{CATEGORIA_LABELS[l.categoria]}</p>
              </div>
              <Switch
                size="sm"
                checked={l.activo}
                onCheckedChange={(v) => handleToggle(l.id, Boolean(v))}
              />
              <button
                type="button"
                onClick={() => handleDelete(l.id)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
