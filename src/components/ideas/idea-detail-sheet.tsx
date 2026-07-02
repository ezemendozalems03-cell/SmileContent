"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { IdeaForm } from "@/components/ideas/idea-form";
import { createIdea, updateIdea, deleteIdea } from "@/lib/actions/ideas";
import { queryKeys } from "@/lib/queries/keys";
import type { IdeaWithRelations } from "@/lib/types/domain";

export function IdeaDetailSheet({
  idea,
  open,
  onOpenChange,
}: {
  /** undefined = create mode */
  idea?: IdeaWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const action = idea ? updateIdea.bind(null, idea.id) : createIdea;

  async function handleDelete() {
    if (!idea) return;
    if (!confirm("¿Eliminar esta idea?")) return;
    const result = await deleteIdea(idea.id);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Idea eliminada");
    queryClient.invalidateQueries({ queryKey: queryKeys.ideas.all });
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="flex-row items-center justify-between border-b border-border">
          <SheetTitle>{idea ? "Editar idea" : "Nueva idea"}</SheetTitle>
          {idea ? (
            <Button variant="ghost" size="icon-sm" onClick={handleDelete}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          ) : null}
        </SheetHeader>
        <div className="flex-1 overflow-hidden">
          <IdeaForm key={idea?.id ?? "new"} idea={idea} action={action} onSaved={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
