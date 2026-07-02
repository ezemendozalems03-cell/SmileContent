"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTaxonomy } from "@/lib/queries/use-taxonomy";
import { useProfiles } from "@/lib/queries/use-profiles";
import { useClientsList } from "@/lib/queries/use-clients";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { CONTENT_STATUS_LABELS, CONTENT_STATUS_ORDER } from "@/lib/constants/pipeline-status";

const ALL = "__all__";

export function ContentFiltersBar({ clientId }: { clientId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const debouncedSearch = useDebouncedValue(searchInput, 350);

  const { data: taxonomy } = useTaxonomy(clientId);
  const { data: profiles } = useProfiles();
  const { data: clients } = useClientsList();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== ALL) params.set(key, value);
      else params.delete(key);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  // Sync debounced search text into the URL.
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (debouncedSearch !== current) setParam("q", debouncedSearch || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const selectedClient = searchParams.get("client") ?? ALL;
  const selectedPilar = searchParams.get("pilar") ?? ALL;
  const selectedFormato = searchParams.get("formato") ?? ALL;
  const selectedEstado = searchParams.get("estado") ?? ALL;
  const selectedResponsable = searchParams.get("responsable") ?? ALL;

  const hasActiveFilters =
    selectedClient !== ALL ||
    selectedPilar !== ALL ||
    selectedFormato !== ALL ||
    selectedEstado !== ALL ||
    selectedResponsable !== ALL ||
    Boolean(searchInput);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-6 py-3">
      <div className="relative w-full max-w-56">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar contenido…"
          className="h-8 pl-8"
        />
      </div>

      {!clientId ? (
        <Select
          items={{ [ALL]: "Todos los clientes", ...Object.fromEntries((clients ?? []).map((c) => [c.id, c.name])) }}
          value={selectedClient}
          onValueChange={(v) => setParam("client", v)}
        >
          <SelectTrigger size="sm">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los clientes</SelectItem>
            {clients?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      <Select
        items={{ [ALL]: "Todos los pilares", ...Object.fromEntries((taxonomy?.pillars ?? []).map((p) => [p.id, p.name])) }}
        value={selectedPilar}
        onValueChange={(v) => setParam("pilar", v)}
      >
        <SelectTrigger size="sm">
          <SelectValue placeholder="Pilar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos los pilares</SelectItem>
          {taxonomy?.pillars.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={{ [ALL]: "Todos los formatos", ...Object.fromEntries((taxonomy?.formats ?? []).map((f) => [f.id, f.name])) }}
        value={selectedFormato}
        onValueChange={(v) => setParam("formato", v)}
      >
        <SelectTrigger size="sm">
          <SelectValue placeholder="Formato" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos los formatos</SelectItem>
          {taxonomy?.formats.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {f.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={{ [ALL]: "Todos los estados", ...CONTENT_STATUS_LABELS }}
        value={selectedEstado}
        onValueChange={(v) => setParam("estado", v)}
      >
        <SelectTrigger size="sm">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos los estados</SelectItem>
          {CONTENT_STATUS_ORDER.map((status) => (
            <SelectItem key={status} value={status}>
              {CONTENT_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={{ [ALL]: "Todos los responsables", ...Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name])) }}
        value={selectedResponsable}
        onValueChange={(v) => setParam("responsable", v)}
      >
        <SelectTrigger size="sm">
          <SelectValue placeholder="Responsable" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos los responsables</SelectItem>
          {profiles?.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearchInput("");
            const view = searchParams.get("view");
            router.replace(view ? `?view=${view}` : "?", { scroll: false });
          }}
        >
          <X className="size-3.5" />
          Limpiar
        </Button>
      ) : null}
    </div>
  );
}
