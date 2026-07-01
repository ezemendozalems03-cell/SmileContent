"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createComment } from "@/lib/actions/comments";

type Parent = { contentItemId: string } | { storyId: string };

export function CommentComposer({ parent, onSent }: { parent: Parent; onSent?: () => void }) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!body.trim() || sending) return;
    setSending(true);
    const result = await createComment(parent, body);
    setSending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setBody("");
    onSent?.();
  }

  return (
    <div className="space-y-2 border-t border-border pt-3">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Escribí un comentario…"
        rows={2}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSend();
          }
        }}
      />
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={handleSend} disabled={sending || !body.trim()}>
          {sending ? "Enviando…" : "Comentar"}
        </Button>
      </div>
    </div>
  );
}
