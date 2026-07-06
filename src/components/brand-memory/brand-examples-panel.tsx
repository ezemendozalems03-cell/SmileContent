"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Sparkles, Trash2, Plus } from "lucide-react";
import { createBrandExample, deleteBrandExample } from "@/lib/actions/brand-memory";
import { useBrandExamples, useInvalidateBrandMemory } from "@/lib/queries/use-brand-memory";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONTENT_KIND_LABELS } from "@/lib/constants/pipeline-status";
import type { ContentKind } from "@/lib/types/database.types";

function AddExampleDialog({
  clientId,
  open,
  onOpenChange,
}: {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<ContentKind>("post");
  const [hook, setHook] = useState("");
  const [copy, setCopy] = useState("");
  const [cta, setCta] = useState("");
  const [pending, startTransition] = useTransition();
  const invalidate = useInvalidateBrandMemory();

  function handleSave() {
    startTransition(async () => {
      const result = await createBrandExample(clientId, {
        titulo,
        tipo_contenido: tipo,
        hook,
        copy,
        cta,
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Ejemplo agregado.");
      invalidate(clientId);
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Agregar ejemplo manual</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                items={CONTENT_KIND_LABELS}
                value={tipo}
                onValueChange={(v) => setTipo((v as ContentKind) ?? "post")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONTENT_KIND_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Hook</Label>
            <Input value={hook} onChange={(e) => setHook(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Copy</Label>
            <Textarea rows={5} value={copy} onChange={(e) => setCopy(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>CTA</Label>
            <Input value={cta} onChange={(e) => setCta(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={pending || !titulo.trim()}>
              {pending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function BrandExamplesPanel({ clientId }: { clientId: string }) {
  const { data: examples, isLoading } = useBrandExamples(clientId);
  const invalidate = useInvalidateBrandMemory();
  const [adding, setAdding] = useState(false);

  async function handleDelete(id: string) {
    if (!confirm("¿Quitar este ejemplo del entrenamiento?")) return;
    const result = await deleteBrandExample(id, clientId);
    if (result?.error) toast.error(result.error);
    invalidate(clientId);
  }

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Publicaciones aprobadas que la IA usa como referencia de estilo (no las copia: aprende
          cómo escribe la marca). Se agregan desde el botón <span className="font-medium">Aprobar contenido</span> en
          cualquier publicación, o manualmente. Cuantos más ejemplos, más parecido escribe la IA.
        </p>
        <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
          <Plus className="size-3.5" /> Manual
        </Button>
      </div>

      {(examples ?? []).length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          Todavía no hay publicaciones aprobadas como ejemplo.
        </p>
      ) : (
        <div className="space-y-2">
          {(examples ?? []).map((e) => (
            <div key={e.id} className="flex items-start gap-3 rounded-md border border-border p-3">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{e.titulo}</p>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {CONTENT_KIND_LABELS[e.tipo_contenido] ?? e.tipo_contenido}
                  </span>
                </div>
                {e.hook && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">Hook: {e.hook}</p>}
                {e.copy && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{e.copy}</p>}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(e.id)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding && <AddExampleDialog clientId={clientId} open onOpenChange={(o) => !o && setAdding(o)} />}
    </div>
  );
}
