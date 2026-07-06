"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChipsInput } from "@/components/shared/chips-input";

export type BrandFieldDef = {
  key: string;
  label: string;
  type: "text" | "textarea" | "chips";
  placeholder?: string;
  /** true = ocupa las dos columnas de la grilla. */
  wide?: boolean;
  rows?: number;
};

type FieldValues = Record<string, string | string[]>;

function initialValues(fields: BrandFieldDef[], row: Record<string, unknown> | null): FieldValues {
  const values: FieldValues = {};
  for (const f of fields) {
    const raw = row?.[f.key];
    if (f.type === "chips") {
      values[f.key] = Array.isArray(raw) ? (raw as string[]) : [];
    } else {
      values[f.key] = typeof raw === "string" ? raw : "";
    }
  }
  return values;
}

/**
 * Formulario declarativo para las fichas 1:1 de la memoria de marca: recibe
 * la definición de campos, la fila cargada y la acción de guardado.
 */
export function BrandSectionForm({
  fields,
  row,
  description,
  onSave,
  onSaved,
}: {
  fields: BrandFieldDef[];
  row: Record<string, unknown> | null;
  description?: string;
  onSave: (values: FieldValues) => Promise<{ error?: string; success?: boolean }>;
  onSaved?: () => void;
}) {
  const [values, setValues] = useState<FieldValues>(() => initialValues(fields, row));
  const [pending, startTransition] = useTransition();

  function setValue(key: string, value: string | string[]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await onSave(values);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Memoria de marca actualizada.");
      onSaved?.();
    });
  }

  return (
    <div className="space-y-4">
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key} className={f.wide || f.type === "textarea" ? "space-y-2 sm:col-span-2" : "space-y-2"}>
            <Label htmlFor={`bm-${f.key}`}>{f.label}</Label>
            {f.type === "text" && (
              <Input
                id={`bm-${f.key}`}
                value={values[f.key] as string}
                placeholder={f.placeholder}
                onChange={(e) => setValue(f.key, e.target.value)}
              />
            )}
            {f.type === "textarea" && (
              <Textarea
                id={`bm-${f.key}`}
                rows={f.rows ?? 3}
                value={values[f.key] as string}
                placeholder={f.placeholder}
                onChange={(e) => setValue(f.key, e.target.value)}
              />
            )}
            {f.type === "chips" && (
              <ChipsInput
                id={`bm-${f.key}`}
                value={values[f.key] as string[]}
                placeholder={f.placeholder}
                onChange={(v) => setValue(f.key, v)}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={pending}>
          {pending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}
