import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";

// Placeholder while the redesign is built step by step.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <main className="grid min-h-svh place-items-center p-6 text-center">
      <div><h1 className="text-3xl font-semibold">ShiftReady</h1><p className="text-muted-foreground mt-2">landing: being rebuilt.</p></div>
    </main>
  </StrictMode>,
);
