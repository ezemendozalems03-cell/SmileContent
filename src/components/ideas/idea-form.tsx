"use client";

import { useActionState, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTaxonomy } from "@/lib/queries/use-taxonomy";
import { useClientsList } from "@/lib/queries/use-clients";
import { queryKeys } from "@/lib/queries/keys";
import { CONTENT_KIND_LABELS, CONTENT_PRIORITY_LABELS } from "@/lib/constants/pipeline-status";
import { IDEA_STATUS_LABELS, IDEA_STATUS_ORDER } from "@/lib/constants/idea-status";
import type { IdeaWithRelations, Pillar, Subpillar } from "@/lib/types/domain";

const NONE = "__none__";
type ActionState = { error?: string; success?: boolean } | undefined;

function buildPillarsContext(clientName: string | undefined, pillars: Pillar[], subpillars: Subpillar[]) {
  const lines = [`Pilares de contenido${clientName ? ` — ${clientName}` : ""}:`, ""];
  pillars.forEach((pilar, i) => {
    lines.push(`${i + 1}. ${pilar.name}`);
    if (pilar.description) lines.push(`   ${pilar.description}`);
    const subs = subpillars.filter((sp) => sp.pillar_id === pilar.id).map((sp) => sp.name);
    if (subs.length > 0) lines.push(`   Subpilares: ${subs.join(", ")}`);
  });
  return lines.join("\n").trim();
}

