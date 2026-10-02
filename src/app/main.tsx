import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { TooltipProvider } from "@/components/ui/tooltip";
import App from "./App";
import { restoreCompany } from "./company";
import { signedUp } from "./account";
import { SignUp } from "./components/SignUp";
import "@/index.css";
import "@/lib/analytics";

// The simulator opens after sign-up.
function Gate() {
  const [ok, setOk] = useState(signedUp);
  return ok ? <App /> : <SignUp onDone={() => setOk(true)} />;
}

// Load the company used last time before the first render, so its data is in place.
restoreCompany().finally(() => createRoot(document.getElementById("root")!).render(
  <StrictMode><TooltipProvider delayDuration={300}><Gate /></TooltipProvider></StrictMode>,
));
