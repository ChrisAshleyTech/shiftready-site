// Layout for legal pages (privacy, terms): header, readable prose column, footer.
import type { ReactNode } from "react";
import { SiteHeader, SiteFooter } from "./chrome";
import { LEGAL } from "./legal";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2">Skip to content</a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <article className="mx-auto max-w-3xl px-4 py-14 md:px-6 md:py-20">
          <p className="t-eyebrow">Legal</p>
          <h1 className="t-display mt-3">{title}</h1>
          <p className="t-meta mt-4">Effective {LEGAL.effectiveDate}</p>
          <div className="mt-10 space-y-8 text-[17px] leading-relaxed [&_a]:font-semibold [&_a]:text-primary-strong [&_a]:underline [&_h2]:t-h3 [&_h2]:mb-3 [&_li]:mt-1.5 [&_ul]:ml-5 [&_ul]:list-disc">
            {children}
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}

export function Contact() {
  return LEGAL.contactEmail
    ? <>Questions or requests can be sent to <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.</>
    : <>Questions or requests can be sent through the waitlist form on the <a href="/#waitlist">home page</a>, with the request described in the role field.</>;
}
