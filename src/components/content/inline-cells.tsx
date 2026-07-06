"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { updateContentItemInline } from "@/lib/actions/content-items";
import { useTaxonomy } from "@/lib/queries/use-taxonomy";
import { queryKeys } from "@/lib/queries/keys";
import { tagColorClass } from "@/lib/constants/taxonomy-colors";
import {
  CONTENT_STATUS_ORDER,
  CONTENT_STATUS_LABELS,
  CONTENT_STATUS_COLORS,
  CONTENT_PRIORITY_LABELS,
  CONTENT_PRIORITY_COLORS,
} from "@/lib/constants/pipeline-status";
import type { ContentItemWithRelations } from "@/lib/types/domain";
import type { ContentPriority, ContentStatus } from "@/lib/types/database.types";

const NONE = "__none__";

type Option = { value: string; label: string; colorClass?: string };

/**
 * Celda editable estilo Notion: muestra la etiqueta de color y al hacer clic
 * abre un select. Guarda al elegir, con actualización optimista y rollback.
 */
function InlineSelectCell({
  value,
  options,
  allowNone,
  noneLabel = "Sin asignar",
  onSave,
}: {
  value: string | null;
  options: Option[];
  allowNone?: boolean;
  noneLabel?: string;
  onSave: (v: string | null) => Promise<boolean>;
}) {
  // Optimista: se muestra lo elegido al instante y se resincroniza cuando el
  // servidor confirma (patrón "adjust state during render", sin useEffect).
  const [local, setLocal] = useState<string | null>(value);
  const [synced, setSynced] = useState<string | null>(value);
  if (value !== synced) {
    setSynced(value);
    setLocal(value);
  }

  const items: Record<string, string> = {
    ...(allowNone ? { [NONE]: noneLabel } : {}),
    ...Object.fromEntries(options.map((o) => [o.value, o.label])),
  };
  const current = local ? options.find((o) => o.value === local) : null;

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Select
        items={items}
        value={local ?? (allowNone ? NONE : null)}
        onValueChange={(v) => {
          const next = v && v !== NONE ? String(v) : null;
          if (next === local) return;
          const prev = local;
          setLocal(next);
          onSave(next).then((ok) => {
            if (!ok) setLocal(prev);
          });
        }}
      >
        <SelectTrigger
          size="sm"
          className="h-7 gap-0.5 border-transparent bg-transparent px-1 hover:border-input dark:bg-transparent dark:hover:bg-input/40 [&_svg]:opacity-0 hover:[&_svg]:opacity-100"
        >
          {current ? (
            <StatusBadge
              label={current.label}
              colorClass={current.colorClass ?? tagColorClass(current.label)}
              className="text-[11px]"
            />
          ) : (
            <span className="px-1 text-xs text-muted-foreground/60">—</span>
          )}
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} align="start">
          {allowNone ? (
            <SelectItem value={NONE}>
              <span className="text-xs text-muted-foreground">{noneLabel}</span>
            </SelectItem>
          ) : null}
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              <StatusBadge
                label={o.label}
                colorClass={o.colorClass ?? tagColorClass(o.label)}
                className="text-[11px]"
              />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function useInlineSave(itemId: string) {
  const queryClient = useQueryClient();
  return async (patch: Parameters<typeof updateContentItemInline>[1]) => {
    const result = await updateContentItemInline(itemId, patch);
    if (result?.error) {
      toast.error(result.error);
      return false;
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.contentItems.all });
    return true;
  };
}

export function StatusCell({ item }: { item: ContentItemWithRelations }) {
  const save = useInlineSave(item.id);
  return (
    <InlineSelectCell
      value={item.status}
      options={CONTENT_STATUS_ORDER.map((s) => ({
        value: s,
        label: CONTENT_STATUS_LABELS[s],
        colorClass: CONTENT_STATUS_COLORS[s],
      }))}
      onSave={(v) => save({ status: v as ContentStatus })}
    />
  );
}

export function PriorityCell({ item }: { item: ContentItemWithRelations }) {
  const save = useInlineSave(item.id);
  return (
    <InlineSelectCell
      value={item.priority}
      options={(Object.keys(CONTENT_PRIORITY_LABELS) as ContentPriority[]).map((p) => ({
        value: p,
        label: CONTENT_PRIORITY_LABELS[p],
        colorClass: CONTENT_PRIORITY_COLORS[p],
      }))}
      onSave={(v) => save({ priority: v as ContentPriority })}
    />
  );
}

