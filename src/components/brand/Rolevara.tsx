// Rolevara brand, from Christopher's logo artwork (brand-source/, built into public/brand/ by
// scripts/make-brand-assets.mjs): the door R mark, the Rolevara logo for the website, the RolevaraSim
// logo for the simulator, and the tagline. Each image has a dark-theme twin with the navy turned white.
import { cn } from "@/lib/utils";

export const BRAND = "Rolevara";
export const TAGLINE = "Experience the role. Master the work.";
export const NAVY = "#0B2B5F", TEAL = "#00ADA8", RIM = "#2A4A80";

// Light and dark copies of one image; only the one for the current theme is displayed (and so read
// by screen readers). Width follows the height through the image's own aspect ratio.
function Themed({ name, alt, className, w, h }: { name: string; alt: string; className?: string; w: number; h: number }) {
  const common = { alt, width: w, height: h, decoding: "async" as const };
  return (
    <>
      <img src={`/brand/${name}.png`} {...common} className={cn("w-auto dark:hidden", className)} />
      <img src={`/brand/${name}-dark.png`} {...common} className={cn("hidden w-auto dark:block", className)} />
    </>
  );
}

// The door R on its own.
export function Mark({ className, title = "" }: { className?: string; title?: string }) {
  return <Themed name="rolevara-mark" alt={title} w={149} h={144} className={className} />;
}

// The website logo (door R + Rolevara), or the simulator's (door R + RolevaraSim).
export function Logo({ className, sim = false }: { className?: string; sim?: boolean }) {
  return sim
    ? <Themed name="rolevarasim-logo" alt="RolevaraSim" w={802} h={144} className={className} />
    : <Themed name="rolevara-logo" alt={BRAND} w={675} h={144} className={className} />;
}

// Website logo with an optional tagline under it.
export function LogoHorizontal({ className, logoClass = "h-8", tagline = false, taglineClass }: { className?: string; logoClass?: string; tagline?: boolean; taglineClass?: string }) {
  return (
    <span className={cn("inline-flex flex-col items-start", className)}>
      <Logo className={cn("shrink-0", logoClass)} />
      {tagline && <span className={cn("mt-1 text-[11px] font-medium leading-tight text-muted-foreground [text-wrap:balance] sm:text-[12px]", taglineClass)}>{TAGLINE}</span>}
    </span>
  );
}