export function IdeaForm({
  idea,
  action,
  onSaved,
}: {
  idea?: IdeaWithRelations;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  onSaved?: () => void;
}) {
  const queryClient = useQueryClient();
  const [state, formAction, pending] = useActionState(action, undefined);
  const [clientId, setClientId] = useState(idea?.client_id ?? NONE);
  const [pilarId, setPilarId] = useState(idea?.pilar_id ?? NONE);
  const [formatoId, setFormatoId] = useState(idea?.formato_id ?? NONE);

  const { data: clients } = useClientsList();
  const { data: taxonomy } = useTaxonomy(clientId === NONE ? undefined : clientId);

  const subpillarOptions = (taxonomy?.subpillars ?? []).filter((sp) => sp.pillar_id === pilarId);
  const subFormatOptions = (taxonomy?.subFormats ?? []).filter((sf) => sf.format_id === formatoId);

  async function handleCopyPillars() {
    const pillars = taxonomy?.pillars ?? [];
    if (pillars.length === 0) {
      toast.error(
        clientId === NONE
          ? "No hay pilares globales configurados. Elegí un cliente o creá pilares en Settings."
          : "Este cliente no tiene pilares configurados.",
      );
      return;
    }
    const clientName = clientId !== NONE ? clients?.find((c) => c.id === clientId)?.name : undefined;
    const text = buildPillarsContext(clientName, pillars, taxonomy?.subpillars ?? []);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Pilares copiados. Pegalos en tu IA para generar el guion.");
    } catch {
      toast.error("No se pudo copiar al portapapeles.");
    }
  }

  useEffect(() => {
    if (state?.success) {
      toast.success(idea ? "Idea actualizada" : "Idea creada");
      queryClient.invalidateQueries({ queryKey: queryKeys.ideas.all });
      onSaved?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex h-full flex-col">
      <Tabs defaultValue="detalles" className="flex-1 overflow-hidden">
        <TabsList className="mx-6 mt-3">
          <TabsTrigger value="detalles">Detalles</TabsTrigger>
          <TabsTrigger value="copy">Copy y guion</TabsTrigger>
          <TabsTrigger value="notas">Notas</TabsTrigger>
        </TabsList>

        <div className="h-full overflow-y-auto px-6 py-4">
          <TabsContent value="detalles" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" name="title" required defaultValue={idea?.title ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" name="description" rows={3} defaultValue={idea?.description ?? ""} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select
                  items={{ [NONE]: "Sin cliente", ...Object.fromEntries((clients ?? []).map((c) => [c.id, c.name])) }}
                  name="client_id"
                  value={clientId}
                  onValueChange={(v) => setClientId(v ?? NONE)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sin cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sin cliente</SelectItem>
                    {clients?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de contenido</Label>
                <Select
                  items={CONTENT_KIND_LABELS}
                  name="tipo_contenido"
                  defaultValue={idea?.tipo_contenido ?? "post"}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
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
              <div className="space-y-2">
                <Label>Pilar</Label>
                <Select
                  items={{ [NONE]: "Sin pilar", ...Object.fromEntries((taxonomy?.pillars ?? []).map((p) => [p.id, p.name])) }}
                  name="pilar_id"
                  value={pilarId}
                  onValueChange={(v) => setPilarId(v ?? NONE)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sin pilar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sin pilar</SelectItem>
                    {taxonomy?.pillars.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subpilar</Label>
                <Select
                  items={{ [NONE]: "Sin subpilar", ...Object.fromEntries(subpillarOptions.map((sp) => [sp.id, sp.name])) }}
                  name="subpilar_id"
                  defaultValue={idea?.subpilar_id ?? NONE}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sin subpilar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sin subpilar</SelectItem>
                    {subpillarOptions.map((sp) => (
                      <SelectItem key={sp.id} value={sp.id}>
                        {sp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Formato</Label>
                <Select
                  items={{ [NONE]: "Sin formato", ...Object.fromEntries((taxonomy?.formats ?? []).map((f) => [f.id, f.name])) }}
                  name="formato_id"
                  value={formatoId}
                  onValueChange={(v) => setFormatoId(v ?? NONE)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sin formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sin formato</SelectItem>
                    {taxonomy?.formats.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sub formato</Label>
                <Select
                  items={{ [NONE]: "Sin sub formato", ...Object.fromEntries(subFormatOptions.map((sf) => [sf.id, sf.name])) }}
                  name="sub_formato_id"
                  defaultValue={idea?.sub_formato_id ?? NONE}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sin sub formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sin sub formato</SelectItem>
                    {subFormatOptions.map((sf) => (
                      <SelectItem key={sf.id} value={sf.id}>
                        {sf.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select items={IDEA_STATUS_LABELS} name="status" defaultValue={idea?.status ?? "idea"}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IDEA_STATUS_ORDER.map((status) => (
                      <SelectItem key={status} value={status}>
                        {IDEA_STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select items={CONTENT_PRIORITY_LABELS} name="priority" defaultValue={idea?.priority ?? "media"}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONTENT_PRIORITY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_sugerida">Fecha sugerida</Label>
                <Input
                  id="fecha_sugerida"
                  name="fecha_sugerida"
                  type="date"
                  defaultValue={idea?.fecha_sugerida ?? ""}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="copy" className="space-y-4">
            <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border px-3 py-2">
              <p className="text-xs text-muted-foreground">
                Copiá los pilares del cliente y pegalos en tu IA para que el guion los respete.
              </p>
              <Button type="button" variant="outline" size="xs" onClick={handleCopyPillars}>
                <Copy className="size-3.5" />
                Copiar pilares
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hook">Gancho</Label>
              <Textarea id="hook" name="hook" rows={2} defaultValue={idea?.hook ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guion">Guion (pegá aquí el guion generado por IA)</Label>
              <Textarea id="guion" name="guion" rows={8} defaultValue={idea?.guion ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="copy">Copy tentativo</Label>
              <Textarea id="copy" name="copy" rows={4} defaultValue={idea?.copy ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cta">CTA</Label>
              <Input id="cta" name="cta" defaultValue={idea?.cta ?? ""} />
            </div>
          </TabsContent>

          <TabsContent value="notas" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="observaciones_internas">Notas internas</Label>
              <Textarea
                id="observaciones_internas"
                name="observaciones_internas"
                rows={4}
                defaultValue={idea?.observaciones_internas ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback_cliente">Comentarios del cliente</Label>
              <Textarea
                id="feedback_cliente"
                name="feedback_cliente"
                rows={4}
                defaultValue={idea?.feedback_cliente ?? ""}
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <div className="flex items-center gap-3 border-t border-border px-6 py-3">
        {state?.error ? (
          <Alert variant="destructive" className="flex-1 py-1.5">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}
        <Button type="submit" disabled={pending} className="ml-auto">
          {pending ? "Guardando…" : idea ? "Guardar cambios" : "Crear idea"}
        </Button>
      </div>
    </form>
  );
}
