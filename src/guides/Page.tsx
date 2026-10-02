// /guides/<slug>/: one career or how-to guide, with a practice call to action and its FAQ.
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingFrame, PageHero } from "@/marketing/sections";
import { Faq } from "@/marketing/Faq";
import { GUIDES, guideHref, type Guide } from "./data";

export default function GuidePage({ guide: g }: { guide: Guide }) {
  const more = GUIDES.filter(o => o.slug !== g.slug).slice(0, 3);
  return (
    <MarketingFrame current="resources">
      <div className="bg-card"><nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 pt-6 text-sm text-muted-foreground md:px-6">
        <a className="hover:underline" href="/">Home</a> / <a className="hover:underline" href="/guides/">Guides</a>
      </nav></div>
      <PageHero eyebrow={g.eyebrow} title={g.title} lead={g.lead}><p className="t-meta">Updated {g.updated}</p></PageHero>
      <article className="mx-auto max-w-3xl space-y-12 px-4 py-14 text-[17px] leading-relaxed md:px-6">
        {g.sections.map((s, i) => (
          <section key={s.h} aria-labelledby={`s${i}-h`} className="space-y-4">
            <h2 id={`s${i}-h`} className="t-h2">{s.h}</h2>
            {s.p?.map(p => <p key={p}>{p}</p>)}
            {s.list && <ul className="space-y-3">{s.list.map(l => <li key={l} className="flex gap-3"><Check className="mt-1.5 size-4 shrink-0 text-ok" strokeWidth={3} aria-hidden />{l}</li>)}</ul>}
          </section>
        ))}
        <section aria-labelledby="practice-h" className="space-y-4 rounded-3xl border bg-card p-8">
          <h2 id="practice-h" className="t-h3">Practise it on a realistic job</h2>
          <p>{g.practice.text}</p>
          <Button asChild size="lg" className="font-bold"><a href={g.practice.href}>{g.practice.label} <ArrowRight /></a></Button>
        </section>
        <section aria-labelledby="faq-h" className="space-y-2">
          <h2 id="faq-h" className="t-h2">Questions</h2>
          <Faq items={g.faq} questionClassName="font-display text-lg font-bold" />
        </section>
        <section aria-labelledby="more-h" className="space-y-4">
          <h2 id="more-h" className="t-h3">More guides</h2>
          <ul className="space-y-2">{more.map(o => <li key={o.slug}><a className="font-semibold text-primary-strong underline" href={guideHref(o)}>{o.title}</a></li>)}</ul>
        </section>
      </article>
    </MarketingFrame>
  );
}
