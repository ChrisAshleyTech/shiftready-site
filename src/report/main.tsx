// Public readiness report: decodes the report from the link's fragment (#r=...).
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Printer } from "lucide-react";
import { decodeReport } from "@/engine/report.js";
import { Button } from "@/components/ui/button";
import { Logo } from "@/app/components/Logo";
import { ReportView } from "./ReportView";
import "@/index.css";

const read = () => decodeReport(new URLSearchParams(location.hash.slice(1)).get("r") || "");

function Page() {
  const [d, setD] = useState(read);
  useEffect(() => { const on = () => setD(read()); addEventListener("hashchange", on); return () => removeEventListener("hashchange", on); }, []);
  useEffect(() => { document.title = (d && d.name ? d.name + " · " : "") + "Readiness report · ShiftReady"; }, [d]);
  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 md:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3 py-5 print:hidden">
        <a href="/" className="flex items-center gap-2.5 font-display text-lg font-semibold"><Logo className="size-7" />ShiftReady</a>
        <div className="flex gap-2"><Button variant="outline" onClick={() => print()}><Printer />Print or save as PDF</Button><Button asChild><a href="/app/">Try the simulator</a></Button></div>
      </header>
      <main>
        {d ? <ReportView d={d} /> : (
          <div className="rounded-2xl border border-dashed px-6 py-16 text-center">
            <h1 className="text-2xl font-semibold">This report link doesn't work</h1>
            <p className="mt-2 text-muted-foreground">It may have been cut off when it was copied. Ask for the link again, or <a className="text-primary underline" href="/app/">run the simulator yourself</a>.</p>
          </div>
        )}
      </main>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<StrictMode><Page /></StrictMode>);
