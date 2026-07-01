"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitApproval } from "@/lib/actions/client-portal";

export function ApprovalActionBar({ contentItemId }: { contentItemId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState<"approved" | "changes_requested" | null>(null);

  async function handleDecision(decision: "approved" | "changes_requested") {
    setPending(decision);
    const result = await submitApproval(contentItemId, decision, notes);
    setPending(null);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(decision === "approved" ? "Publicación aprobada" : "Correcciones enviadas");
    router.refresh();
  }

  return (
    <div className="space-y-2 rounded-lg border border-border p-4">
      <p className="text-sm font-medium">¿Aprobás esta publicación?</p>
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
