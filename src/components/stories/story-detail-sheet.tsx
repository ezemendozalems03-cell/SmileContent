"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StoryForm } from "@/components/stories/story-form";
import { createStory, updateStory, deleteStory } from "@/lib/actions/stories";
import { queryKeys } from "@/lib/queries/keys";
import type { StoryWithRelations } from "@/lib/types/domain";

export function StoryDetailSheet({
  clientId,
  story,
  open,
  onOpenChange,
}: {
  clientId: string;
  /** undefined = create mode */
  story?: StoryWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const action = story ? updateStory.bind(null, story.id) : createStory.bind(null, clientId);

  async function handleDelete() {
    if (!story) return;
    if (!confirm("¿Eliminar esta historia?")) return;
    const result = await deleteStory(story.id);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Historia eliminada");
    queryClient.invalidateQueries({ queryKey: queryKeys.stories.all });
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="flex-row items-center justify-between border-b border-border">
          <SheetTitle>{story ? "Editar historia" : "Nueva historia"}</SheetTitle>
          {story ? (
            <Button variant="ghost" size="icon-sm" onClick={handleDelete}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          ) : null}
        </SheetHeader>
        <div className="flex-1 overflow-hidden">
          <StoryForm
            key={story?.id ?? "new"}
            clientId={clientId}
            story={story}
            action={action}
            onSaved={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
