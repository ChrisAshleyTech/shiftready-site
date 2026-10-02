// Machine-readable descriptions of the site for search and AI answer engines: JSON-LD for each
// pre-rendered page and the /llms.txt summary. Both are built from the same catalog and price data
// the pages show, and written into dist/ by scripts/prerender.mjs.
import { SITE_URL } from "../../seo.plugin";
import { INDUSTRIES, LAB_INFO, TRACKS } from "./catalog";
import { PRICES, PRO_FOOTNOTE } from "./plans";
import { faqSchema, type QA } from "./Faq";
import { FAQ as HOME_FAQ } from "../landing/Page";
import { FAQ as RESOURCES_FAQ } from "../resources/Page";
import { QA as PRICING_FAQ } from "../pricing/Page";
import { GUIDES, guideHref } from "../guides/data";

const TAGLINE = "Experience the role. Master the work.";
const SUMMARY = "Rolevara is a browser-based job simulator for identity and access management (IAM), governance, risk and compliance (GRC) and privileged access management (PAM) roles. You work a realistic service desk ticket queue and audit for a fictional company, and every ticket is graded on its outcome and its process, so you know you can do the job before you get it.";

const ORG = {
  "@type": "Organization", "@id": `${SITE_URL}/#org`, name: "Rolevara", url: `${SITE_URL}/`,
  logo: `${SITE_URL}/icon-512.png`, slogan: TAGLINE, email: "support@rolevara.com",
};
const WEBSITE = { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: "Rolevara", url: `${SITE_URL}/`, publisher: { "@id": `${SITE_URL}/#org` } };
const APP = {
  "@type": "WebApplication", "@id": `${SITE_URL}/#app`, name: "Rolevara job simulator", alternateName: "RolevaraSim",
  url: `${SITE_URL}/app/`, applicationCategory: "EducationalApplication", operatingSystem: "Any (runs in a web browser)",
  description: SUMMARY, publisher: { "@id": `${SITE_URL}/#org` },
  about: ["Identity and access management", "Governance, risk and compliance", "Privileged access management", "IT service desk", "IT audit"],
  audience: { "@type": "Audience", audienceType: "Service desk analysts, IAM analysts and engineers, GRC and audit staff, and people moving into identity and access roles" },
  offers: { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD", url: `${SITE_URL}/pricing/` },
};
const graph = (...nodes: object[]) => ({ "@context": "https://schema.org", "@graph": [ORG, WEBSITE, ...nodes] });
const faq = (items: QA) => { const { "@context": _, ...rest } = faqSchema(items); return rest; };

// Built HTML file -> JSON-LD objects for its <head>.
export const SCHEMA: Record<string, object> = {
  "index.html": graph(APP, faq(HOME_FAQ)),
  "pricing/index.html": graph(APP, faq(PRICING_FAQ)),
  "resources/index.html": graph(faq(RESOURCES_FAQ)),
  "tracks/index.html": graph(APP),
  "industries/index.html": graph(APP),
  "labs/index.html": graph(APP),
  "guides/index.html": graph({ "@type": "ItemList", name: "Rolevara guides",
    itemListElement: GUIDES.map((g, i) => ({ "@type": "ListItem", position: i + 1, url: SITE_URL + guideHref(g), name: g.title })) }),
  ...Object.fromEntries(GUIDES.map(g => [`guides/${g.slug}/index.html`, graph(
    { "@type": "Article", headline: g.title, description: g.lead, dateModified: g.updated, url: SITE_URL + guideHref(g),
      author: { "@id": `${SITE_URL}/#org` }, publisher: { "@id": `${SITE_URL}/#org` }, mainEntityOfPage: SITE_URL + guideHref(g) },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE_URL}/guides/` },
      { "@type": "ListItem", position: 3, name: g.title, item: SITE_URL + guideHref(g) }] },
    faq(g.faq))])),
  "privacy/index.html": graph(),
  "terms/index.html": graph(),
};

const early = (e?: boolean) => (e ? " (early access)" : "");
const qa = (items: QA) => items.map(([q, a]) => `### ${q}\n${a}`).join("\n\n");

// https://llmstxt.org: a plain-Markdown map of the site for language models.
export const LLMS_TXT = `# Rolevara

> ${SUMMARY} ${TAGLINE}

Rolevara runs in the browser with no install and no lab tenant needed. All companies and people in the scenarios are fictional. The policy content is training material based on published frameworks, not legal or compliance advice.

## Tracks
${TRACKS.map(t => `- [${t.name}](${SITE_URL}${t.href})${early(t.early)}: ${t.text}`).join("\n")}

## Industry scenarios
${INDUSTRIES.map(i => `- ${i.name}${early(i.early)}: ${i.industry}. Frameworks: ${i.frameworks}.`).join("\n")}

## Platform labs
${LAB_INFO.map(l => `- ${l.name}${l.status === "soon" ? " (coming soon)" : " (early access)"}: ${l.overview}`).join("\n")}

## Pricing
- Free: the complete Pacific Crest Logistics scenario on all three paths (IAM only, IAM + GRC, GRC only).
- Pro: $${PRICES.pro.monthly}/month, with a ${PRICES.pro.trialDays}-day free trial. Every industry scenario, every track and full coaching.
- Pro + Labs: $${PRICES.labs.monthly}/month. Pro plus graded labs in Microsoft Entra ID, Okta and AWS tenants you own.
- Paid plans open from a waitlist. ${PRO_FOOTNOTE}

## Pages
- [Home](${SITE_URL}/): what Rolevara is and how it works
- [Start the simulator](${SITE_URL}/app/): free, in the browser
- [Tracks](${SITE_URL}/tracks/): IAM Ops, GRC Audit and PAM
- [Industries](${SITE_URL}/industries/): the fictional companies and their frameworks
- [Platform labs](${SITE_URL}/labs/): Microsoft Entra ID, Okta and AWS labs
- [Pricing](${SITE_URL}/pricing/)
- [Resources](${SITE_URL}/resources/): how grading works, the runbook, a sample readiness report and accessibility

## Guides
${GUIDES.map(g => `- [${g.title}](${SITE_URL}${guideHref(g)}): ${g.lead}`).join("\n")}

## FAQ
${qa(HOME_FAQ)}

${qa(PRICING_FAQ.filter(([q]) => !HOME_FAQ.some(([h]) => h === q)))}

## Contact
- support@rolevara.com
`;
