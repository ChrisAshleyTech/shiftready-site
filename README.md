# Verdelit

*Prove you can do the job before day one.* ([verdelit.com](https://verdelit.com))

An IAM job simulator. Learners work a Monday service-desk shift at Pacific Crest Logistics
(a fictional company). Thursday's queue is then built from what they did on Monday, and they
can audit their own week on the GRC desk. Everything runs in the browser, with no backend.

| URL | What it is |
|---|---|
| `/` | Landing page: hero demo, skills, features, pricing, FAQ, waitlist |
| `/pricing/` | Pricing (display only) and the waitlist |
| `/app/` | The app: home, ticket queue, directory, policy, HR feed, audit log, results, report, GRC desk |
| `/report/#r=…` | Public readiness report, decoded from the link itself |
| `/sim.html` | Redirects to `/app/#/queue` (old links and saved progress keep working) |

## Stack

Vite + React 19 + TypeScript, Tailwind CSS v4, shadcn/ui primitives, lucide icons, Recharts (via
shadcn chart) and Motion. The look is "Bright and Bold": a light base with a strong blue accent
(`#2563EB`), with dark mode behind the toggle. The theme tokens are in `src/index.css`, and their
contrast ratios are noted there.

Motion (`src/components/brand/motion.tsx`) includes the animated hero backdrop, scroll reveals,
count-up stats, hover lift and the looping hero demo. Every looping animation shares one visible
Pause control (WCAG 2.2.2), and everything is static when the visitor prefers reduced motion.

Components from 21st.dev live in `src/components/ui`:
- `animated-sidebar.tsx`, the app navigation (starc007). It's kept verbatim; its helpers are in
  `animated-sidebar-utils/`.
- `logo-marquee.tsx`, the scrolling skills strip (ddoemonn). It's kept verbatim, with a pause
  button added by `SkillsStrip` through its `paused` prop.

The simulation engine in `src/engine/*.js` is the original simulator's code, unchanged. The UI only
calls it and displays what it returns. `src/app/sim.ts` bridges it to React: engine calls mutate the
state, and `commit()` re-renders. Progress is saved in `localStorage` under `pcl-iam-sim-v1`, the
same key since v1.

## Images and licenses

**Photos** (`public/img/photos`, self-hosted WebP copies) are from Unsplash under the
[Unsplash License](https://unsplash.com/license). It's free for commercial use, attribution isn't
required, and photos can't be sold unaltered or used to build a competing service. We credit the
photographers anyway, in the image captions and here:

| File | Photographer | Source |
|---|---|---|
| `service-desk-*.webp` | BaljkanN 4 | https://unsplash.com/photos/wnpf3Q5pkXA |
| `mentoring-*.webp` | Centre for Ageing Better | https://unsplash.com/photos/wkFRvw2lTAg (also Public Domain) |
| `engineers-*.webp` | Tim van der Kuip | https://unsplash.com/photos/CPs2X8JYmS8 |
| `team-room-*.webp` | RUT MIIT | https://unsplash.com/photos/RbC4-8CdbVQ |

**Illustrations** (`src/components/brand/illustrations.tsx`) are original SVGs drawn for
Verdelit, so no third-party license applies. unDraw was considered, but its license forbids
automated downloading.

**Skills strip** labels are plain text, not vendor logos.

## Pricing

`src/marketing/plans.ts` holds the tiers, prices, feature statuses and add-on. Pricing is **display
only**: nothing is gated or charged. Items that aren't built yet are marked "Coming soon". Full
hints, the tutor and the readiness report are marked "Included free during early access".
"Start free" opens the app. Paid buttons pre-select the tier and billing period in the waitlist form,
which sends `email`, `tier` and `role` to `FORM_ENDPOINT` in `src/marketing/config.ts` (empty =
preview mode: the form validates but doesn't send).

## Develop

```sh
npm install
npm run dev        # http://localhost:5173/  (app at /app/, pricing at /pricing/, report at /report/)
npm run build      # type-check and build to dist/
npm test           # Vitest: engine parity, engine behaviour, landing demo vs engine
npm run e2e        # Playwright: UI, marketing pages, reduced motion, axe (uses installed Chrome)
```

## Brand

The mark, wordmark and tagline live in `src/components/brand/Verdelit.tsx`; level badges in
`LevelBadge.tsx`. `node scripts/make-brand-assets.mjs` renders the favicon, app icons, social preview,
logo lockups (`public/brand/`, SVG with the font embedded, plus PNG) and the LinkedIn level images
(`public/badges/`). The product was called ShiftReady before; an inline script on every page moves
saved progress from the old `shiftready-*` storage keys to `verdelit-*` (its hash is in the CSP in
`vercel.json`), and the lab scripts still accept labs seeded under the old name.

## Deploy to Vercel

`vercel.json` sets the Vite framework preset, `npm run build` and the `dist` output directory. Push
to GitHub and import the repo into Vercel (or run `vercel deploy --prod`). Canonical URLs, the
sitemap and social previews use `SITE_URL` (default `https://verdelit.com`).

## Hints and scoring

Each ticket has three hints. The learner loses the percentage of the **highest** tier opened before
closing. The costs don't add up.

| Tier | Cost | Badge |
|---|---|---|
| Nudge | −10% | Solo |
| Policy clause (quoted from the runbook, plus matrix rows) | −25% | Solo |
| Exact steps | −50% | **Assisted** |

The raw graded score is stored unchanged, and the penalty is applied on top (`finalScore()` in
`src/engine/state.js`). Hints on closed tickets are free to read.

The tutor is rule-based (`src/app/tutor.ts`) and says so in its panel. It asks guiding questions,
recaps the audit trail, explains terms and looks things up, but never gives answers.

Report links carry the report as base64url JSON in the URL fragment, so they need no server.
Learners could edit them, so the report states that it's self-reported.

## Tests

- `tests/parity.test.js` runs the original single-file simulator (`legacy/sim-original.html`) and
  the engine through 40 seeded random scenarios, comparing full state after every action, the
  Thursday handoff, totals and GRC grading.
- `tests/engine.test.js` checks that all 35 exact-steps hints earn full marks, that a clean Monday
  fires no consequences and a careless one fires all 13, the hint penalties, and the report link.
- `tests/demo.test.js` checks the landing-page demo's grade lines against what the engine awards.
- `e2e/marketing.spec.ts` covers the pricing toggle, labels and waitlist tier pre-selection, the
  landing section order and photo credits, the Pause control, and reduced motion.
- `e2e/app.spec.ts` covers hints and penalty maths, Solo/Assisted, the tutor, undo, search focus,
  results, the public report, mobile layout, and an axe scan of every page (pricing included) in
  both themes.
