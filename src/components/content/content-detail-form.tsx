"use client";

import { useActionState, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { updateContentItem } from "@/lib/actions/content-items";
import { useTaxonomy } from "@/lib/queries/use-taxonomy";
import { queryKeys } from "@/lib/queries/keys";
import { CONTENT_KIND_LABELS } from "@/lib/constants/pipeline-status";
import { CommentThread } from "@/components/comments/comment-thread";
import { ContentFilesPanel } from "@/components/files/content-files-panel";
import type { ContentItemWithRelations } from "@/lib/types/domain";

const NONE = "__none__";

export function ContentDetailForm({ item }: { item: ContentItemWithRelations }) {
  const queryClient = useQueryClient();
  const boundAction = updateContentItem.bind(null, item.id);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  const { data: taxonomy } = useTaxonomy(item.client_id);
  const [formatoId, setFormatoId] = useState(item.formato_id ?? NONE);
  const [pilarId, setPilarId] = useState(item.pilar_id ?? NONE);

  useEffect(() => {
    if (state?.success) {
      toast.success("Cambios guardados");
      queryClient.invalidateQueries({ queryKey: queryKeys.contentItems.detail(item.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.contentItems.all });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const subFormatOptions = (taxonomy?.subFormats ?? []).filter((sf) => sf.format_id === formatoId);
  const subpillarOptions = (taxonomy?.subpillars ?? []).filter((sp) => sp.pillar_id === pilarId);

  return (
    <form action={formAction} className="flex h-full flex-col">
      <Tabs defaultValue="detalles" className="flex-1 overflow-hidden">
        <TabsList className="mx-6 mt-3">
          <TabsTrigger value="detalles">Detalles</TabsTrigger>
          <TabsTrigger value="contenido">Contenido</TabsTrigger>
          <TabsTrigger value="enlaces">Enlaces</TabsTrigger>
          <TabsTrigger value="metricas">Métricas</TabsTrigger>
          <TabsTrigger value="notas">Notas</TabsTrigger>
          <TabsTrigger value="archivos">Archivos</TabsTrigger>
          <TabsTrigger value="comentarios">Comentarios</TabsTrigger>
        </TabsList>

        <div className="h-full overflow-y-auto px-6 py-4">
          <TabsContent value="detalles" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input id="titulo" name="titulo" defaultValue={item.titulo} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea id="descripcion" name="descripcion" rows={2} defaultValue={item.descripcion ?? ""} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
                  defaultValue={item.sub_formato_id ?? NONE}
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
                  defaultValue={item.subpilar_id ?? NONE}
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
                <Label>Tipo de contenido</Label>
                <Select items={CONTENT_KIND_LABELS} name="tipo_contenido" defaultValue={item.tipo_contenido}>
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
                <Label htmlFor="objetivo">Objetivo</Label>
                <Input id="objetivo" name="objetivo" defaultValue={item.objetivo ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_publicacion">Fecha de publicación</Label>
                <Input
                  id="fecha_publicacion"
                  name="fecha_publicacion"
                  type="date"
                  defaultValue={item.fecha_publicacion ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hora_sugerida">Hora sugerida</Label>
                <Input
                  id="hora_sugerida"
                  name="hora_sugerida"
                  type="time"
                  defaultValue={item.hora_sugerida ?? ""}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contenido" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hook">Hook</Label>
              <Input id="hook" name="hook" defaultValue={item.hook ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guion">Guion</Label>
              <Textarea id="guion" name="guion" rows={4} defaultValue={item.guion ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="copy">Copy / pie de publicación</Label>
              <Textarea id="copy" name="copy" rows={4} defaultValue={item.copy ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cta">CTA</Label>
              <Input id="cta" name="cta" defaultValue={item.cta ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hashtags">Hashtags</Label>
              <Input
                id="hashtags"
                name="hashtags"
                defaultValue={item.hashtags?.join(" ") ?? ""}
                placeholder="#motos #showroom"
              />
            </div>
          </TabsContent>

          <TabsContent value="enlaces" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link_drive">Link de Drive</Label>
              <Input id="link_drive" name="link_drive" type="url" defaultValue={item.link_drive ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link_canva">Link de Canva</Label>
              <Input id="link_canva" name="link_canva" type="url" defaultValue={item.link_canva ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link_capcut">Link de CapCut</Label>
              <Input id="link_capcut" name="link_capcut" type="url" defaultValue={item.link_capcut ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link_publicacion_final">Link de publicación final</Label>
              <Input
                id="link_publicacion_final"
                name="link_publicacion_final"
                type="url"
                defaultValue={item.link_publicacion_final ?? ""}
              />
            </div>
          </TabsContent>

          <TabsContent value="metricas" className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Actualización manual por ahora — se automatiza en la Etapa 3.
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {(
                [
                  ["vistas", "Vistas"],
                  ["likes", "Likes"],
                  ["comentarios_count", "Comentarios"],
                  ["compartidos", "Compartidos"],
                  ["guardados", "Guardados"],
                  ["consultas_generadas", "Consultas"],
                ] as const
              ).map(([field, label]) => (
                <div key={field} className="space-y-2">
                  <Label htmlFor={field}>{label}</Label>
                  <Input id={field} name={field} type="number" min={0} defaultValue={item[field]} />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="notas" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="observaciones_internas">Observaciones internas</Label>
              <Textarea
                id="observaciones_internas"
                name="observaciones_internas"
                rows={4}
                defaultValue={item.observaciones_internas ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback_cliente">Feedback del cliente</Label>
              <Textarea
                id="feedback_cliente"
                disabled
                rows={4}
                value={item.feedback_cliente ?? ""}
                placeholder="El cliente todavía no dejó feedback desde el portal."
              />
            </div>
          </TabsContent>

          <TabsContent value="archivos">
            <ContentFilesPanel clientId={item.client_id} contentItemId={item.id} />
          </TabsContent>

          <TabsContent value="comentarios" className="h-full">
            <CommentThread parent={{ contentItemId: item.id }} />
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
          {pending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
