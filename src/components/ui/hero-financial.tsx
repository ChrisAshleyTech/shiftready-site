// Adapted from 21st "Financial Hero Section" (uilayout.contact/hero-financial, retrieved 2026-09-27).
// Kept: sticky header, announcement pill, staggered headline/copy/CTA reveal, and the framed
// product shot that reveals on scroll. Changed for ShiftReady: ops-console theme tokens instead
// of the light blue gradients, blur glows and stock background image; real links instead of
// placeholder buttons; shadcn Sheet for the mobile menu (replacing MotionDrawer); a real app
// screenshot in the frame.
import { useRef, type ReactNode } from "react";
import { ArrowRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TimelineAnimation } from "@/components/ui/hero-financial-utils/timeline-animation";

export interface HeroFinancialProps {
  logo: ReactNode;
  nav: { href: string; label: string }[];
  cta: { href: string; label: string };
  secondary: { href: string; label: string };
  pill: { tag: string; text: string };
  title: ReactNode;
  lead: ReactNode;
  proof?: ReactNode;
  image: { src: string; alt: string; width: number; height: number };
}

export function HeroFinancial({ logo, nav, cta, secondary, pill, title, lead, proof, image }: HeroFinancialProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  return (
    <section ref={timelineRef} className="relative flex flex-col items-center overflow-hidden">
      {/* Engineering-grid backdrop, faded out from the top. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[720px] bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:48px_48px] opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent)]" />

      <header className="sticky top-0 z-20 w-full border-b border-transparent bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <TimelineAnimation animationNum={0} timelineRef={timelineRef} className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          {logo}
          <nav aria-label="Main" className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            {nav.map(n => <a key={n.href} href={n.href} className="transition-colors hover:text-foreground">{n.label}</a>)}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild className="hidden sm:inline-flex"><a href={cta.href}>{cta.label}<ArrowRight /></a></Button>
            <Sheet>
              <SheetTrigger asChild><Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu"><Menu /></Button></SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader><SheetTitle className="text-left">{logo}</SheetTitle></SheetHeader>
                <nav aria-label="Main" className="flex flex-col gap-1 px-4">
                  {nav.map(n => <a key={n.href} href={n.href} className="rounded-md px-2 py-2.5 hover:bg-muted">{n.label}</a>)}
                  <Button asChild className="mt-4"><a href={cta.href}>{cta.label}</a></Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </TimelineAnimation>
      </header>

      <div className="relative z-10 flex max-w-5xl flex-col items-center gap-6 px-4 pb-14 pt-16 text-center md:pt-24">
        <TimelineAnimation animationNum={1} timelineRef={timelineRef}
          className="inline-flex w-fit items-center gap-2 rounded-full border bg-card py-1 pl-1 pr-3 text-sm">
          <span className="rounded-full bg-primary px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wider text-primary-foreground">{pill.tag}</span>
          <span className="text-muted-foreground">{pill.text}</span>
        </TimelineAnimation>
        <TimelineAnimation as="h1" animationNum={2} timelineRef={timelineRef}
          className="text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl md:text-7xl">{title}</TimelineAnimation>
        <TimelineAnimation as="p" animationNum={3} timelineRef={timelineRef}
          className="max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">{lead}</TimelineAnimation>
        <TimelineAnimation animationNum={4} timelineRef={timelineRef} className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="h-12 px-6 text-base"><a href={cta.href}>{cta.label}<ArrowRight /></a></Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base"><a href={secondary.href}>{secondary.label}</a></Button>
        </TimelineAnimation>
        {proof && <TimelineAnimation animationNum={5} timelineRef={timelineRef}>{proof}</TimelineAnimation>}
      </div>

      {/* Product frame */}
      <div className="relative z-10 w-full max-w-7xl px-4 md:px-6">
        <TimelineAnimation as="figure" animationNum={6} timelineRef={timelineRef} className="rounded-2xl border bg-card p-2 shadow-2xl shadow-black/40 md:p-3">
          <img src={image.src} alt={image.alt} width={image.width} height={image.height} className="w-full rounded-xl border" loading="eager" />
        </TimelineAnimation>
      </div>
    </section>
  );
}

export default HeroFinancial;
