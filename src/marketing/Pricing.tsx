// Pricing section (display only): monthly/yearly toggle, three tiers and the add-on.
import { useState } from "react";
import { Check, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/brand/motion";
import { EarlyAccess } from "@/components/brand/EarlyAccess";
import { ADDON, PRO_FOOTNOTE, TIERS, chooseTier, perMonthYearly, yearlySaving, type Billing, type Tier, type WaitlistTier } from "./plans";

const usd = (n: number) => "$" + (Number.isInteger(n) ? n : n.toFixed(2));

function Price({ t, billing }: { t: Tier; billing: Billing }) {
  const main = billing === "monthly" ? t.monthly : t.yearly;
  return (
    <div className="min-h-[5.5rem]">
      <div className="flex items-baseline gap-1">
        {/* Re-keyed on change so the CSS entrance animation replays (off under reduced motion). */}
        <span key={`${t.id}-${billing}`} className="price-in font-display text-5xl font-extrabold tracking-tight">{usd(main)}</span>
        <span className="text-muted-foreground">{t.monthly === 0 ? "forever" : billing === "monthly" ? "/month" : "/year"}</span>
      </div>
      {t.monthly > 0 && billing === "yearly" && <p className="t-meta mt-1">{usd(perMonthYearly(t))}/month billed yearly · <b className="text-ok">save {yearlySaving(t)}%</b></p>}
      {t.monthly > 0 && billing === "monthly" && <p className="t-meta mt-1">or {usd(t.yearly)}/year (save {yearlySaving(t)}%)</p>}
    </div>
  );
}

export function Pricing({ headingLevel: H = "h2" }: { headingLevel?: "h1" | "h2" }) {
  const [billing, setBilling] = useState<Billing>("monthly");
  return (
    <div className="space-y-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="t-eyebrow">Pricing</p>
        <H id="pricing-h" className={H === "h1" ? "t-display" : "t-h1"}>Start free. Upgrade for every company, track and lab.</H>
        <p className="t-lead max-w-2xl">Paid plans open from a waitlist. No payment details are collected.</p>
        <div role="radiogroup" aria-label="Billing period" className="inline-flex rounded-full border bg-card p-1 shadow-sm">
          {(["monthly", "yearly"] as const).map(b => (
            <button key={b} role="radio" aria-checked={billing === b} onClick={() => setBilling(b)}
              className={cn("rounded-full px-5 py-2 text-[15px] font-semibold text-muted-foreground transition-colors", billing === b && "bg-primary text-primary-foreground shadow")}>
              {b === "monthly" ? "Monthly" : <>Yearly <span className={cn("ml-1 rounded-full px-1.5 py-0.5 text-[12px]", billing === b ? "bg-white/20" : "bg-ok/12 text-ok")}>save up to 30%</span></>}
            </button>))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {TIERS.map((t, i) => (
          <Reveal key={t.id} delay={i * 0.08} className={cn("lift relative flex flex-col gap-6 rounded-3xl border bg-card p-7", t.badge && "border-2 border-primary shadow-xl shadow-primary/15")}>
            {t.badge && <span className="absolute -top-3.5 left-7 rounded-full bg-primary px-3 py-1 font-display text-xs font-bold text-primary-foreground shadow">{t.badge}</span>}
            <div><h3 className="t-h3">{t.name}</h3><p className="mt-1 min-h-[3.25rem] text-muted-foreground">{t.blurb}</p></div>
            <Price t={t} billing={billing} />
            {t.id === "free"
              ? <Button asChild size="lg" variant="outline" className="h-12 border-2 border-primary text-base font-bold text-primary-strong hover:bg-primary/5"><a href="/app/">{t.cta}</a></Button>
              : t.badge
                ? <Button size="lg" className="h-12 text-base font-bold" onClick={() => chooseTier(`${t.id}-${billing}` as WaitlistTier)}>{t.cta}</Button>
                // One primary per section: only the featured plan is filled; the others are outlined.
                : <Button size="lg" variant="outline" className="h-12 border-2 border-primary text-base font-bold text-primary-strong hover:bg-primary/5" onClick={() => chooseTier(`${t.id}-${billing}` as WaitlistTier)}>{t.cta}</Button>}
            <ul className="space-y-3">{t.features.map(f => (
              <li key={f.text} className="flex gap-2.5 text-[15px]">
                <Check className="mt-0.5 size-4 shrink-0 text-ok" strokeWidth={3} aria-hidden />
                <span>{f.text}{f.status === "early" && <> <EarlyAccess className="ml-1" /></>}</span>
              </li>))}</ul>
          </Reveal>
        ))}
      </div>

      <Reveal className="lift flex flex-col items-start gap-5 rounded-3xl border border-dashed bg-card p-7 md:flex-row md:items-center">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary-strong"><FlaskConical className="size-7" aria-hidden /></span>
        <div className="flex-1">
          <h3 className="t-h3 flex flex-wrap items-center gap-2">Add-on: {ADDON.name} <EarlyAccess /></h3>
          <p className="mt-1 text-muted-foreground">{ADDON.blurb}</p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <p><span className="font-display text-3xl font-extrabold">${ADDON.price}</span> <span className="text-muted-foreground">one-time</span></p>
          <Button variant="outline" className="border-2 border-primary font-bold text-primary-strong hover:bg-primary/5" onClick={() => chooseTier("pack")}>{ADDON.cta}</Button>
        </div>
      </Reveal>
      <div className="t-meta space-y-1 text-center">
        <p>{PRO_FOOTNOTE}</p>
        <p>Prices in USD. Display only: no charges are made, and joining a waitlist creates no obligation.</p>
      </div>
    </div>
  );
}
