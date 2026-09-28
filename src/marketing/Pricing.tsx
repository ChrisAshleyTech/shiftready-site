// Pricing section (display only): monthly/yearly toggle, three tiers and the add-on.
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Clock3, Gift, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/brand/motion";
import { ADDON, STATUS_LABEL, TIERS, chooseTier, perMonthYearly, yearlySaving, type Billing, type Tier, type WaitlistTier } from "./plans";

const usd = (n: number) => "$" + (Number.isInteger(n) ? n : n.toFixed(2));

function Price({ t, billing }: { t: Tier; billing: Billing }) {
  const reduce = useReducedMotion();
  const main = billing === "monthly" ? t.monthly : t.yearly;
  const key = `${t.id}-${billing}`;
  return (
    <div className="min-h-[5.5rem]">
      <div className="flex items-baseline gap-1">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={key} initial={reduce ? false : { y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduce ? undefined : { y: -16, opacity: 0 }}
            className="text-5xl font-extrabold tracking-tight">{usd(main)}</motion.span>
        </AnimatePresence>
        <span className="text-muted-foreground">{t.monthly === 0 ? "forever" : billing === "monthly" ? "/month" : "/year"}</span>
      </div>
      {t.monthly > 0 && billing === "yearly" && <p className="mt-1 text-sm text-muted-foreground">{usd(perMonthYearly(t))}/month billed yearly · <b className="text-ok">save {yearlySaving(t)}%</b></p>}
      {t.monthly > 0 && billing === "monthly" && <p className="mt-1 text-sm text-muted-foreground">or {usd(t.yearly)}/year (save {yearlySaving(t)}%)</p>}
    </div>
  );
}

function FeatureLine({ text, status }: { text: string; status: "live" | "soon" | "early" }) {
  return (
    <li className="flex gap-2.5 text-sm">
      {status === "soon" ? <Clock3 className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden /> : status === "early" ? <Gift className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden /> : <Check className="mt-0.5 size-4 shrink-0 text-ok" strokeWidth={3} aria-hidden />}
      <span>{text}{status !== "live" && <span className={cn("ml-2 inline-block rounded-md px-1.5 py-0.5 align-[1px] text-[11px] font-semibold", status === "soon" ? "bg-muted text-muted-foreground" : "bg-primary/12 text-primary-strong")}>{STATUS_LABEL[status]}</span>}</span>
    </li>
  );
}

export function Pricing({ headingLevel: H = "h2" }: { headingLevel?: "h1" | "h2" }) {
  const [billing, setBilling] = useState<Billing>("monthly");
  const tierFor = (t: Tier) => `${t.id}-${billing}` as WaitlistTier;
  return (
    <div className="space-y-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="font-bold uppercase tracking-[0.14em] text-primary text-sm">Pricing</p>
        <H id="pricing-h" className="text-4xl md:text-5xl">Start free. Go Pro when you're ready.</H>
        <p className="max-w-2xl text-lg text-muted-foreground">Paid plans aren't on sale yet. Join the waitlist for the plan you want and we'll email you once when it opens. No payment details needed.</p>
        <div role="radiogroup" aria-label="Billing period" className="inline-flex rounded-full border bg-card p-1 shadow-sm">
          {(["monthly", "yearly"] as const).map(b => (
            <button key={b} role="radio" aria-checked={billing === b} onClick={() => setBilling(b)}
              className={cn("rounded-full px-5 py-2 text-sm font-semibold text-muted-foreground transition-colors", billing === b && "bg-primary text-primary-foreground shadow")}>
              {b === "monthly" ? "Monthly" : <>Yearly <span className={cn("ml-1 rounded-full px-1.5 py-0.5 text-[11px]", billing === b ? "bg-white/20" : "bg-ok/12 text-ok")}>save up to 30%</span></>}
            </button>))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {TIERS.map((t, i) => (
          <Reveal key={t.id} delay={i * 0.08} className={cn("lift relative flex flex-col gap-6 rounded-3xl border bg-card p-7", t.badge && "border-2 border-primary shadow-xl shadow-primary/15")}>
            {t.badge && <span className="absolute -top-3.5 left-7 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow">{t.badge}</span>}
            <div><h3 className="text-2xl">{t.name}</h3><p className="mt-1 min-h-[3.25rem] text-muted-foreground">{t.blurb}</p></div>
            <Price t={t} billing={billing} />
            {t.id === "free"
              ? <Button asChild size="lg" variant="outline" className="h-12 border-2 border-primary text-base font-bold text-primary-strong hover:bg-primary/5"><a href="/app/">{t.cta}</a></Button>
              : <Button size="lg" className="h-12 text-base font-bold" onClick={() => chooseTier(tierFor(t))}>{t.cta}</Button>}
            <ul className="space-y-3">{t.features.map(f => <FeatureLine key={f.text} {...f} />)}</ul>
          </Reveal>
        ))}
      </div>

      <Reveal className="lift flex flex-col items-start gap-5 rounded-3xl border border-dashed bg-card p-7 md:flex-row md:items-center">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-hue-amber/15 text-warn"><Package className="size-7" aria-hidden /></span>
        <div className="flex-1">
          <h3 className="flex flex-wrap items-center gap-2 text-xl">Add-on: {ADDON.name} <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">Coming soon</span></h3>
          <p className="mt-1 text-muted-foreground">{ADDON.blurb}</p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <p><span className="text-3xl font-extrabold">${ADDON.price}</span> <span className="text-muted-foreground">one-time</span></p>
          <Button variant="outline" className="border-2 border-primary font-bold text-primary-strong hover:bg-primary/5" onClick={() => chooseTier("pack")}>{ADDON.cta}</Button>
        </div>
      </Reveal>
      <p className="text-center text-sm text-muted-foreground">Prices in USD. Display only: nothing is charged, and joining a waitlist doesn't commit you to buy.</p>
    </div>
  );
}
