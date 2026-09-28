# ShiftReady

An IAM job simulator. Learners work a Monday service-desk shift at Pacific Crest Logistics
(a fictional company). Thursday's queue is then built from what they did on Monday, and they
can audit their own week on the GRC desk. Everything runs in the browser, with no backend.

| URL | What it is |
|---|---|
| `/` | Landing page with the waitlist form |
| `/app/` | The app: home, ticket queue, directory, policy, HR feed, audit log, results, report, GRC desk |
| `/report/#r=…` | Public readiness report, decoded from the link itself |
| `/sim.html` | Redirects to `/app/#/queue` (old links and saved progress keep working) |

## Stack

Vite + React 19 + TypeScript, Tailwind CSS v4, shadcn/ui primitives, lucide icons, Recharts (via
shadcn chart) and Motion. The theme is a dark-first "ops console", with light mode available from
the toggle in the top bar.

Two components came from 21st.dev and live in `src/components/ui`:
- `animated-sidebar.tsx`, the app navigation (starc007). It's kept verbatim; its helpers are in
  `animated-sidebar-utils/`.
- `hero-financial.tsx`, the landing hero, adapted from the Financial Hero (uilayout.contact). Its
  gradients, glows and stock image were replaced with the theme, and it frames a real screenshot.

The simulation engine in `src/engine/*.js` is the original simulator's code, unchanged. The UI only
calls it and displays what it returns. `src/app/sim.ts` bridges it to React: engine calls mutate the
state, and `commit()` re-renders.

Progress is saved in `localStorage` under `pcl-iam-sim-v1`, the same key since v1.

## Develop

```sh
npm install
npm run dev        # http://localhost:5173/  (app at /app/, report at /report/)
npm run build      # type-check and build to dist/
npm test           # Vitest: engine parity + engine behaviour
npm run e2e        # Playwright: UI click-through, mobile, axe accessibility (uses installed Chrome)
```

## Deploy to Vercel

`vercel.json` sets the Vite framework preset, `npm run build` and the `dist` output directory. Push
to GitHub and import the repo into Vercel (or run `vercel deploy --prod`). To collect waitlist
emails, set `FORM_ENDPOINT` in `src/landing/main.tsx` to a Formspree (or similar) endpoint.

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
- `e2e/app.spec.ts` covers hints and penalty maths, Solo/Assisted, the tutor, undo, search focus,
  results, the public report, mobile layout, and an axe scan of every page in both themes.
