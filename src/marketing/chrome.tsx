// Shared marketing chrome for the landing and pricing pages: header, footer, waitlist form.
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MegaNav, Brand } from "./MegaNav";
import { cn } from "@/lib/utils";
import { FORM_ENDPOINT } from "./config";
import { WAITLIST_OPTIONS, getChosenTier, subscribeTier, type WaitlistTier } from "./plans";

export { Brand } from "./MegaNav";
export function SiteHeader({ current }: { current?: string }) { return <MegaNav current={current} />; }

export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-10 text-sm text-muted-foreground md:px-6">
        <div className="space-y-2"><Brand /><p>© 2026 ShiftReady. All companies and people in ShiftReady scenarios are fictional.</p></div>
        <nav aria-label="Footer" className="flex flex-wrap gap-5 font-semibold">
          <a className="hover:text-primary-strong" href="/tracks/">Tracks</a><a className="hover:text-primary-strong" href="/industries/">Industries</a><a className="hover:text-primary-strong" href="/labs/">Platform labs</a><a className="hover:text-primary-strong" href="/pricing/">Pricing</a><a className="hover:text-primary-strong" href="/resources/">Resources</a><a className="hover:text-primary-strong" href="/app/">Open the app</a>
        </nav>
      </div>
    </footer>
  );
}

export function Waitlist() {
  const tier = useSyncExternalStore(subscribeTier, getChosenTier, getChosenTier);
  const [picked, setPicked] = useState<WaitlistTier | null>(null);
  const [seen, setSeen] = useState(tier);
  if (seen !== tier) { setSeen(tier); setPicked(null); } // a pricing button picked a new tier
  const value = picked ?? tier;
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget, el = f.elements.namedItem("email") as HTMLInputElement, email = el.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setErr(true); setMsg("Enter a valid email address, like name@example.com."); el.focus(); return; }
    setErr(false);
    if (!FORM_ENDPOINT) { setMsg("Preview only: the waitlist connects once the form endpoint is set."); return; }
    setMsg("Joining…");
    try {
      const r = await fetch(FORM_ENDPOINT, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ email, tier: value, role: (f.elements.namedItem("role") as HTMLSelectElement).value }) });
      if (!r.ok) throw new Error();
      setMsg("Added to the waitlist. One notification per release."); f.reset();
    } catch { setMsg("That didn't go through. Check your connection and try again."); }
  };
  const select = "h-12 w-full rounded-xl border border-input bg-background px-3 text-[15px]";
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="space-y-1.5"><Label htmlFor="email" className="text-[15px]">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required aria-invalid={err || undefined} aria-describedby="formmsg" className="h-12 rounded-xl text-[15px]" /></div>
      <div className="space-y-1.5"><Label htmlFor="tier" className="text-[15px]">Plan of interest</Label>
        <select id="tier" name="tier" value={value} onChange={e => setPicked(e.target.value as WaitlistTier)} className={select}>
          {WAITLIST_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select></div>
      <div className="space-y-1.5"><Label htmlFor="role" className="text-[15px]">Current role</Label>
        <select id="role" name="role" className={select}>
          {["Service desk or IT support", "IAM analyst or engineer", "Security operations", "GRC, audit or compliance", "Team lead or manager", "Training provider", "Moving into identity and access"].map(o => <option key={o}>{o}</option>)}
        </select></div>
      <Button type="submit" size="lg" className="h-12 w-full text-base font-bold">Join the waitlist</Button>
      <p id="formmsg" role="status" className={cn("min-h-6 text-sm", err ? "text-bad" : "text-muted-foreground")}>{msg}</p>
    </form>
  );
}
