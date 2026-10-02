// Opening section above the hero: the logo and tagline, the home-to-office film, then one clear
// "Start here". The current offers are shown on the sign-up screen the button leads to.
import { ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PauseButton } from "@/components/brand/motion";
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


        <a href="#hero-h" className="mt-8 inline-flex flex-col items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-white">
          See how it works<ChevronDown className="size-5" aria-hidden />
        </a>
      </div>
    </section>
  );
}
