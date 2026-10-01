// Theme preference: light by default, dark opt-in. Stored per browser; applied before first paint
// by the inline script in each HTML entry.
import { useSyncExternalStore } from "react";

type Theme = "dark" | "light";
const KEY = "rolevara-theme";
const listeners = new Set<() => void>();
const read = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

export function setTheme(t: Theme) {
  if (t === "dark") document.documentElement.dataset.theme = "dark";
  else delete document.documentElement.dataset.theme;
  try { localStorage.setItem(KEY, t); } catch { /* storage may be blocked */ }
  listeners.forEach(l => l());
}
export function useTheme() {
  const theme = useSyncExternalStore(l => { listeners.add(l); return () => listeners.delete(l); }, read, () => "light" as Theme);
  return { theme, setTheme };
}
