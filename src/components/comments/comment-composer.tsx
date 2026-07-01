"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { createComment } from "@/lib/actions/comments";
import { useCurrentProfile } from "@/components/layout/current-profile-provider";

type Parent = { contentItemId: string } | { storyId: string };

export function CommentComposer({ parent, onSent }: { parent: Parent; onSent?: () => void }) {
  const profile = useCurrentProfile();
  const [body, setBody] = useState("");
  const [visibleToClient, setVisibleToClient] = useState(false);
  const [sending, setSending] = useState(false);
  const isClient = profile?.role === "client";

  async function handleSend() {
    if (!body.trim() || sending) return;
    setSending(true);
    const result = await createComment(parent, body, visibleToClient);
    setSending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setBody("");
    setVisibleToClient(false);
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
      <div className="flex items-center justify-between gap-2">
        {isClient ? (
          <span />
        ) : (
          <div className="group/field flex items-center gap-2">
            <Checkbox
              id="visible-to-client"
              checked={visibleToClient}
              onCheckedChange={(checked) => setVisibleToClient(checked === true)}
            />
            <Label htmlFor="visible-to-client" className="text-xs font-normal text-muted-foreground">
              Visible para el cliente
            </Label>
          </div>
        )}
        <Button type="button" size="sm" onClick={handleSend} disabled={sending || !body.trim()}>
          {sending ? "Enviando…" : "Comentar"}
        </Button>
      </div>
    </div>
  );
}
