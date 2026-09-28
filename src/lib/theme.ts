// Theme preference: dark by default, light opt-in. Stored per browser; applied before first paint
// by the inline script in each HTML entry.
import { useSyncExternalStore } from "react";

type Theme = "dark" | "light";
const KEY = "shiftready-theme";
const listeners = new Set<() => void>();
const read = (): Theme => (document.documentElement.dataset.theme === "light" ? "light" : "dark");

export function setTheme(t: Theme) {
  if (t === "light") document.documentElement.dataset.theme = "light";
  else delete document.documentElement.dataset.theme;
  try { localStorage.setItem(KEY, t); } catch { /* storage may be blocked */ }
  listeners.forEach(l => l());
}
export function useTheme() {
  const theme = useSyncExternalStore(l => { listeners.add(l); return () => listeners.delete(l); }, read, () => "dark" as Theme);
  return { theme, setTheme };
}
