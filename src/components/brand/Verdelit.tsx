// Verdelit brand: the mark (a glowing mint light in a charcoal rounded square), the wordmark
// (lowercase "verdelit", "lit" in a mint-to-cyan gradient), horizontal and stacked lockups,
// and the tagline. Brand colors are fixed and don't change with the theme.
import { useId } from "react";
import { cn } from "@/lib/utils";

export const BRAND = "Verdelit";
export const TAGLINE = "Prove you can do the job before day one.";
export const MINT = "#3DDC97", CYAN = "#1BA8E8", CHARCOAL = "#15201B", RIM = "#2E4038";

export function Mark({ className, title }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 32 32" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <defs>
        <radialGradient id={`${id}g`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={MINT} stopOpacity=".75" />
          <stop offset=".55" stopColor={MINT} stopOpacity=".18" />
          <stop offset="1" stopColor={MINT} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x=".75" y=".75" width="30.5" height="30.5" rx="7.5" fill={CHARCOAL} stroke={RIM} strokeWidth="1.5" />
      <circle cx="16" cy="16" r="12" fill={`url(#${id}g)`} />
      <circle cx="16" cy="16" r="5.2" fill={MINT} />
      <circle cx="14.6" cy="14.6" r="1.7" fill="#E9FFF5" opacity=".85" />
    </svg>
  );
}

// "verdel" follows the text color; "lit" carries the gradient. A logo is exempt from text
// contrast requirements (WCAG 1.4.3), and the accessible name is the plain word.
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display font-extrabold lowercase tracking-[-0.02em]", className)} aria-label={BRAND} role="img">
      <span aria-hidden>verde</span><span aria-hidden className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(90deg, ${MINT}, ${CYAN})` }}>lit</span>
    </span>
  );
}

// Horizontal lockup, with an optional tagline under the wordmark.
export function LogoHorizontal({ className, markClass = "size-8", wordClass = "text-xl", tagline = false, taglineClass }: { className?: string; markClass?: string; wordClass?: string; tagline?: boolean; taglineClass?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Mark className={cn("shrink-0", markClass)} />
      <span className="flex min-w-0 flex-col leading-none">
        <Wordmark className={wordClass} />
        {tagline && <span className={cn("mt-1 text-[11px] font-medium leading-tight text-muted-foreground [text-wrap:balance] sm:text-[12px]", taglineClass)}>{TAGLINE}</span>}
      </span>
    </span>
  );
}

export function LogoStacked({ className, markClass = "size-16", wordClass = "text-3xl", tagline = false }: { className?: string; markClass?: string; wordClass?: string; tagline?: boolean }) {
  return (
    <span className={cn("inline-flex flex-col items-center gap-2 text-center", className)}>
      <Mark className={markClass} />
      <Wordmark className={wordClass} />
      {tagline && <span className="text-sm font-medium text-muted-foreground">{TAGLINE}</span>}
    </span>
  );
}
