"use client";

import { useActionState, useEffect } from "react";
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
import { useTaxonomy } from "@/lib/queries/use-taxonomy";
import { useProfiles } from "@/lib/queries/use-profiles";
import { queryKeys } from "@/lib/queries/keys";
import { STORY_STATUS_LABELS } from "@/lib/constants/pipeline-status";
import { StoryAttachments } from "@/components/stories/story-attachments";
import type { StoryWithRelations } from "@/lib/types/domain";

const NONE = "__none__";
type ActionState = { error?: string; success?: boolean; id?: string } | undefined;

export function StoryForm({
  clientId,
  story,
  action,
  onSaved,
}: {
  clientId: string;
  story?: StoryWithRelations;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  onSaved?: () => void;
}) {
  const queryClient = useQueryClient();
  const [state, formAction, pending] = useActionState(action, undefined);
  const { data: taxonomy } = useTaxonomy(clientId);
  const { data: profiles } = useProfiles();

  useEffect(() => {
    if (state?.success) {
      toast.success(story ? "Historia actualizada" : "Historia creada");
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.all });
      onSaved?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" name="nombre" required defaultValue={story?.nombre ?? ""} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha</Label>
            <Input id="fecha" name="fecha" type="date" required defaultValue={story?.fecha ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hora">Hora</Label>
            <Input id="hora" name="hora" type="time" defaultValue={story?.hora ?? ""} />
          </div>
          <div className="space-y-2">
            <Label>Tipo de historia</Label>
            <Select
              items={{ [NONE]: "Sin tipo", ...Object.fromEntries((taxonomy?.storyTypes ?? []).map((t) => [t.id, t.name])) }}
              name="story_type_id"
              defaultValue={story?.story_type_id ?? NONE}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sin tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sin tipo</SelectItem>
                {taxonomy?.storyTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select items={STORY_STATUS_LABELS} name="status" defaultValue={story?.status ?? "idea"}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STORY_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Responsable</Label>
            <Select
              items={{ [NONE]: "Sin responsable", ...Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name])) }}
              name="assignee_id"
              defaultValue={story?.assignee_id ?? NONE}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sin responsable" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sin responsable</SelectItem>
                {profiles?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="objetivo">Objetivo</Label>
          <Input id="objetivo" name="objetivo" defaultValue={story?.objetivo ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="texto">Texto</Label>
          <Textarea id="texto" name="texto" rows={3} defaultValue={story?.texto ?? ""} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sticker">Sticker</Label>
            <Input id="sticker" name="sticker" defaultValue={story?.sticker ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cta">CTA</Label>
            <Input id="cta" name="cta" defaultValue={story?.cta ?? ""} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="link">Link</Label>
          <Input id="link" name="link" defaultValue={story?.link ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="observacion">Observación</Label>
          <Textarea id="observacion" name="observacion" rows={2} defaultValue={story?.observacion ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="respuesta_esperada">Respuesta esperada</Label>
          <Textarea
            id="respuesta_esperada"
            name="respuesta_esperada"
            rows={2}
            defaultValue={story?.respuesta_esperada ?? ""}
          />
        </div>

        {story ? <StoryAttachments story={story} /> : null}
      </div>

      <div className="flex items-center gap-3 border-t border-border px-6 py-3">
        {state?.error ? (
          <Alert variant="destructive" className="flex-1 py-1.5">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}
        <Button type="submit" disabled={pending} className="ml-auto">
          {pending ? "Guardando…" : story ? "Guardar cambios" : "Crear historia"}
        </Button>
      </div>
    </form>
  );
}
