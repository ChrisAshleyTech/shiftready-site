// Shared marketing chrome for the landing and pricing pages: header, footer, waitlist form.
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowRight, Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/app/components/Logo";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { FORM_ENDPOINT } from "./config";
import { WAITLIST_OPTIONS, getChosenTier, subscribeTier, type WaitlistTier } from "./plans";

export const Brand = () => <a href="/" className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight"><Logo className="size-8" />ShiftReady</a>;

const NAV = [{ href: "/#features", label: "Features" }, { href: "/#how", label: "How it works" }, { href: "/pricing/", label: "Pricing" }, { href: "/#faq", label: "FAQ" }];

export function SiteHeader({ current }: { current?: string }) { // current: nav key of this page
  const { theme, setTheme } = useTheme();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Brand />
        <nav aria-label="Main" className="hidden items-center gap-7 text-[15px] font-semibold text-muted-foreground md:flex">
          {NAV.map(n => <a key={n.href} href={n.href} aria-current={current === n.href ? "page" : undefined} className="transition-colors hover:text-primary aria-[current=page]:text-primary">{n.label}</a>)}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>
          <Button asChild className="hidden font-bold sm:inline-flex"><a href="/app/">Start free <ArrowRight /></a></Button>
          <Sheet>
            <SheetTrigger asChild><Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu"><Menu /></Button></SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader><SheetTitle className="text-left"><Brand /></SheetTitle></SheetHeader>
              <nav aria-label="Main" className="flex flex-col gap-1 px-4">
                {NAV.map(n => <a key={n.href} href={n.href} className="rounded-lg px-3 py-3 font-semibold hover:bg-muted">{n.label}</a>)}
                <Button asChild className="mt-4 font-bold"><a href="/app/">Start free</a></Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-10 text-sm text-muted-foreground md:px-6">
        <div className="space-y-2"><Brand /><p>© 2026 ShiftReady. All companies and people in ShiftReady scenarios are fictional.</p></div>
        <nav aria-label="Footer" className="flex flex-wrap gap-5 font-semibold">
          <a className="hover:text-primary" href="/app/">Open the app</a><a className="hover:text-primary" href="/pricing/">Pricing</a><a className="hover:text-primary" href="/#faq">FAQ</a><a className="hover:text-primary" href="/#waitlist">Waitlist</a>
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
