import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/shared/status-badge";
import { CONTENT_STATUS_LABELS, CONTENT_STATUS_COLORS } from "@/lib/constants/pipeline-status";
import { CommentThread } from "@/components/comments/comment-thread";
import { ClientFilesPanel } from "@/components/files/client-files-panel";
import { ApprovalActionBar } from "@/components/portal/approval-action-bar";

export default async function PortalContentDetailPage({
  params,
}: {
  params: Promise<{ contentId: string }>;
}) {
  const { contentId } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_portal_content_items", { p_content_item_id: contentId });
  const item = data?.[0];

  if (!item) notFound();

  const canDecide = item.status === "enviado_al_cliente" || item.status === "correcciones";

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{item.titulo}</h1>
          {item.descripcion ? <p className="mt-1 text-sm text-muted-foreground">{item.descripcion}</p> : null}
        </div>
        <StatusBadge label={CONTENT_STATUS_LABELS[item.status]} colorClass={CONTENT_STATUS_COLORS[item.status]} />
      </div>

      {item.copy ? (
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Copy</p>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.copy}</p>
        </div>
      ) : null}

      {item.link_publicacion_final ? (
        <a
          href={item.link_publicacion_final}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-sm text-primary underline underline-offset-4"
        >
          Ver publicación
        </a>
      ) : null}

      {item.feedback_cliente ? (
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Tu feedback anterior</p>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.feedback_cliente}</p>
        </div>
      ) : null}

      {canDecide ? <ApprovalActionBar parent={{ contentItemId: item.id }} /> : null}

      <div className="space-y-2">
        <p className="text-sm font-medium">Archivos</p>
        <ClientFilesPanel parent={{ contentItemId: item.id }} />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Comentarios</p>
        <CommentThread parent={{ contentItemId: item.id }} />
      </div>
    </div>
  );
}
