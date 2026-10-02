// Opening section above the hero: the logo and tagline, the home-to-office film, then one clear
// "Start here" and the current offers. Offers read from plans.ts, so they follow any price change.
import { ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PauseButton } from "@/components/brand/motion";
import { CANCEL_ANYTIME, PRICES, PRO_FOOTNOTE } from "@/marketing/plans";
import { IntroVideo } from "./IntroVideo";

export function Intro() {
  return (
    <section aria-label="Welcome to Rolevara" data-theme="dark" data-intro className="bg-brand-band relative overflow-hidden text-foreground">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/3 size-[640px] -translate-x-1/2 rounded-full bg-hue-teal/15 blur-3xl" />
      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 pb-12 pt-8 text-center md:px-6 md:pt-10">
        <img src="/brand/rolevara-logo-dark.png" alt="Rolevara" width={675} height={144} className="h-11 w-auto md:h-14" />
        <p className="mt-3 font-display text-lg font-semibold text-hue-teal md:text-xl">Experience the role. Master the work.</p>

        <div className="relative mt-6 w-full max-w-[880px]">
          <IntroVideo />
          <PauseButton className="absolute right-3 top-3" />
        </div>

        <Button asChild size="lg" className="mt-4 h-14 rounded-2xl px-10 text-lg font-bold shadow-lg shadow-primary/30">
          <a href="/app/" data-start-here>Start here <ArrowRight /></a>
        </Button>

        <ul className="mt-6 grid w-full max-w-3xl gap-3 text-left sm:grid-cols-3">
          <li className="rounded-2xl border border-hue-amber/50 bg-hue-amber/10 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-hue-amber">Free trial</p>
            <p className="mt-1 font-display font-semibold text-white">Try Pro free for {PRICES.pro.trialDays} days</p>
            <p className="mt-1 text-sm text-muted-foreground">Then ${PRICES.pro.monthly} a month. {CANCEL_ANYTIME}.</p>
          </li>
          <li className="rounded-2xl border border-hue-teal/50 bg-hue-teal/10 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-hue-teal">Early access</p>
            <p className="mt-1 font-display font-semibold text-white">Pro features, free for now</p>
            <p className="mt-1 text-sm text-muted-foreground">{PRO_FOOTNOTE}</p>
          </li>
          <li className="rounded-2xl border border-white/15 bg-white/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Free plan</p>
            <p className="mt-1 font-display font-semibold text-white">A full company to start</p>
            <p className="mt-1 text-sm text-muted-foreground">Pacific Crest Logistics on all three paths, at no cost.</p>
          </li>
        </ul>

        <a href="#hero-h" className="mt-8 inline-flex flex-col items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-white">
          See how it works<ChevronDown className="size-5" aria-hidden />
        </a>
      </div>
    </section>
  );
}
