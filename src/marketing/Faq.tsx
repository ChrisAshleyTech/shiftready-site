// FAQ list built on native <details>, so every answer is in the pre-rendered HTML that search and AI
// crawlers read (a Radix accordion only renders the open answer). The same pairs feed FAQPage JSON-LD.
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type QA = readonly (readonly [string, string])[];

export function Faq({ items, className, questionClassName }: { items: QA; className?: string; questionClassName?: string }) {
  return (
    <div className={className}>
      {items.map(([q, a]) => (
        <details key={q} name="faq" className="group border-b last:border-b-0">
          <summary className={cn("flex cursor-pointer list-none items-start justify-between gap-4 rounded-md py-4 text-left outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden", questionClassName)}>
            {q}
            <ChevronDownIcon aria-hidden className="pointer-events-none size-4 shrink-0 translate-y-1.5 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <p className="pb-4 text-base text-muted-foreground">{a}</p>
        </details>
      ))}
    </div>
  );
}

export const faqSchema = (items: QA) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
});
