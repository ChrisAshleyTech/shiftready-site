// 404 page. Vercel serves dist/404.html with a 404 status for any unmatched URL.
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IllusSearch } from "@/components/brand/illustrations";
import { SiteHeader, SiteFooter } from "@/marketing/chrome";

const LINKS = [
  ["/tracks/", "Tracks", "IAM Ops, GRC Audit and PAM."],
  ["/pricing/", "Pricing", "Free, Pro and Pro + Labs."],
  ["/resources/", "Resources", "Grading, the runbook and FAQ."],
];

export default function Page() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2">Skip to content</a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <section className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-20 md:grid-cols-[1fr_auto] md:px-6 md:py-28">
          <div className="space-y-5">
            <p className="t-eyebrow">Error 404</p>
            <h1 className="t-display">This page doesn't exist.</h1>
            <p className="t-lead max-w-xl">The link may be out of date, or the address may have been mistyped. The pages below cover most of the site.</p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button asChild size="lg" className="font-bold"><a href="/">Go to the home page <ArrowRight /></a></Button>
              <Button asChild size="lg" variant="outline" className="border-2 font-bold"><a href="/app/">Open the app</a></Button>
            </div>
          </div>
          <IllusSearch className="hidden h-56 w-auto md:block" />
        </section>
        <section aria-label="Popular pages" className="mx-auto max-w-5xl px-4 pb-20 md:px-6">
          <ul className="grid gap-4 sm:grid-cols-3">
            {LINKS.map(([href, t, d]) => (
              <li key={href}><a href={href} className="lift block h-full rounded-2xl border bg-card p-5 hover:border-primary/40">
                <span className="font-display text-lg font-bold">{t}</span><span className="t-meta mt-1 block">{d}</span></a></li>))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
