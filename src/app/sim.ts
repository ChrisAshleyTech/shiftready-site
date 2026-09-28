// Bridge between the simulation engine (plain JS, unchanged from v1) and React.
// The engine mutates its live state `S`; after every engine call we `commit()`, which bumps a
// version number that components subscribe to with useSim().
import { useEffect, useState, useSyncExternalStore } from "react";
import { init, KEY } from "@/engine/state.js";

init();

let version = 0;
const listeners = new Set<() => void>();
export function commit() { version++; listeners.forEach(l => l()); }
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export function useSim() { return useSyncExternalStore(subscribe, () => version); }

// Another tab changed the saved state: reload it.
addEventListener("storage", e => { if (e.key === KEY) { init(); commit(); } });

// UI state that isn't part of the saved simulation (same fields as v1's ui.js).
export const ui = {
  view: "cur" as "cur" | "mon",
  qfilter: "open" as "open" | "closed" | "all",
  dirQ: "", dirDept: "All", dirStatus: "all",
  dirSort: { key: "name", dir: 1 },
  tutorOpen: null as boolean | null,
  hintConfirm: null as string | null,
  freeHints: {} as Record<string, number>,
  tutor: {} as Record<string, { who: "me" | "bot"; html: string }[]>,
  confirmReset: false,
  closeError: null as string | null,
};

// ---------- Hash router ----------
export type Route = { name: string; id: string | null; query: URLSearchParams };
export const ROUTES = ["home", "queue", "directory", "policy", "hr", "log", "results", "report", "grc"] as const;
function parse(): Route {
  const [path, q = ""] = location.hash.replace(/^#\/?/, "").split("?");
  const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
  const name = (ROUTES as readonly string[]).includes(parts[0]) ? parts[0] : "home";
  return { name, id: parts[1] || null, query: new URLSearchParams(q) };
}
export function useRoute() {
  const [r, setR] = useState(parse);
  useEffect(() => {
    const on = () => { ui.hintConfirm = null; ui.closeError = null; setR(parse()); };
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  return r;
}
export const go = (hash: string) => { if (location.hash !== hash) location.hash = hash; else commit(); };

// ---------- Formatting (from v1 ui.js) ----------
export const h = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
export const num = (n: number | null | undefined) => (n == null ? "–" : nf.format(n));
export const pct = (n: number | null | undefined) => (n == null ? "–" : n + "%");
export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
export const lastTxt = (n: number | null) => (n === null ? "Never" : n === 0 ? "Today" : n === 1 ? "Yesterday" : n + " days ago");

// Focus the element matching sel after React has painted.
export const focusSoon = (sel: string) => requestAnimationFrame(() => requestAnimationFrame(() => {
  const el = document.querySelector<HTMLElement>(sel);
  if (!el) return;
  if (!el.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true }); el.scrollIntoView({ block: "nearest" });
}));
