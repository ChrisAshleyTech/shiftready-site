import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TooltipProvider } from "@/components/ui/tooltip";
import App from "./App";
import { restoreCompany } from "./company";
import "@/index.css";
import "@/lib/analytics";

// Load the company used last time before the first render, so its data is in place.
restoreCompany().finally(() => createRoot(document.getElementById("root")!).render(
  <StrictMode><TooltipProvider delayDuration={300}><App /></TooltipProvider></StrictMode>,
));