export function FormatoCell({ item }: { item: ContentItemWithRelations }) {
  const save = useInlineSave(item.id);
  const { data: taxonomy } = useTaxonomy(item.client_id);
  const options = (taxonomy?.formats ?? []).map((f) => ({ value: f.id, label: f.name }));
  // El formato actual puede venir de otro alcance (p. ej. global desactivado).
  if (item.formato && !options.some((o) => o.value === item.formato!.id)) {
    options.unshift({ value: item.formato.id, label: item.formato.name });
  }
  return (
    <InlineSelectCell
      value={item.formato_id}
      options={options}
      allowNone
      noneLabel="Sin formato"
      onSave={(v) => save({ formato_id: v })}
    />
  );
}

export function SubFormatoCell({ item }: { item: ContentItemWithRelations }) {
  const save = useInlineSave(item.id);
  const { data: taxonomy } = useTaxonomy(item.client_id);
  if (!item.formato_id) return <span className="px-1 text-xs text-muted-foreground/60">—</span>;
  const options = (taxonomy?.subFormats ?? [])
    .filter((sf) => sf.format_id === item.formato_id)
    .map((sf) => ({ value: sf.id, label: sf.name }));
  if (item.sub_formato && !options.some((o) => o.value === item.sub_formato!.id)) {
    options.unshift({ value: item.sub_formato.id, label: item.sub_formato.name });
  }
  return (
    <InlineSelectCell
      value={item.sub_formato_id}
      options={options}
      allowNone
      noneLabel="Sin sub-formato"
      onSave={(v) => save({ sub_formato_id: v })}
    />
  );
}

export function PilarCell({ item }: { item: ContentItemWithRelations }) {
  const save = useInlineSave(item.id);
  const { data: taxonomy } = useTaxonomy(item.client_id);
  const options = (taxonomy?.pillars ?? []).map((p) => ({ value: p.id, label: p.name }));
  if (item.pilar && !options.some((o) => o.value === item.pilar!.id)) {
    options.unshift({ value: item.pilar.id, label: item.pilar.name });
  }
  return (
    <InlineSelectCell
      value={item.pilar_id}
      options={options}
      allowNone
      noneLabel="Sin pilar"
      onSave={(v) => save({ pilar_id: v })}
    />
  );
}

export function SubpilarCell({ item }: { item: ContentItemWithRelations }) {
  const save = useInlineSave(item.id);
  const { data: taxonomy } = useTaxonomy(item.client_id);
  if (!item.pilar_id) return <span className="px-1 text-xs text-muted-foreground/60">—</span>;
  const options = (taxonomy?.subpillars ?? [])
    .filter((sp) => sp.pillar_id === item.pilar_id)
    .map((sp) => ({ value: sp.id, label: sp.name }));
  if (item.subpilar && !options.some((o) => o.value === item.subpilar!.id)) {
    options.unshift({ value: item.subpilar.id, label: item.subpilar.name });
  }
  return (
    <InlineSelectCell
      value={item.subpilar_id}
      options={options}
      allowNone
      noneLabel="Sin subpilar"
      onSave={(v) => save({ subpilar_id: v })}
    />
  );
}

/** "Tipo de contenido" del cliente (Educación, Viral, Venta…) — columna objetivo. */
export function ObjetivoCell({ item }: { item: ContentItemWithRelations }) {
  const save = useInlineSave(item.id);
  const { data: taxonomy } = useTaxonomy(item.client_id);
  const options = (taxonomy?.objectives ?? [])
    .filter((o) => o.is_active)
    .map((o) => ({ value: o.name, label: o.name }));
  // Valores históricos (texto libre) siguen visibles y seleccionables.
  const canonical = item.objetivo
    ? options.find((o) => o.value.toLowerCase() === item.objetivo!.toLowerCase())
    : null;
  if (item.objetivo && !canonical) {
    options.push({ value: item.objetivo, label: item.objetivo });
  }
  return (
    <InlineSelectCell
      value={canonical ? canonical.value : item.objetivo}
      options={options}
      allowNone
      noneLabel="Sin tipo"
      onSave={(v) => save({ objetivo: v })}
    />
  );
}
