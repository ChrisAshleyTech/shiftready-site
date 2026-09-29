// In-app readiness report: share controls around the shared ReportView.
import { useState } from "react";
import { Copy, ExternalLink, Printer } from "lucide-react";
import { toast } from "sonner";
import { buildReport, encodeReport } from "@/engine/report.js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReportView } from "@/report/ReportView";
import { company } from "../company";

const NAME_KEY = "shiftready-report-name";
const savedName = () => { try { return localStorage.getItem(NAME_KEY) || ""; } catch { return ""; } };
export const shareUrl = (d: any) => new URL("/report/#r=" + encodeReport(d), location.origin).href;

export default function Report() {
  const [name, setName] = useState(savedName);
  // The company id lets the shared report show the right logo. Older links without it are Pacific Crest.
  const d = { ...buildReport(name), c: company().id };
  const url = shareUrl(d);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); toast("Link copied."); }
    catch { const el = document.getElementById("rp-url") as HTMLInputElement; el.focus(); el.select(); toast("Couldn't copy automatically. The link is selected, so press Ctrl+C (or ⌘C)."); }
  };
  return (
    <div className="space-y-6">
      <Card className="gap-4 p-5 md:p-6 print:hidden">
        <div><h2 className="text-lg font-semibold">Share your report</h2>
          <p className="text-sm text-muted-foreground">The link contains your scores and the name you enter, nothing else. Anyone with the link can view it. It's a snapshot: if you keep working, copy a new one.</p></div>
        <div className="grid gap-4 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <div className="space-y-1.5"><Label htmlFor="rp-name">Name on the report <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Input id="rp-name" maxLength={60} autoComplete="name" value={name} onChange={e => { setName(e.target.value); try { localStorage.setItem(NAME_KEY, e.target.value); } catch { /* blocked */ } }} /></div>
          <div className="space-y-1.5"><Label htmlFor="rp-url">Share link</Label><Input id="rp-url" readOnly value={url} onFocus={e => e.target.select()} className="font-mono text-xs" /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={copy}><Copy />Copy link</Button>
          <Button asChild variant="outline"><a id="rp-open" href={url} target="_blank" rel="noopener">Open shareable view<ExternalLink /></a></Button>
          <Button variant="outline" onClick={() => print()}><Printer />Print or save as PDF</Button>
        </div>
      </Card>
      <ReportView d={d} own />
    </div>
  );
}
