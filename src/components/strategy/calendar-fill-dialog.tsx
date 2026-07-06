"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarPlus, RefreshCw } from "lucide-react";
import { applyCalendarProposals, proposeCalendarFill } from "@/lib/actions/ai-strategy";
import type { CalendarProposal } from "@/lib/ai/strategy-schemas";
import { useInvalidateStrategy } from "@/lib/queries/use-strategy";
import { queryKeys } from "@/lib/queries/keys";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TIPO_LABELS: Record<string, string> = {
  post: "Post",
  reel: "Reel",
  story: "Historia",
  tiktok: "TikTok",
};

function formatFecha(fecha: string): string {
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

export function CalendarFillDialog({
  clientId,
  open,
  onOpenChange,
}: {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateStrategy();
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [propuestas, setPropuestas] = useState<CalendarProposal[] | null>(null);
  const [seleccionadas, setSeleccionadas] = useState<Set<number>>(new Set());

  async function handlePropose() {
    setLoading(true);
    try {
      const result = await proposeCalendarFill(clientId);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setPropuestas(result.propuestas);
      setSeleccionadas(new Set(result.propuestas.map((_, i) => i)));
    } finally {
      setLoading(false);
    }
  }

  function toggle(i: number) {
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function handleApply() {
    if (!propuestas) return;
    const elegidas = propuestas.filter((_, i) => seleccionadas.has(i));
    if (elegidas.length === 0) {
      toast.error("Seleccioná al menos una propuesta.");
      return;
    }
    setApplying(true);
    try {
      const result = await applyCalendarProposals({ clientId, propuestas: elegidas });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`${result.created} contenidos agendados en el calendario.`);
      queryClient.invalidateQueries({ queryKey: queryKeys.contentItems.all });
      invalidate(clientId);
      onOpenChange(false);
    } finally {
      setApplying(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !loading && !applying && onOpenChange(o)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="size-4 text-primary" />
            Completar calendario automáticamente
          </DialogTitle>
        </DialogHeader>

        {!propuestas ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              La IA revisa los próximos 14 días, detecta los huecos y propone contenido para
              llenarlos respetando la frecuencia configurada, las reglas estratégicas y el balance
              de pilares. Después elegís cuáles agendar.
            </p>
            <div className="flex justify-end">
              <Button onClick={handlePropose} disabled={loading}>
                {loading ? <RefreshCw className="size-4 animate-spin" /> : <CalendarPlus className="size-4" />}
                {loading ? "Analizando calendario..." : "Proponer contenido"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {propuestas.length} propuestas. Destildá las que no quieras y confirmá: se crean como
              publicaciones en etapa Idea con la fecha asignada.
            </p>
            <div className="space-y-2">
              {propuestas.map((p, i) => (
                <label
                  key={i}
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3"
                >
                  <Checkbox
                    checked={seleccionadas.has(i)}
                    onCheckedChange={() => toggle(i)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      <span className="capitalize">{formatFecha(p.fecha)}</span>
                      <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {TIPO_LABELS[p.tipo_contenido]}
                        {p.pilar ? ` · ${p.pilar}` : ""}
                      </span>
                    </p>
                    <p className="mt-0.5 text-sm">{p.titulo}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{p.razon}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={handlePropose} disabled={loading || applying}>
                <RefreshCw className={loading ? "size-3.5 animate-spin" : "size-3.5"} />
                Volver a proponer
              </Button>
              <Button onClick={handleApply} disabled={applying || seleccionadas.size === 0}>
                {applying ? "Agendando..." : `Agendar ${seleccionadas.size} contenidos`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
