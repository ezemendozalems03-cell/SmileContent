"use client";

import { usePathname, useRouter } from "next/navigation";
import { Building2, Check, ChevronsUpDown, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClientsList } from "@/lib/queries/use-clients";
import { useCurrentProfile } from "@/components/layout/current-profile-provider";
import { can } from "@/lib/auth/roles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Selector de cliente siempre visible en el sidebar: cambia de cliente sin
 * perder la pestaña en la que estás (si estás en Calendario de uno, vas al
 * Calendario del otro). Todo el sistema es multi-cliente; esto es el volante.
 */
export function ClientSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const profile = useCurrentProfile();
  const { data: clients } = useClientsList();

  // /clients/{id}/{segmento...} → cliente activo + pestaña actual.
  const match = pathname.match(/^\/clients\/([0-9a-f-]{36})(?:\/([^/]+))?/);
  const activeClientId = match?.[1] ?? null;
  const activeSegment = match?.[2] ?? null;
  const activeClient = clients?.find((c) => c.id === activeClientId) ?? null;

  function goToClient(clientId: string) {
    const segment = activeSegment ?? "resumen";
    router.push(`/clients/${clientId}/${segment}`);
  }

  return (
    <div className="px-3 pb-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex w-full items-center gap-2 rounded-md border border-sidebar-border px-2.5 py-2 text-left text-sm transition-colors",
            "hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          )}
        >
          {activeClient ? (
            <>
              <Avatar size="sm">
                <AvatarImage src={activeClient.logo_url ?? undefined} alt={activeClient.name} />
                <AvatarFallback className="text-[10px]">{initials(activeClient.name)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate font-medium">{activeClient.name}</span>
            </>
          ) : (
            <>
              <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Building2 className="size-3.5" />
              </div>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">Elegir cliente</span>
            </>
          )}
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Clientes</DropdownMenuLabel>
            {(clients ?? []).map((client) => (
              <DropdownMenuItem key={client.id} onClick={() => goToClient(client.id)}>
                <Avatar size="sm">
                  <AvatarImage src={client.logo_url ?? undefined} alt={client.name} />
                  <AvatarFallback className="text-[10px]">{initials(client.name)}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 truncate">{client.name}</span>
                {client.id === activeClientId ? <Check className="size-3.5 text-primary" /> : null}
              </DropdownMenuItem>
            ))}
            {clients && clients.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">Todavía no hay clientes.</div>
            ) : null}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/clients")}>
            <Users className="size-3.5" />
            Todos los clientes
          </DropdownMenuItem>
          {can(profile?.role, "manageClients") ? (
            <DropdownMenuItem onClick={() => router.push("/clients/new")}>
              <Plus className="size-3.5" />
              Nuevo cliente
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
