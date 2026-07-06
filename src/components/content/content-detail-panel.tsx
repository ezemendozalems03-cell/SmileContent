"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles, Trash2 } from "lucide-react";
import { approveContentAsExample } from "@/lib/actions/brand-memory";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useContentItem } from "@/lib/queries/use-content-items";
import { useProfiles } from "@/lib/queries/use-profiles";
import { queryKeys } from "@/lib/queries/keys";
import {
  updateContentItemStatus,
  updateContentItemPriority,
  updateContentItemAssignee,
  deleteContentItem,
} from "@/lib/actions/content-items";
import { CONTENT_STATUS_LABELS, CONTENT_STATUS_ORDER, CONTENT_PRIORITY_LABELS } from "@/lib/constants/pipeline-status";
import { ContentDetailForm } from "@/components/content/content-detail-form";
import { useCurrentProfile } from "@/components/layout/current-profile-provider";
import { can } from "@/lib/auth/roles";
import type { ContentPriority, ContentStatus } from "@/lib/types/database.types";

const UNASSIGNED = "__unassigned__";

export function ContentDetailPanel({
  contentItemId,
  onClose,
}: {
  contentItemId: string;
  onClose?: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const profile = useCurrentProfile();
  const { data: item, isLoading, error } = useContentItem(contentItemId);
  const { data: profiles } = useProfiles();
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (error) toast.error("No se encontró la publicación.");
  }, [error]);

  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.contentItems.detail(contentItemId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.contentItems.all });
  }

  async function handleStatusChange(status: ContentStatus) {
    const result = await updateContentItemStatus(contentItemId, status);
    if (result?.error) toast.error(result.error);
    await invalidate();
  }

  async function handlePriorityChange(priority: ContentPriority) {
    const result = await updateContentItemPriority(contentItemId, priority);
    if (result?.error) toast.error(result.error);
    await invalidate();
  }

  async function handleAssigneeChange(assigneeId: string | null) {
    const result = await updateContentItemAssignee(
      contentItemId,
      !assigneeId || assigneeId === UNASSIGNED ? null : assigneeId,
    );
    if (result?.error) toast.error(result.error);
    await invalidate();
  }

  async function handleApproveAsExample() {
    const result = await approveContentAsExample(contentItemId);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Aprobado: la IA lo usará como referencia de estilo para esta marca.");
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar esta publicación? Esta acción no se puede deshacer.")) return;
    setDeleting(true);
    const result = await deleteContentItem(contentItemId);
    setDeleting(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Publicación eliminada");
    queryClient.invalidateQueries({ queryKey: queryKeys.contentItems.all });
    if (onClose) onClose();
    else router.push("/content");
  }

  if (isLoading || !item) {
    return (
      <div className="space-y-3 p-6">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-6 py-3">
        <Select
          items={CONTENT_STATUS_LABELS}
          value={item.status}
          onValueChange={(v) => handleStatusChange(v as ContentStatus)}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONTENT_STATUS_ORDER.map((status) => (
              <SelectItem key={status} value={status}>
                {CONTENT_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={CONTENT_PRIORITY_LABELS}
          value={item.priority}
          onValueChange={(v) => handlePriorityChange(v as ContentPriority)}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CONTENT_PRIORITY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={{ [UNASSIGNED]: "Sin responsable", ...Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name])) }}
          value={item.assignee_id ?? UNASSIGNED}
          onValueChange={handleAssigneeChange}
        >
          <SelectTrigger size="sm">
            <SelectValue placeholder="Sin responsable" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>Sin responsable</SelectItem>
            {profiles?.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {item.client ? (
          <span className="ml-auto text-xs text-muted-foreground">{item.client.name}</span>
        ) : null}

        <Button
          variant="outline"
          size="sm"
          onClick={handleApproveAsExample}
          className={item.client ? undefined : "ml-auto"}
          title="Guardar como ejemplo de estilo para la IA de esta marca"
        >
          <Sparkles className="size-3.5" />
          Aprobar contenido
        </Button>

        {can(profile?.role, "deleteContent") ? (
          <Button variant="ghost" size="icon-sm" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        ) : null}
      </div>

      <div className="flex-1 overflow-hidden">
        <ContentDetailForm key={item.id} item={item} />
      </div>
    </div>
  );
}
