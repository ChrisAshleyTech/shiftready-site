// Shared marketing chrome for the landing and pricing pages: header, footer, waitlist form.
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MegaNav, Brand } from "./MegaNav";
import { DISCLAIMER } from "./legal";
import { cn } from "@/lib/utils";
import { FORM_ENDPOINT } from "./config";
import { WAITLIST_OPTIONS, getChosenTier, subscribeTier, type WaitlistTier } from "./plans";

export { Brand } from "./MegaNav";
export function SiteHeader({ current }: { current?: string }) { return <MegaNav current={current} />; }

export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 text-sm text-muted-foreground md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-2"><Brand /><p>© 2026 Rolevara. All companies and people in Rolevara scenarios are fictional.</p></div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 font-semibold">
            {[["/tracks/", "Tracks"], ["/industries/", "Industries"], ["/labs/", "Platform labs"], ["/pricing/", "Pricing"], ["/resources/", "Resources"], ["/guides/", "Guides"], ["/app/", "Open the app"], ["/privacy/", "Privacy"], ["/terms/", "Terms"]].map(([h, l]) =>
              <a key={h} className="hover:text-primary-strong hover:underline" href={h}>{l}</a>)}
          </nav>
        </div>
        <p data-disclaimer className="max-w-4xl border-t pt-4 text-[13px]">{DISCLAIMER}</p>
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
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  // Field-level email check: specific messages, shown next to the field (not only at submit).
  const check = (v: string) => !v.trim() ? "Enter an email address." : /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim()) ? null : "Enter an email address in the format name@example.com.";
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    const f = e.currentTarget, el = f.elements.namedItem("email") as HTMLInputElement, email = el.value.trim();
    const problem = check(email);
    setTouched(true); setEmailErr(problem);
    if (problem) { setMsg("Fix the error above to join the waitlist."); el.focus(); return; }
    // Honeypot (Formspree's _gotcha field): people never see or fill it, bots usually do.
    if ((f.elements.namedItem("_gotcha") as HTMLInputElement).value) { setMsg("Added to the waitlist. One notification per release."); f.reset(); return; }
    if (!FORM_ENDPOINT) { setMsg("Preview only: the waitlist connects once the form endpoint is set."); return; }
    setSending(true); setMsg("Joining…");
    try {
      const r = await fetch(FORM_ENDPOINT, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ email, tier: value, role: (f.elements.namedItem("role") as HTMLSelectElement).value, _gotcha: "" }) });
      if (!r.ok) throw new Error();
      setMsg("Added to the waitlist. One notification per release."); f.reset(); setTouched(false);
    } catch { setMsg("That didn't go through. Check the connection and try again."); }
    finally { setSending(false); }
  };
  const select = "h-12 w-full rounded-xl border border-input bg-background px-3 text-[15px]";
  return (
    <form onSubmit={submit} noValidate aria-busy={sending} className="relative space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-[15px]">Email <span className="font-normal text-muted-foreground">(required)</span></Label>
        <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" required maxLength={254}
          aria-invalid={emailErr ? true : undefined} aria-describedby={emailErr ? "email-error" : undefined}
          onBlur={e => { if (e.target.value) { setTouched(true); setEmailErr(check(e.target.value)); } }}
          onChange={e => { if (touched) setEmailErr(check(e.target.value)); }}
          className={cn("h-12 rounded-xl text-[15px]", emailErr && "border-bad focus-visible:outline-bad")} />
        {emailErr && <p id="email-error" className="text-sm font-semibold text-bad">{emailErr}</p>}
      </div>
      <div className="space-y-1.5"><Label htmlFor="tier" className="text-[15px]">Plan of interest</Label>
        <select id="tier" name="tier" value={value} onChange={e => setPicked(e.target.value as WaitlistTier)} className={select}>
          {WAITLIST_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select></div>
      <div className="space-y-1.5"><Label htmlFor="role" className="text-[15px]">Current role</Label>
        <select id="role" name="role" className={select}>
          {["Service desk or IT support", "IAM analyst or engineer", "Security operations", "GRC, audit or compliance", "Team lead or manager", "Training provider", "Moving into identity and access"].map(o => <option key={o}>{o}</option>)}
        </select></div>
      <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
        <label>Leave this field empty<input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <Button type="submit" size="lg" disabled={sending} className="h-12 w-full text-base font-bold">{sending ? "Joining…" : "Join the waitlist"}</Button>
      <p id="formmsg" role="status" className="min-h-6 text-sm text-muted-foreground">{msg}</p>
    </form>
  );
}
