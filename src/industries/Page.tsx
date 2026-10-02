// /industries: six companies on one engine.
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EarlyAccess } from "@/components/brand/EarlyAccess";
import { MarketingFrame, PageHero } from "@/marketing/sections";
import { INDUSTRIES } from "@/marketing/catalog";

const SYSTEMS: Record<string, string> = {
  "pacific-crest": "Salesforce, SAP (AP entry and approval, general ledger), CargoWise, warehouse management, Workday, Concur, Microsoft 365, ServiceNow",
  "harbor-health": "Electronic health record roles, imaging (PACS), pharmacy, emergency break-glass access",
  "meridian": "Product lifecycle management, CUI file shares, export-controlled engineering data",
  "coastline": "Core banking, wire transfers, loan origination, teller systems",
  "brightpath": "Cloud production accounts, source control, CI/CD, customer-data support tools",
  "sunset-retail": "Point of sale, cardholder data environment, e-commerce administration, merchandising",
};

export default function Page() {
  return (
    <MarketingFrame current="industries">
      <PageHero eyebrow="Companies" title="Six companies. Six rulebooks." lead="Each company has its own applications, access matrix, separation-of-duties rules, regulations and HR feed. Every company and person is fictional." />
      <ul className="mx-auto grid max-w-7xl gap-6 px-4 py-16 md:grid-cols-2 md:px-6">
        {INDUSTRIES.map(c => (
          <li key={c.id} id={c.id} className="scroll-mt-24 flex flex-col gap-4 rounded-3xl border bg-card p-8">
            <div className="flex items-center justify-between gap-3"><p className="t-meta font-semibold">{c.industry}</p>{c.early && <EarlyAccess />}</div>
            <h2 className="t-h2">{c.name}</h2>
            <dl className="space-y-3">
              <div><dt className="t-eyebrow">Regulatory focus</dt><dd className="mt-1">{c.frameworks}</dd></div>
              <div><dt className="t-eyebrow">Systems</dt><dd className="mt-1 text-muted-foreground">{SYSTEMS[c.id]}</dd></div>
            </dl>
            {!c.early && <Button asChild className="mt-auto w-fit font-bold"><a href="/app/">Start free <ArrowRight /></a></Button>}
          </li>))}
      </ul>
    </MarketingFrame>
  );
}
