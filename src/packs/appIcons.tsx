// Original icons for the fictional companies' internal apps and groups: a tinted tile with a simple
// line glyph for the app's category. They show what kind of system a group grants, and never
// imitate a real product's logo, even where Pacific Crest uses real product names.
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AppIconKey =
  | "suite" | "chart" | "receipt" | "ledger" | "crm" | "truck" | "boxes" | "people" | "ticket"
  | "group" | "key" | "gear" | "app";

const G: Record<AppIconKey, ReactNode> = {
  // Office suite: a document with a folded corner.
  suite: <><path d="M7 4h7l4 4v12H7z" /><path d="M14 4v4h4" /><path d="M10 13h5M10 16h5" /></>,
  chart: <><path d="M5 19h14" /><path d="M8 16v-4M12 16V8M16 16v-6" /></>,
  receipt: <><path d="M7 4h10v16l-2.5-1.5L12 20l-2.5-1.5L7 20z" /><path d="M10 9h4M10 12h4" /></>,
  ledger: <><rect x="5" y="5" width="14" height="14" rx="1.5" /><path d="M5 10h14M10 10v9" /></>,
  crm: <><circle cx="10" cy="9" r="3" /><path d="M4.5 19c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5" /><path d="M16 7l3 0M16 10h3" /></>,
  truck: <><path d="M3.5 7h10v9h-10z" /><path d="M13.5 10h3.5l3 3v3h-6.5" /><circle cx="7.5" cy="17.5" r="1.5" /><circle cx="16.5" cy="17.5" r="1.5" /></>,
  boxes: <><rect x="4" y="12" width="7" height="7" /><rect x="13" y="12" width="7" height="7" /><rect x="8.5" y="5" width="7" height="7" /></>,
  people: <><circle cx="9" cy="9" r="2.5" /><circle cx="16" cy="10" r="2" /><path d="M4.5 18c.6-2.6 2.3-4 4.5-4s3.9 1.4 4.5 4M14 14.3c.6-.2 1.3-.3 2-.3 1.8 0 3.1 1.1 3.5 3.5" /></>,
  ticket: <><path d="M4 8h16v2.5a1.5 1.5 0 0 0 0 3V16H4v-2.5a1.5 1.5 0 0 0 0-3z" /><path d="M14 8v8" strokeDasharray="1.5 1.5" /></>,
  group: <><circle cx="8" cy="10" r="2" /><circle cx="16" cy="10" r="2" /><circle cx="12" cy="7" r="2" /><path d="M5 17c.5-2 1.6-3 3-3s2.5 1 3 3M13 17c.5-2 1.6-3 3-3s2.5 1 3 3" /></>,
  key: <><circle cx="8.5" cy="12" r="3.5" /><path d="M12 12h8M17 12v3M20 12v2" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M12 4v2.5M12 17.5V20M4 12h2.5M17.5 12H20M6.3 6.3l1.8 1.8M15.9 15.9l1.8 1.8M6.3 17.7l1.8-1.8M15.9 8.1l1.8-1.8" /></>,
  app: <><rect x="5" y="5" width="6" height="6" rx="1" /><rect x="13" y="5" width="6" height="6" rx="1" /><rect x="5" y="13" width="6" height="6" rx="1" /><rect x="13" y="13" width="6" height="6" rx="1" /></>,
};

// Tile colors reuse the site's hue tokens, so they follow light and dark themes.
const TINT: Record<AppIconKey, string> = {
  suite: "--hue-blue", chart: "--hue-sky", receipt: "--hue-amber", ledger: "--hue-green", crm: "--hue-pink",
  truck: "--hue-amber", boxes: "--hue-violet", people: "--hue-pink", ticket: "--hue-sky", group: "--hue-blue",
  key: "--hue-pink", gear: "--hue-violet", app: "--hue-blue",
};

export function AppIcon({ icon, className }: { icon: AppIconKey; className?: string }) {
  const c = `var(${TINT[icon]})`;
  return (
    <span aria-hidden className={cn("inline-grid size-6 shrink-0 place-items-center rounded-md", className)}
      style={{ background: `color-mix(in oklab, ${c} 16%, transparent)`, color: c }}>
      <svg viewBox="0 0 24 24" className="size-[70%]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{G[icon]}</svg>
    </span>
  );
}

// Longest matching prefix wins, e.g. "APP-SAP-AP-Entry" matches "APP-SAP" before "APP".
export const iconByPrefix = (map: Record<string, AppIconKey>) => (group: string): AppIconKey => {
  let best: AppIconKey = "app", len = 0;
  for (const [p, k] of Object.entries(map)) if (group.startsWith(p) && p.length > len) { best = k; len = p.length; }
  return best;
};
