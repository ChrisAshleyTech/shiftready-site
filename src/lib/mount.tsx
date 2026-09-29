// Mounts a page: hydrates the pre-rendered HTML when the build produced it, otherwise renders.
import { StrictMode, type ReactNode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";

export function mount(node: ReactNode) {
  const el = document.getElementById("root")!;
  const app = <StrictMode>{node}</StrictMode>;
  if (el.dataset.prerendered !== undefined) hydrateRoot(el, app);
  else createRoot(el).render(app);
}
