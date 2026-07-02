"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  bulkScheduleIdeas,
  type BulkSchedulePlaced,
  type BulkScheduleUnplaced,
} from "@/lib/actions/bulk-schedule";
import { queryKeys } from "@/lib/queries/keys";
import { CONTENT_KIND_LABELS } from "@/lib/constants/pipeline-status";
import type { ContentKind } from "@/lib/types/database.types";

const WEEKDAYS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

const KINDS: ContentKind[] = ["post", "reel", "story", "tiktok"];

export function BulkScheduleModal({
  open,
  onOpenChange,
  ideaIds,
  clientId,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ideaIds: string[];
  clientId: string | null;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [maxPerWeek, setMaxPerWeek] = useState<Record<string, string>>({});
  const [suggestedTime, setSuggestedTime] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ placed: BulkSchedulePlaced[]; unplaced: BulkScheduleUnplaced[] } | null>(
    null,
  );

  function toggleWeekday(day: number) {
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function reset() {
    setStartDate("");
    setEndDate("");
    setWeekdays([1, 2, 3, 4, 5]);
    setMaxPerWeek({});
    setSuggestedTime({});
    setResult(null);
  }

  async function handleSubmit() {
    if (!clientId) {
      toast.error("Filtrá por un cliente antes de calendarizar automáticamente.");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Completá la fecha de inicio y de fin.");
      return;
    }
    if (startDate > endDate) {
      toast.error("La fecha de inicio debe ser anterior o igual a la fecha de fin.");
      return;
    }
    if (weekdays.length === 0) {
      toast.error("Seleccioná al menos un día permitido.");
      return;
    }

    setSubmitting(true);
    const maxPerWeekByKind: Partial<Record<ContentKind, number>> = {};
    for (const kind of KINDS) {
      const raw = Number(maxPerWeek[kind]);
      if (maxPerWeek[kind] && Number.isFinite(raw) && raw >= 0) maxPerWeekByKind[kind] = raw;
    }
    const suggestedTimeByKind: Partial<Record<ContentKind, string>> = {};
    for (const kind of KINDS) {
      const raw = suggestedTime[kind];
      if (raw) suggestedTimeByKind[kind] = raw;
    }

    const response = await bulkScheduleIdeas({
      ideaIds,
      clientId,
      startDate,
      endDate,
      allowedWeekdays: weekdays,
      maxPerWeekByKind,
      suggestedTimeByKind,
    });
    setSubmitting(false);

    if ("error" in response) {
      toast.error(response.error);
      return;
    }

    setResult(response);
    queryClient.invalidateQueries({ queryKey: queryKeys.ideas.all });
    if (response.placed.length > 0) {
      toast.success(`${response.placed.length} idea${response.placed.length === 1 ? "" : "s"} calendarizada${response.placed.length === 1 ? "" : "s"}`);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar al calendario</DialogTitle>
          <DialogDescription>
            {ideaIds.length} idea{ideaIds.length === 1 ? "" : "s"} seleccionada{ideaIds.length === 1 ? "" : "s"}. El
            sistema busca fechas libres dentro del rango sin pisar publicaciones ya calendarizadas.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-3 text-sm">
            <p className="font-medium text-emerald-400">
              {result.placed.length} calendarizada{result.placed.length === 1 ? "" : "s"}
            </p>
            {result.unplaced.length > 0 ? (
              <div className="space-y-1">
                <p className="font-medium text-amber-400">
                  {result.unplaced.length} no se pudo{result.unplaced.length === 1 ? "" : "ron"} ubicar:
                </p>
                <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                  {result.unplaced.map((u) => (
                    <li key={u.ideaId}>
                      <span className="font-medium text-foreground">{u.title}</span> — {u.reason}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="bulk-start">Fecha de inicio</Label>
                <Input id="bulk-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bulk-end">Fecha de fin</Label>
                <Input id="bulk-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Días permitidos</Label>
              <div className="flex flex-wrap gap-3">
                {WEEKDAYS.map((day) => (
                  <div key={day.value} className="flex items-center gap-1.5">
                    <Checkbox
                      id={`weekday-${day.value}`}
                      checked={weekdays.includes(day.value)}
                      onCheckedChange={() => toggleWeekday(day.value)}
                    />
                    <Label htmlFor={`weekday-${day.value}`} className="text-xs font-normal">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Máximo por semana y horario sugerido (opcional, por tipo)</Label>
              <div className="space-y-2">
                {KINDS.map((kind) => (
                  <div key={kind} className="grid grid-cols-3 items-center gap-2">
                    <span className="text-xs text-muted-foreground">{CONTENT_KIND_LABELS[kind]}</span>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Sin límite"
                      className="h-8"
                      value={maxPerWeek[kind] ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw !== "" && Number(raw) < 0) return;
                        setMaxPerWeek((prev) => ({ ...prev, [kind]: raw }));
                      }}
                    />
                    <Input
                      type="time"
                      className="h-8"
                      value={suggestedTime[kind] ?? ""}
                      onChange={(e) => setSuggestedTime((prev) => ({ ...prev, [kind]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button
              onClick={() => {
                onOpenChange(false);
                onDone();
              }}
            >
              Listo
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Calendarizando…" : "Calendarizar"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
