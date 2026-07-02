"use client";

import { useActionState, useState } from "react";
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
import { CLIENT_STATUS_LABELS } from "@/lib/constants/pipeline-status";
import { slugify } from "@/lib/validation/client";
import type { Client } from "@/lib/types/domain";

type ActionState = { error?: string; success?: boolean } | undefined;

export function ClientForm({
  action,
  defaultValues,
  submitLabel = "Crear cliente",
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: Partial<Client>;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [slug, setSlug] = useState(defaultValues?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(defaultValues?.slug));

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            name="name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            placeholder="Smile Motors"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            placeholder="smile-motors"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rubro">Rubro</Label>
          <Input
            id="rubro"
            name="rubro"
            defaultValue={defaultValues?.rubro ?? ""}
            placeholder="Concesionaria de motos"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <Select items={CLIENT_STATUS_LABELS} name="status" defaultValue={defaultValues?.status ?? "activo"}>
            <SelectTrigger id="status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CLIENT_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="plan_contratado">Plan contratado</Label>
          <Input
            id="plan_contratado"
            name="plan_contratado"
            defaultValue={defaultValues?.plan_contratado ?? ""}
            placeholder="Gestión integral"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fecha_inicio">Fecha de inicio</Label>
          <Input
            id="fecha_inicio"
            name="fecha_inicio"
            type="date"
            defaultValue={defaultValues?.fecha_inicio ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="instagram_url">Instagram</Label>
          <Input
            id="instagram_url"
            name="instagram_url"
            type="url"
            defaultValue={defaultValues?.instagram_url ?? ""}
            placeholder="https://instagram.com/…"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tiktok_url">TikTok</Label>
          <Input
            id="tiktok_url"
            name="tiktok_url"
            type="url"
            defaultValue={defaultValues?.tiktok_url ?? ""}
            placeholder="https://tiktok.com/@…"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand_manual_url">Manual de marca (link)</Label>
          <Input
            id="brand_manual_url"
            name="brand_manual_url"
            type="url"
            defaultValue={defaultValues?.brand_manual_url ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand_typography">Tipografía de marca</Label>
          <Input
            id="brand_typography"
            name="brand_typography"
            defaultValue={defaultValues?.brand_typography ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observaciones</Label>
        <Textarea id="notes" name="notes" rows={3} defaultValue={defaultValues?.notes ?? ""} />
      </div>

      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state?.success ? (
        <Alert>
          <AlertDescription>Cambios guardados.</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : submitLabel}
      </Button>
    </form>
  );
}
