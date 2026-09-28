// Subtle badge for items in active development.
import { cn } from "@/lib/utils";

export function EarlyAccess({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex h-5 items-center whitespace-nowrap rounded-full border border-primary/30 px-2 align-middle font-display text-[11px] font-semibold tracking-wide text-primary-strong", className)}>
      Early access
    </span>
  );
}
