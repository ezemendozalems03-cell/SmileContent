import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/shared/status-badge";
import { STORY_STATUS_LABELS, STORY_STATUS_COLORS } from "@/lib/constants/pipeline-status";
import { CommentThread } from "@/components/comments/comment-thread";
import { ClientFilesPanel } from "@/components/files/client-files-panel";
import { ApprovalActionBar } from "@/components/portal/approval-action-bar";

export default async function PortalStoryDetailPage({
  params,
}: {
  params: Promise<{ storyId: string }>;
}) {
  const { storyId } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_portal_stories", { p_story_id: storyId });
  const item = data?.[0];

  if (!item) notFound();

  const canDecide = item.status === "lista";

  const { data: lastApproval } = await supabase
    .from("approvals")
    .select("notes")
    .eq("story_id", storyId)
    .order("resolved_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{item.nombre}</h1>
          {item.objetivo ? <p className="mt-1 text-sm text-muted-foreground">{item.objetivo}</p> : null}
        </div>
        <StatusBadge label={STORY_STATUS_LABELS[item.status]} colorClass={STORY_STATUS_COLORS[item.status]} />
      </div>

      {item.texto ? (
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Texto</p>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.texto}</p>
        </div>
      ) : null}

      {item.link ? (
        <a
          href={item.link}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-sm text-primary underline underline-offset-4"
        >
          Ver historia
        </a>
      ) : null}

      {lastApproval?.notes ? (
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Tu feedback anterior</p>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{lastApproval.notes}</p>
        </div>
      ) : null}

      {canDecide ? <ApprovalActionBar parent={{ storyId: item.id }} title="historia" /> : null}

      <div className="space-y-2">
        <p className="text-sm font-medium">Archivos</p>
        <ClientFilesPanel parent={{ storyId: item.id }} />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Comentarios</p>
        <CommentThread parent={{ storyId: item.id }} />
      </div>
    </div>
  );
}
