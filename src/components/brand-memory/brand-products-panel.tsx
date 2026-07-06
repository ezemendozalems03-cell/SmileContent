"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Package, Wrench, Pencil, Trash2, Plus } from "lucide-react";
import {
  createBrandProduct,
  deleteBrandProduct,
  updateBrandProduct,
} from "@/lib/actions/brand-memory";
import { useBrandProducts, useInvalidateBrandMemory } from "@/lib/queries/use-brand-memory";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ChipsInput } from "@/components/shared/chips-input";
import { Skeleton } from "@/components/ui/skeleton";
import type { BrandProduct } from "@/lib/types/domain";
import type { BrandProductKind } from "@/lib/types/database.types";

type ProductDraft = {
  kind: BrandProductKind;
  nombre: string;
  descripcion: string;
  beneficios: string[];
  caracteristicas: string[];
  diferenciales: string[];
  precio: string;
  promociones: string;
  publico_objetivo: string;
  activo: boolean;
};

function emptyDraft(kind: BrandProductKind): ProductDraft {
  return {
    kind,
    nombre: "",
    descripcion: "",
    beneficios: [],
    caracteristicas: [],
    diferenciales: [],
    precio: "",
    promociones: "",
    publico_objetivo: "",
    activo: true,
  };
}

function draftFrom(p: BrandProduct): ProductDraft {
  return {
    kind: p.kind,
    nombre: p.nombre,
    descripcion: p.descripcion ?? "",
    beneficios: p.beneficios,
    caracteristicas: p.caracteristicas,
    diferenciales: p.diferenciales,
    precio: p.precio ?? "",
    promociones: p.promociones ?? "",
    publico_objetivo: p.publico_objetivo ?? "",
    activo: p.activo,
  };
}

function ProductDialog({
  clientId,
  open,
  onOpenChange,
  product,
  kind,
}: {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: BrandProduct | null;
  kind: BrandProductKind;
}) {
  const [draft, setDraft] = useState<ProductDraft>(() =>
    product ? draftFrom(product) : emptyDraft(kind),
  );
  const [pending, startTransition] = useTransition();
  const invalidate = useInvalidateBrandMemory();

  function set<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      const result = product
        ? await updateBrandProduct(product.id, clientId, draft)
        : await createBrandProduct(clientId, draft);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(product ? "Actualizado." : "Agregado.");
      invalidate(clientId);
      onOpenChange(false);
    });
  }

  const noun = draft.kind === "servicio" ? "servicio" : "producto";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {product ? `Editar ${noun}` : `Nuevo ${noun}`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input value={draft.nombre} onChange={(e) => set("nombre", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea rows={2} value={draft.descripcion} onChange={(e) => set("descripcion", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Beneficios</Label>
            <ChipsInput value={draft.beneficios} onChange={(v) => set("beneficios", v)} />
          </div>
          <div className="space-y-2">
            <Label>Características</Label>
            <ChipsInput value={draft.caracteristicas} onChange={(v) => set("caracteristicas", v)} />
          </div>
          <div className="space-y-2">
            <Label>Diferenciales</Label>
            <ChipsInput value={draft.diferenciales} onChange={(v) => set("diferenciales", v)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Precio</Label>
              <Input value={draft.precio} onChange={(e) => set("precio", e.target.value)} placeholder="Ej: USD 4.500 / desde $80.000" />
            </div>
            <div className="space-y-2">
              <Label>Promociones</Label>
              <Input value={draft.promociones} onChange={(e) => set("promociones", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Público objetivo</Label>
            <Input value={draft.publico_objetivo} onChange={(e) => set("publico_objetivo", e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={draft.activo} onCheckedChange={(v) => set("activo", Boolean(v))} />
            <Label>Activo (la IA solo usa los activos)</Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={pending || !draft.nombre.trim()}>
              {pending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProductRow({ product, clientId, onEdit }: { product: BrandProduct; clientId: string; onEdit: () => void }) {
  const invalidate = useInvalidateBrandMemory();

  async function handleDelete() {
    if (!confirm(`¿Eliminar ${product.nombre}?`)) return;
    const result = await deleteBrandProduct(product.id, clientId);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    invalidate(clientId);
  }

  const Icon = product.kind === "servicio" ? Wrench : Package;

  return (
    <div className="flex items-start gap-3 rounded-md border border-border p-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{product.nombre}</p>
          {!product.activo && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">Inactivo</span>
          )}
          {product.precio && <span className="text-xs text-muted-foreground">{product.precio}</span>}
        </div>
        {product.descripcion && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{product.descripcion}</p>
        )}
        {product.beneficios.length > 0 && (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            <span className="font-medium">Beneficios:</span> {product.beneficios.join(", ")}
          </p>
        )}
      </div>
      <button type="button" onClick={onEdit} className="shrink-0 text-muted-foreground hover:text-foreground">
        <Pencil className="size-3.5" />
      </button>
      <button type="button" onClick={handleDelete} className="shrink-0 text-muted-foreground hover:text-destructive">
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

export function BrandProductsPanel({ clientId }: { clientId: string }) {
  const { data: products, isLoading } = useBrandProducts(clientId);
  const [dialog, setDialog] = useState<{ product: BrandProduct | null; kind: BrandProductKind } | null>(null);

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  const grupos: { kind: BrandProductKind; titulo: string }[] = [
    { kind: "producto", titulo: "Productos" },
    { kind: "servicio", titulo: "Servicios" },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        La IA usa los productos y servicios activos para vender con datos reales: beneficios,
        diferenciales, precios y promociones. No inventa nada que no esté acá.
      </p>
      {grupos.map(({ kind, titulo }) => {
        const items = (products ?? []).filter((p) => p.kind === kind);
        return (
          <div key={kind} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{titulo}</p>
              <Button size="sm" variant="outline" onClick={() => setDialog({ product: null, kind })}>
                <Plus className="size-3.5" /> Agregar
              </Button>
            </div>
            {items.length === 0 ? (
              <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                Sin {titulo.toLowerCase()} cargados.
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((p) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    clientId={clientId}
                    onEdit={() => setDialog({ product: p, kind })}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
      {dialog && (
        <ProductDialog
          key={dialog.product?.id ?? `new-${dialog.kind}`}
          clientId={clientId}
          open
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          product={dialog.product}
          kind={dialog.kind}
        />
      )}
    </div>
  );
}
