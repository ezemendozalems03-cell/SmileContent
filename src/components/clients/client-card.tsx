import Link from "next/link";
import { Building2, AtSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { CLIENT_STATUS_COLORS, CLIENT_STATUS_LABELS } from "@/lib/constants/pipeline-status";
import type { Client } from "@/lib/types/domain";

export function ClientCard({ client }: { client: Client }) {
  return (
    <Link href={`/clients/${client.id}`}>
      <Card className="h-full transition-colors hover:bg-accent/40">
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Building2 className="size-4.5" />
              </div>
              <div>
                <p className="font-medium leading-tight">{client.name}</p>
                {client.rubro ? (
                  <p className="text-xs text-muted-foreground">{client.rubro}</p>
                ) : null}
              </div>
            </div>
            <StatusBadge
              label={CLIENT_STATUS_LABELS[client.status]}
              colorClass={CLIENT_STATUS_COLORS[client.status]}
            />
          </div>
          {client.plan_contratado ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">{client.plan_contratado}</p>
          ) : null}
          {client.instagram_url ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AtSign className="size-3.5" />
              <span className="truncate">{client.instagram_url.replace(/^https?:\/\//, "")}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
