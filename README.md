# Rolevara

*Experience the role. Master the work.* ([rolevara.com](https://rolevara.com))

An IAM and GRC job simulator. Learners pick a path: work the Pacific Crest Logistics service desk
(a fictional company) on Monday and Thursday, where Thursday's queue is built from Monday's
decisions; audit their own week on Friday; or audit a simulated analyst's week as the internal
auditor. Everything runs in the browser, with no backend.

| URL | What it is |
|---|---|
| `/` | Landing page: hero demo, skills, features, pricing, FAQ, waitlist |
| `/pricing/` | Pricing (display only) and the waitlist |
| `/app/` | The app: home, ticket queue, directory, policy, HR feed, audit log, results, week summary, week audit, SOX desk, report, settings |
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
state, and `commit()` re-renders. Progress is saved in `localStorage` per company and per path
(see Paths). Pacific Crest on IAM + GRC keeps `pcl-iam-sim-v1`, the same key since v1.

## Paths

The learner picks a path on the first visit (Home) and can switch in Settings. The choice is in
`rolevara-path`; each path saves its own progress at each company (`stateKey()` in
`src/app/pathStore.ts`: IAM + GRC uses the company's original key, the others add `:iam` or
`:grc`). Anyone with pre-paths progress is put on IAM + GRC and skips the picker. All three
paths are in Free.

| Path | What the learner does | Screens only in this path |
|---|---|---|
| IAM only | Monday, Thursday, week summary | Queue, results, week summary, lab |
| IAM + GRC | Monday, Thursday, an optional Friday audit of their own week, framework panels | Everything |
| GRC only | Audit Jordan Reyes' Monday-to-Thursday week as the internal auditor | Week audit, SOX desk |

- **Jordan Reyes** (`src/app/audit/jordan.ts`) is a simulated IAM analyst. On first use of
  GRC only, Jordan's week is played through the real engine: the correct playbook plus six planted
  mistakes (`MISTAKES`). The audit log, directory and Thursday consequences are therefore genuine
  evidence. The directory is read-only on this path.
- **The week audit** (`src/app/audit/weekAudit.ts`) has seven tasks: walkthrough, sample
  selection, control testing, evidence evaluation, a finding (condition, criteria, cause, effect,
  recommendation), risk ratings and the management response. It serves both Friday (the learner's
  own week) and GRC only (Jordan's). Answer keys are computed from the audited week's log and
  ticket records when the audit starts, then frozen.
- **Framework panels** (`src/app/frameworks.ts`) appear on tickets (IAM + GRC) and audit tasks.
  While the work is open they name only control families. After grading they show the requirements.
  NIST SP 800-53 Rev. 5 and HIPAA (45 CFR 164) text is quoted verbatim from NIST's OSCAL catalog and
  the eCFR. ISO/IEC 27001:2022, SOC 2 and PCI DSS v4.0.1 get IDs and our own summaries only, with a
  link to the official source.

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
Rolevara, so no third-party license applies. unDraw was considered, but its license forbids
automated downloading.

**Skills strip** labels are plain text, not vendor logos.

## Pricing

`src/marketing/plans.ts` holds the tiers and feature statuses; `PRICES` there is the only place
prices are set (Free, Pro with a 14-day trial, Pro + Labs; "Cancel anytime" on paid plans). Pricing is
**display only**: nothing is charged. Items that aren't built yet are marked "Coming soon". Full
hints, the tutor and the readiness report are marked "Included free during early access".
"Start free" opens the app. Paid buttons pre-select the tier and billing period in the waitlist form,
which sends `email`, `tier` and `role` to `FORM_ENDPOINT` in `src/marketing/config.ts` (empty =
preview mode: the form validates but doesn't send).

## Platform labs and tester access

Three labs (Microsoft Entra ID, Okta, AWS IAM) share the Pacific Crest seed data and grading in
`src/app/lab/core.ts`; each platform parses its own read-only export (`entra.ts`, `okta.ts`,
`aws.ts`). The scripts live in `lab-files/`, outside `public/`, so they are not in the site build.
Vercel serves them from `api/lab-file.js` only to browsers holding tester access.

Access is a private link, `/labs/access?key=...`, signed with `LAB_ACCESS_SECRET` (Vercel project
environment variable, 32+ characters; without it every link is refused). The link sets an HttpOnly
cookie and opens `/app/#/labs`. Make the secret and links locally:

```sh
node scripts/make-lab-link.mjs --new-secret          # paste into Vercel as LAB_ACCESS_SECRET
LAB_ACCESS_SECRET=... node scripts/make-lab-link.mjs --to "tester@example.com" --days 30
```

Rotating the secret revokes every link. `TODO(labs-auth)` in `api/_lib/labAccess.js` covers the
move to Supabase Auth with a paid-tier check and scripts and guide text served from storage. The
public `/labs` page shows only each lab's overview. The AWS template
(`lab-files/aws/rolevara-lab-aws.json`) is generated from `awsTemplate()`; `tests/awsLab.test.ts`
fails if they drift.

## Develop

```sh
npm install
npm run dev        # http://localhost:5173/  (app at /app/, pricing at /pricing/, report at /report/)
npm run build      # type-check and build to dist/
npm test           # Vitest: engine parity, engine behaviour, landing demo vs engine
npm run e2e        # Playwright: UI, marketing pages, reduced motion, axe (uses installed Chrome)
```

## Brand

The mark, wordmark and tagline live in `src/components/brand/Rolevara.tsx`; level badges in
`LevelBadge.tsx`. `node scripts/make-brand-assets.mjs` renders the favicon, app icons, social preview,
logo lockups (`public/brand/`, SVG with the font embedded, plus PNG) and the LinkedIn level images
(`public/badges/`). The product was called ShiftReady before; an inline script on every page moves
saved progress from the old `shiftready-*` storage keys to `rolevara-*` (its hash is in the CSP in
`vercel.json`), and the lab scripts still accept labs seeded under the old name.

## Deploy to Vercel

`vercel.json` sets the Vite framework preset, `npm run build` and the `dist` output directory. Push
to GitHub and import the repo into Vercel (or run `vercel deploy --prod`). Canonical URLs, the
sitemap and social previews use `SITE_URL` (default `https://rolevara.com`).

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
- `tests/paths.test.ts` checks Jordan's week (only the planted mistakes lose points, three
  consequences fire), the week audit's answer keys against that evidence, a clean week, grading,
  per-path storage keys, GRC-only report links, and that only public-domain framework text is quoted.
- `e2e/paths.spec.ts` covers the first-visit picker, GRC only end to end, switching paths without
  losing progress, skipping and resuming Friday, the week summary, and framework panels, with axe scans.
- `tests/engine.test.js` checks that all 35 exact-steps hints earn full marks, that a clean Monday
  fires no consequences and a careless one fires all 13, the hint penalties, and the report link.
- `tests/demo.test.js` checks the landing-page demo's grade lines against what the engine awards.
- `e2e/marketing.spec.ts` covers the pricing toggle, labels and waitlist tier pre-selection, the
  landing section order and photo credits, the Pause control, and reduced motion.
- `e2e/app.spec.ts` covers hints and penalty maths, Solo/Assisted, the tutor, undo, search focus,
  results, the public report, mobile layout, and an axe scan of every page (pricing included) in
  both themes.
