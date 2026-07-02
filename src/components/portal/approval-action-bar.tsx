"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitApproval, submitStoryApproval } from "@/lib/actions/client-portal";

type Parent = { contentItemId: string } | { storyId: string };

export function ApprovalActionBar({ parent, title = "publicación" }: { parent: Parent; title?: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState<"approved" | "changes_requested" | null>(null);

  async function handleDecision(decision: "approved" | "changes_requested") {
    setPending(decision);
    const result =
      "contentItemId" in parent
        ? await submitApproval(parent.contentItemId, decision, notes)
        : await submitStoryApproval(parent.storyId, decision, notes);
    setPending(null);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(decision === "approved" ? `${title[0].toUpperCase()}${title.slice(1)} aprobada` : "Correcciones enviadas");
    router.refresh();
  }

  return (
    <div className="space-y-2 rounded-lg border border-border p-4">
      <p className="text-sm font-medium">¿Aprobás esta {title}?</p>
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notas o correcciones (opcional para aprobar, recomendado si pedís cambios)…"
        rows={3}
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleDecision("changes_requested")}
          disabled={pending !== null}
        >
          {pending === "changes_requested" ? "Enviando…" : "Pedir cambios"}
        </Button>
        <Button type="button" onClick={() => handleDecision("approved")} disabled={pending !== null}>
          {pending === "approved" ? "Aprobando…" : "Aprobar"}
        </Button>
      </div>
    </div>
  );
}
