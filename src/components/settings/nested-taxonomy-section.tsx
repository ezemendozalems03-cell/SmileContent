"use client";

import { useActionState, useState } from "react";
import { Plus, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ActionState = { error?: string; success?: boolean } | undefined;
type Child = { id: string; name: string; badge?: string };
export type ParentItem = { id: string; name: string; children: Child[]; badge?: string };

function ChildRow({ child, onDelete }: { child: Child; onDelete: (id: string) => void }) {
  return (
    <div className="flex items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-accent/40">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {child.name}
        {child.badge ? <span className="text-[10px] text-muted-foreground/70">{child.badge}</span> : null}
      </span>
      <button
        type="button"
        onClick={() => onDelete(child.id)}
        className="text-muted-foreground/60 hover:text-destructive"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

function AddInlineForm({
  action,
  placeholder,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  placeholder: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="flex items-center gap-1.5 px-2 py-1">
      <Input name="name" placeholder={placeholder} className="h-7 text-sm" required />
      <Button type="submit" size="icon-sm" variant="ghost" disabled={pending}>
        <Plus className="size-3.5" />
      </Button>
      {state?.error ? <span className="text-xs text-destructive">{state.error}</span> : null}
    </form>
  );
}

function ParentRow({
  item,
  onDeleteParent,
  onDeleteChild,
  createChildAction,
  childLabel,
}: {
  item: ParentItem;
  onDeleteParent: (id: string) => void;
  onDeleteChild?: (id: string) => void;
  createChildAction?: (state: ActionState, formData: FormData) => Promise<ActionState>;
  childLabel?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = Boolean(createChildAction);

  return (
    <div className="rounded-md border border-border/60">
      <div className="flex items-center justify-between px-2 py-1.5">
        <button
          type="button"
          onClick={() => hasChildren && setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-medium"
        >
          {hasChildren ? (
            <ChevronRight className={cn("size-3.5 text-muted-foreground transition-transform", expanded && "rotate-90")} />
          ) : null}
          {item.name}
          {item.children.length > 0 ? (
            <span className="text-xs font-normal text-muted-foreground">({item.children.length})</span>
          ) : null}
          {item.badge ? (
            <span className="text-[10px] font-normal text-muted-foreground/70">{item.badge}</span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => onDeleteParent(item.id)}
          className="text-muted-foreground/60 hover:text-destructive"
        >
          <X className="size-3.5" />
        </button>
      </div>
      {hasChildren && expanded ? (
        <div className="space-y-0.5 border-t border-border/60 px-2 py-1.5">
          {item.children.map((child) => (
            <ChildRow key={child.id} child={child} onDelete={(id) => onDeleteChild?.(id)} />
          ))}
          {createChildAction ? (
            <AddInlineForm action={createChildAction} placeholder={`Nuevo ${childLabel?.toLowerCase() ?? "item"}…`} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function NestedTaxonomySection({
  title,
  description,
  globalItems,
  ownItems,
  createParentAction,
  onDeleteParent,
  onDeleteChild,
  getCreateChildAction,
  childLabel,
  addPlaceholder,
}: {
  title: string;
  description?: string;
  globalItems: ParentItem[];
  ownItems?: ParentItem[];
  createParentAction: (state: ActionState, formData: FormData) => Promise<ActionState>;
  onDeleteParent: (id: string) => void;
  onDeleteChild?: (id: string) => void;
  getCreateChildAction?: (parentId: string) => (state: ActionState, formData: FormData) => Promise<ActionState>;
  childLabel?: string;
  addPlaceholder: string;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>

      {ownItems !== undefined && globalItems.length > 0 ? (
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
            Predeterminados
          </p>
          <div className="flex flex-wrap gap-1.5">
            {globalItems.map((item) => (
              <span
                key={item.id}
                className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"
              >
                {item.name}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-1.5">
        {ownItems !== undefined ? (
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
            Propios de este cliente
          </p>
        ) : null}
        {(ownItems ?? globalItems).map((item) => (
          <ParentRow
            key={item.id}
            item={item}
            onDeleteParent={onDeleteParent}
            onDeleteChild={onDeleteChild}
            createChildAction={
              getCreateChildAction ? getCreateChildAction(item.id) : undefined
            }
            childLabel={childLabel}
          />
        ))}
        <AddInlineForm action={createParentAction} placeholder={addPlaceholder} />
      </div>
    </div>
  );
}
