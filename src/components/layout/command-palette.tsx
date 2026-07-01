"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FileText, CircleDot, Building2 } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { createClient } from "@/lib/supabase/client";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

type SearchResult = {
  kind: "content_item" | "story" | "client";
  id: string;
  client_id: string | null;
  title: string;
  subtitle: string | null;
};

const KIND_ICON = { content_item: FileText, story: CircleDot, client: Building2 };
const KIND_LABEL = { content_item: "Publicación", story: "Historia", client: "Cliente" };

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 250);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    function onOpenRequest() {
      setOpen(true);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("open-command-palette", onOpenRequest);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("open-command-palette", onOpenRequest);
    };
  }, []);

  const { data: results, isFetching } = useQuery({
    queryKey: ["global-search", debouncedQuery],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("global_search", { q: debouncedQuery });
      if (error) throw error;
      return (data ?? []) as SearchResult[];
    },
    enabled: open && debouncedQuery.trim().length > 1,
  });

  function handleSelect(result: SearchResult) {
    setOpen(false);
    setQuery("");
    if (result.kind === "content_item") router.push(`/content/${result.id}`);
    else if (result.kind === "story" && result.client_id) router.push(`/clients/${result.client_id}/historias`);
    else if (result.kind === "client") router.push(`/clients/${result.id}`);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Buscar" description="Buscar en Content OS">
      <CommandInput placeholder="Buscar publicaciones, historias, clientes…" value={query} onValueChange={setQuery} />
      <CommandList>
        {debouncedQuery.trim().length <= 1 ? (
          <CommandEmpty>Escribí al menos 2 caracteres…</CommandEmpty>
        ) : isFetching ? (
          <CommandEmpty>Buscando…</CommandEmpty>
        ) : !results || results.length === 0 ? (
          <CommandEmpty>Sin resultados.</CommandEmpty>
        ) : (
          <CommandGroup>
            {results.map((result) => {
              const Icon = KIND_ICON[result.kind];
              return (
                <CommandItem
                  key={`${result.kind}-${result.id}`}
                  value={`${result.kind}-${result.id}`}
                  onSelect={() => handleSelect(result)}
                >
                  <Icon className="size-4" />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{result.title}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {KIND_LABEL[result.kind]}
                      {result.subtitle ? ` · ${result.subtitle}` : ""}
                    </span>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
