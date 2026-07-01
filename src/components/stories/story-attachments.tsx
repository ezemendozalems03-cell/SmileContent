"use client";

import { Label } from "@/components/ui/label";
import { FileUploader } from "@/components/files/file-uploader";
import { FileList } from "@/components/files/file-list";
import { CommentThread } from "@/components/comments/comment-thread";
import { useFiles } from "@/lib/queries/use-files";
import type { StoryWithRelations } from "@/lib/types/domain";

export function StoryAttachments({ story }: { story: StoryWithRelations }) {
  const { data: files } = useFiles({ storyId: story.id });

  return (
    <div className="space-y-4 border-t border-border pt-4">
      <div className="space-y-2">
        <Label>Archivo</Label>
        <FileUploader clientId={story.client_id} parent={{ storyId: story.id }} kind="otro" />
        <FileList files={files ?? []} parent={{ storyId: story.id }} />
      </div>
      <div className="space-y-2">
        <Label>Comentarios</Label>
        <CommentThread parent={{ storyId: story.id }} />
      </div>
    </div>
  );
}
