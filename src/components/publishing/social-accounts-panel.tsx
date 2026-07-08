"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Link2, Loader2, Plus, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  assignSocialAccount,
  syncSocialAccounts,
  toggleSocialAccountActive,
} from "@/lib/actions/publishing";
import { useSocialAccounts, useInvalidatePublishing } from "@/lib/queries/use-publishing";
import { SOCIAL_PLATFORM_LABELS } from "@/lib/constants/pipeline-status";
import { tagColorClass } from "@/lib/constants/taxonomy-colors";

function formatDate(iso: string | null): string {
  if (!iso) return "Sin publicaciones";
  return `Última publicación: ${new Date(iso).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}`;
}

/**
 * Canales conectados de un cliente: cuentas sociales sincronizadas desde
 * Blotato. Las cuentas se conectan en Blotato (OAuth con cada red); acá se
 * sincronizan y se asigna cuál pertenece a este cliente.
 */
export function SocialAccountsPanel({ clientId }: { clientId: string }) {
  const { data: accounts, isLoading } = useSocialAccounts(clientId);
  const invalidate = useInvalidatePublishing();
  const [syncing, setSyncing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const own = (accounts ?? []).filter((a) => a.client_id === clientId);
  const unassigned = (accounts ?? []).filter((a) => a.client_id === null);

  async function handleSync() {
    setSyncing(true);
    try {
      const result = await syncSocialAccounts();
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.synced === 0
          ? "No hay cuentas conectadas en Blotato todavía."
          : `${result.synced} cuentas sincronizadas desde Blotato.`,
      );
      invalidate();
    } finally {
      setSyncing(false);
    }
  }

  async function handleAssign(accountId: string, assign: boolean) {
    setBusyId(accountId);
    try {
      const result = await assignSocialAccount(accountId, assign ? clientId : null);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      invalidate();
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleActive(accountId: string, isActive: boolean) {
    const result = await toggleSocialAccountActive(accountId, isActive);
    if (result?.error) toast.error(result.error);
    invalidate();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Las cuentas se conectan una sola vez en Blotato (my.blotato.com → Accounts). Después
          sincronizás acá y asignás las de este cliente.
        </p>
        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
          <RefreshCw className={syncing ? "size-3.5 animate-spin" : "size-3.5"} />
          Sincronizar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Cargando cuentas…
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {own.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Este cliente todavía no tiene canales asignados.
              </p>
            ) : (
              own.map((account) => (
                <div
                  key={account.id}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-border px-3 py-2"
                >
                  <StatusBadge
                    label={SOCIAL_PLATFORM_LABELS[account.platform] ?? account.platform}
                    colorClass={tagColorClass(account.platform)}
                    className="text-[10px]"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {account.account_name ?? account.username ?? account.account_id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {account.username ? `@${account.username.replace(/^@/, "")} · ` : ""}
                      {formatDate((account as { last_published_at?: string | null }).last_published_at ?? null)}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Switch
                        checked={account.is_active}
                        onCheckedChange={(v) => handleToggleActive(account.id, Boolean(v))}
                      />
                      {account.is_active ? "Activa" : "Inactiva"}
                    </label>
                    <Button
                      variant="ghost"
                      size="xs"
                      disabled={busyId === account.id}
                      onClick={() => handleAssign(account.id, false)}
                      title="Quitar de este cliente"
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {unassigned.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Cuentas conectadas en Blotato sin asignar
              </p>
              {unassigned.map((account) => (
                <div
                  key={account.id}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-border px-3 py-2"
                >
                  <StatusBadge
                    label={SOCIAL_PLATFORM_LABELS[account.platform] ?? account.platform}
                    colorClass={tagColorClass(account.platform)}
                    className="text-[10px]"
                  />
                  <span className="truncate text-sm">
                    {account.account_name ?? account.username ?? account.account_id}
                  </span>
                  <Button
                    variant="outline"
                    size="xs"
                    className="ml-auto"
                    disabled={busyId === account.id}
                    onClick={() => handleAssign(account.id, true)}
                  >
                    <Plus className="size-3" />
                    Asignar a este cliente
                  </Button>
                </div>
              ))}
            </div>
          ) : null}

          <a
            href="https://my.blotato.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Link2 className="size-3" />
            Conectar cuentas nuevas en Blotato
          </a>
        </>
      )}
    </div>
  );
}
