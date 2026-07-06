"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import {
  createCampaign,
  deleteCampaign,
  toggleCampaign,
  updateCampaign,
} from "@/lib/actions/strategy";
import { useCampaigns, useInvalidateStrategy } from "@/lib/queries/use-strategy";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Campaign } from "@/lib/types/domain";

function CampaignDialog({
  clientId,
  campaign,
  open,
  onOpenChange,
}: {
  clientId: string;
  campaign: Campaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const invalidate = useInvalidateStrategy();
  const [name, setName] = useState(campaign?.name ?? "");
  const [description, setDescription] = useState(campaign?.description ?? "");
  const [startDate, setStartDate] = useState(campaign?.start_date ?? "");
  const [endDate, setEndDate] = useState(campaign?.end_date ?? "");
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const input = { name, description, start_date: startDate, end_date: endDate };
      const result = campaign
        ? await updateCampaign(campaign.id, clientId, input)
        : await createCampaign(clientId, input);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(campaign ? "Campaña actualizada." : "Campaña creada.");
      invalidate(clientId);
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{campaign ? "Editar campaña" : "Nueva campaña"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Lanzamiento, Black Friday, Navidad..."
            />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              rows={2}
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Qué se busca con esta campaña (la IA lo tiene en cuenta al planificar)."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Inicio</Label>
              <Input type="date" value={startDate ?? ""} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fin</Label>
              <Input type="date" value={endDate ?? ""} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={pending || !name.trim()}>
              {pending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CampaignsTab({ clientId }: { clientId: string }) {
  const { data: campaigns, isLoading } = useCampaigns(clientId);
  const invalidate = useInvalidateStrategy();
  const [dialog, setDialog] = useState<{ campaign: Campaign | null } | null>(null);

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Las campañas activas entran en el contexto del motor estratégico: los planes, ideas y el
          autocompletado del calendario las tienen en cuenta. Las publicaciones se asocian a una
          campaña desde su ficha.
        </p>
        <Button size="sm" onClick={() => setDialog({ campaign: null })}>
          <Plus className="size-3.5" /> Nueva campaña
        </Button>
      </div>

      {(campaigns ?? []).length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
          Sin campañas. Creá la primera (Lanzamiento, Black Friday, Navidad...).
        </p>
      ) : (
        <div className="space-y-2">
          {(campaigns ?? []).map((c) => (
            <div key={c.id} className="flex items-start gap-3 rounded-md border border-border p-3">
              <Megaphone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{c.name}</p>
                  {!c.is_active && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      Inactiva
                    </span>
                  )}
                  {(c.start_date || c.end_date) && (
                    <span className="text-xs text-muted-foreground">
                      {c.start_date ?? "?"} → {c.end_date ?? "?"}
                    </span>
                  )}
                </div>
                {c.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.description}</p>
                )}
              </div>
              <Switch
                size="sm"
                checked={c.is_active}
                onCheckedChange={async (val) => {
                  const result = await toggleCampaign(c.id, clientId, Boolean(val));
                  if (result?.error) toast.error(result.error);
                  invalidate(clientId);
                }}
              />
              <button
                type="button"
                onClick={() => setDialog({ campaign: c })}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!confirm(`¿Eliminar la campaña ${c.name}?`)) return;
                  const result = await deleteCampaign(c.id, clientId);
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
      )}

      {dialog && (
        <CampaignDialog
          key={dialog.campaign?.id ?? "new"}
          clientId={clientId}
          campaign={dialog.campaign}
          open
          onOpenChange={(o) => !o && setDialog(null)}
        />
      )}
    </div>
  );
}
