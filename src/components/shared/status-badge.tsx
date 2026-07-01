import { cn } from "@/lib/utils";

export function StatusBadge({ label, colorClass, className }: { label: string; colorClass: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium",
        colorClass,
        className,
      )}
    >
      {label}
    </span>
  );
}
