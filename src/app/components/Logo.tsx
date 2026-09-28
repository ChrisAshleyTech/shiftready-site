// ShiftReady mark: a queue of three tickets, the top one checked off.
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <rect x="8" y="8.5" width="16" height="3.5" rx="1.75" className="fill-primary-foreground" />
      <rect x="8" y="14.25" width="12" height="3.5" rx="1.75" className="fill-primary-foreground" opacity=".7" />
      <rect x="8" y="20" width="8" height="3.5" rx="1.75" className="fill-primary-foreground" opacity=".45" />
    </svg>
  );
}
