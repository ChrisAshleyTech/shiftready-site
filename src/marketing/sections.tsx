// Shared marketing sections: credited photo, waitlist band.
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Waitlist, SiteHeader, SiteFooter } from "./chrome";

export function Photo({ name, alt, credit, profile, className, sizes = "(min-width: 1024px) 50vw, 100vw" }: { name: string; alt: string; credit: string; profile: string; className?: string; sizes?: string }) {
  return (
    <figure className={cn("relative overflow-hidden rounded-3xl", className)}>
      <img src={`/img/photos/${name}-1600.webp`} srcSet={`/img/photos/${name}-800.webp 800w, /img/photos/${name}-1600.webp 1600w`} sizes={sizes}
        alt={alt} loading="lazy" decoding="async" className="size-full object-cover" />
      <figcaption className="absolute bottom-3 right-3 rounded-full bg-black/70 px-2.5 py-1 text-[12px] text-white">
        Photo: <a className="underline" href={profile} target="_blank" rel="noopener">{credit}</a> / Unsplash
      </figcaption>
    </figure>
  );
}

export function WaitlistBand({ children }: { children?: ReactNode }) {
  return (
    <section id="waitlist" aria-labelledby="wl-h" className="scroll-mt-24 px-4 pb-24 md:px-6">
      <div data-theme="dark" className="relative mx-auto grid max-w-6xl gap-10 overflow-hidden rounded-3xl bg-brand-band p-8 text-white md:grid-cols-2 md:p-14">
        <div className="space-y-4">
          <p className="t-eyebrow">Early access</p>
          <h2 id="wl-h" className="t-h1">Be first to try new companies and labs.</h2>
          <p className="text-lg text-white/85">Get one email each time a new company, the PAM track or a platform lab is released. No payment details needed.</p>
          {children}
        </div>
        <div className="rounded-2xl bg-card p-6 text-card-foreground shadow-2xl"><Waitlist /></div>
      </div>
    </section>
  );
}

// Standard hero for marketing sub-pages.
export function PageHero({ eyebrow, title, lead, children }: { eyebrow: string; title: string; lead: string; children?: ReactNode }) {
  return (
    <section aria-labelledby="page-h" className="border-b bg-card">
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-16 md:px-6 md:py-20">
        <p className="t-eyebrow">{eyebrow}</p>
        <h1 id="page-h" className="t-display max-w-4xl">{title}</h1>
        <p className="t-lead max-w-3xl">{lead}</p>
        {children}
      </div>
    </section>
  );
}

// Page frame shared by the marketing sub-pages.
export function MarketingFrame({ current, children }: { current: string; children: ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2">Skip to content</a>
      <SiteHeader current={current} />
      <main id="main" tabIndex={-1} className="outline-none">{children}<WaitlistBand /></main>
      <SiteFooter />
    </>
  );
}
