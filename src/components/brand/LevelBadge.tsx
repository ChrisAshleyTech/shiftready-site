// Level badge: a vertical capsule of three lights, lit from the bottom.
// Beginner lights one, Intermediate two, Pro all three. scripts/make-brand-assets.mjs draws the
// same capsule for the shareable LinkedIn images (public/badges/).
import { useId } from "react";
import { cn } from "@/lib/utils";
import { CHARCOAL, MINT, RIM } from "./Verdelit";

export const LEVELS = ["beginner", "intermediate", "pro"] as const;
export type Level = (typeof LEVELS)[number];
export const LEVEL_LABEL: Record<Level, string> = { beginner: "Beginner", intermediate: "Intermediate", pro: "Pro" };
export const isLevel = (x: unknown): x is Level => LEVELS.includes(x as Level);
export const linkedInImage = (l: Level) => `/badges/verdelit-level-${l}.png`;

export function LevelCapsule({ level, className }: { level: Level; className?: string }) {
  const id = useId().replace(/:/g, "");
  const lit = LEVELS.indexOf(level) + 1;
  return (
    <svg viewBox="0 0 24 56" className={className} role="img" aria-label={`${LEVEL_LABEL[level]} level: ${lit} of 3 lights`}>
      <defs>
        <radialGradient id={`${id}g`}><stop offset="0" stopColor={MINT} stopOpacity=".7" /><stop offset="1" stopColor={MINT} stopOpacity="0" /></radialGradient>
      </defs>
      <rect x=".75" y=".75" width="22.5" height="54.5" rx="11.25" fill={CHARCOAL} stroke={RIM} strokeWidth="1.5" />
      {[44, 28, 12].map((cy, i) => i < lit ? (
        <g key={cy}><circle cx="12" cy={cy} r="8.5" fill={`url(#${id}g)`} /><circle cx="12" cy={cy} r="4.6" fill={MINT} /><circle cx="10.8" cy={cy - 1.2} r="1.4" fill="#E9FFF5" opacity=".85" /></g>
      ) : <circle key={cy} cx="12" cy={cy} r="4.6" fill={RIM} />)}
    </svg>
  );
}

// Capsule plus label, for the readiness report and profile.
export function LevelBadge({ level, className }: { level: Level; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <LevelCapsule level={level} className="h-14 w-6 shrink-0" />
      <span className="leading-tight">
        <span className="block text-xs font-semibold uppercase tracking-[0.12em] opacity-80">Level</span>
        <span className="block font-display text-xl font-extrabold">{LEVEL_LABEL[level]}</span>
      </span>
    </span>
  );
}
