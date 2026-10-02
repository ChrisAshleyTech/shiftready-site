// Original icons for the fictional companies' internal apps and groups: a tinted tile with a simple
// line glyph for the app's category. They show what kind of system a group grants, and never
// imitate a real product's logo, even where Pacific Crest uses real product names.
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AppIconKey =
  | "suite" | "chart" | "receipt" | "ledger" | "crm" | "truck" | "boxes" | "people" | "ticket"
  | "group" | "key" | "gear" | "app"
  | "record" | "pill" | "scan" | "flask" | "calendar" | "claim" | "audit" | "alert"
  | "plane" | "gauge" | "lock" | "bank" | "vault" | "code" | "deploy" | "database" | "register" | "tag" | "cloud";

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
  // Clipboard with a pulse line: a patient record.
  record: <><rect x="6" y="5" width="12" height="15" rx="1.5" /><path d="M9.5 5V3.5h5V5" /><path d="M8.5 13h2l1.5-3 2 5 1.5-2h1" /></>,
  pill: <><rect x="4" y="9" width="16" height="6" rx="3" transform="rotate(-35 12 12)" /><path d="M10.3 9.6l3.4 4.8" /></>,
  scan: <><path d="M4 8V5h3M17 5h3v3M20 16v3h-3M7 19H4v-3" /><circle cx="12" cy="12" r="3.5" /></>,
  flask: <><path d="M10 4h4M10.5 4v5L6 18a1 1 0 0 0 .9 1.5h10.2A1 1 0 0 0 18 18l-4.5-9V4" /><path d="M8 14h8" /></>,
  calendar: <><rect x="4.5" y="6" width="15" height="13" rx="1.5" /><path d="M4.5 10h15M9 4v4M15 4v4" /></>,
  claim: <><path d="M7 4h7l4 4v12H7z" /><path d="M14 4v4h4" /><path d="M12.5 11h-2a1.25 1.25 0 0 0 0 2.5h1a1.25 1.25 0 0 1 0 2.5h-2M11.5 10v1M11.5 16v1" /></>,
  audit: <><path d="M6 4h9l3 3v6" /><path d="M6 4v16h6" /><circle cx="16" cy="16.5" r="2.5" /><path d="M18 18.5l2 2" /></>,
  alert: <><path d="M12 4.5L20 19H4z" /><path d="M12 10v4M12 16.5v.5" /></>,
  plane: <><path d="M3.5 13.5l7-1.5 3.5-7.5 1.5.5-1.5 7 5.5 1.5-.5 1.5-5.5-.5-2 5-1.5.5.5-5.5-6.5-.5z" /></>,
  gauge: <><path d="M4.5 16a7.5 7.5 0 1 1 15 0" /><path d="M12 16l3.5-4.5" /><path d="M4.5 16h15" /></>,
  lock: <><rect x="5.5" y="10.5" width="13" height="9" rx="1.5" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5M12 14v2" /></>,
  bank: <><path d="M4 9.5L12 5l8 4.5z" /><path d="M6 10.5v6M10 10.5v6M14 10.5v6M18 10.5v6M4 19h16" /></>,
  vault: <><rect x="4.5" y="5" width="15" height="14" rx="1.5" /><circle cx="12" cy="12" r="3" /><path d="M12 9v-1M12 16v-1M9 12H8M16 12h-1" /></>,
  code: <><path d="M9 8l-4 4 4 4M15 8l4 4-4 4M13 6l-2 12" /></>,
  deploy: <><path d="M12 19V8M8 11.5L12 7.5l4 4" /><path d="M5 19h14" /></>,
  database: <><ellipse cx="12" cy="6.5" rx="6.5" ry="2.5" /><path d="M5.5 6.5v11c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-11M5.5 12c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5" /></>,
  register: <><rect x="5" y="11" width="14" height="8" rx="1" /><path d="M8 11V6h8v5M10 8.5h4M8 15h2M12 15h4" /></>,
  tag: <><path d="M4.5 12.5V5h7.5l7.5 7.5-7.5 7.5z" /><circle cx="8.5" cy="9" r="1" /></>,
  cloud: <><path d="M7.5 18a3.5 3.5 0 0 1-.5-7 5 5 0 0 1 9.6-1.3A3.8 3.8 0 0 1 17 18z" /></>,
};

// Tile colors reuse the site's hue tokens, so they follow light and dark themes.
const TINT: Record<AppIconKey, string> = {
  suite: "--hue-blue", chart: "--hue-sky", receipt: "--hue-amber", ledger: "--hue-green", crm: "--hue-pink",
  truck: "--hue-amber", boxes: "--hue-violet", people: "--hue-pink", ticket: "--hue-sky", group: "--hue-blue",
  key: "--hue-pink", gear: "--hue-violet", app: "--hue-blue",
  record: "--hue-green", pill: "--hue-pink", scan: "--hue-violet", flask: "--hue-sky", calendar: "--hue-amber", claim: "--hue-green",
  audit: "--hue-violet", alert: "--hue-pink", plane: "--hue-sky", gauge: "--hue-amber", lock: "--hue-violet", bank: "--hue-blue",
  vault: "--hue-amber", code: "--hue-violet", deploy: "--hue-green", database: "--hue-sky", register: "--hue-green", tag: "--hue-amber", cloud: "--hue-sky",
};

// "On the job" notes: the real products a generic app usually is in that industry. Text only.
export const noteByPrefix = (map: Record<string, string>) => (group: string): string | undefined => {
  let best: string | undefined, len = 0;
  for (const [p, n] of Object.entries(map)) if (group.startsWith(p) && p.length > len) { best = n; len = p.length; }
  return best;
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
