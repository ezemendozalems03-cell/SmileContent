"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lightbulb, RefreshCw } from "lucide-react";
import { generateIdeasAi } from "@/lib/actions/ai-strategy";
import { queryKeys } from "@/lib/queries/keys";
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

export function GenerateIdeasDialog({
  clientId,
  open,
  onOpenChange,
}: {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [cantidad, setCantidad] = useState(6);
  const [enfoque, setEnfoque] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const result = await generateIdeasAi(clientId, cantidad, enfoque || null);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`${result.created} ideas agregadas al banco de ideas.`);
      queryClient.invalidateQueries({ queryKey: queryKeys.ideas.all });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="size-4 text-primary" />
            Generar ideas con IA
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Las ideas se crean en el banco de ideas, clasificadas por pilar, tipo, objetivo,
            dificultad y tiempo estimado, evitando repetir lo ya publicado.
          </p>
          <div className="space-y-2">
            <Label>Cantidad (1-15)</Label>
            <Input
              type="number"
              min={1}
              max={15}
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value) || 6)}
            />
          </div>
          <div className="space-y-2">
            <Label>Enfoque (opcional)</Label>
            <Textarea
              rows={2}
              value={enfoque}
              onChange={(e) => setEnfoque(e.target.value)}
              placeholder='Ej: "ideas para empujar el lanzamiento de la moto X"'
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? <RefreshCw className="size-4 animate-spin" /> : <Lightbulb className="size-4" />}
              {loading ? "Generando..." : "Generar ideas"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
