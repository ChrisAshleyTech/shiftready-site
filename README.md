# ShiftReady

An IAM job simulator. Learners work a Monday service-desk shift at Pacific Crest Logistics
(a fictional company). Thursday's queue is then built from what they did on Monday, and they
can audit their own week on the GRC desk. Everything runs in the browser: there's no backend,
no build step and no dependencies.

| URL | What it is |
|---|---|
| `/` | Landing page with the waitlist form |
| `/app/` | The app: home, ticket queue, directory, policy, HR feed, audit log, results, report, GRC desk |
| `/report/#r=…` | Public readiness report, decoded from the link itself |
| `/sim.html` | Redirects to `/app/#/queue` (old links and saved progress keep working) |

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, choose **Add New → Project**, import the repo, and select **Deploy**. Leave the
   framework preset as **Other** and the build settings empty.
3. For the waitlist, create a free form at formspree.io and paste its endpoint into
   `FORM_ENDPOINT` near the bottom of `index.html`. Commit, and Vercel redeploys.
4. Optional: add a custom domain under **Project → Settings → Domains**.

`.vercelignore` keeps `tests/`, `tools/` and `legacy/` out of the deployment.

## Run locally

ES modules don't load from `file://`, so serve the folder over HTTP. On Windows, without
Node or Python:

```powershell
powershell -ExecutionPolicy Bypass -File tools\serve.ps1     # http://localhost:5173/
```

Any static server works too (`npx serve`, `python -m http.server 5173`).

## How it fits together

```
assets/css/tokens.css      palette (light + dark), type, spacing, base styles, shared with the landing page
assets/css/app.css         components and page layouts
assets/js/engine/          simulation: no DOM, testable
  company.js  tickets.js  thursday.js  grc.js   the original simulator's data and grading, unchanged
  store.js                 live state (S) and the grading helpers
  state.js                 persistence, directory and ticket actions, hint scoring, totals
  hints.js                 three hint tiers, a skill and a tutor category for every ticket
  policy.js  skills.js  report.js
assets/js/app/             UI: hash router (main.js), event handlers (actions.js), views/
```

Progress is saved in `localStorage` under `pcl-iam-sim-v1`, the same key the original
single-file simulator used.

### Hints and scoring

Each ticket has three hints. The learner loses the percentage of the **highest** tier they
opened before closing the ticket. The costs don't add up.

| Tier | Cost | Badge |
|---|---|---|
| Nudge | −10% | Solo |
| Policy clause (quoted from the runbook, plus the matching access-matrix rows) | −25% | Solo |
| Exact steps | −50% | **Assisted** |

The raw graded score is stored unchanged, and the penalty is applied on top of it
(`finalScore()` in `state.js`). Once a ticket is closed, its hints are free to read and don't
change the score. To change the costs, edit `HINT_TIERS` in `state.js`.

### Tutor

The tutor is guided and rule-based, not a language model, and it says so in the panel. It asks
guiding questions for each type of ticket, recaps the learner's own audit trail, explains terms,
looks up people and roles, and goes through lost points after a ticket is closed. It won't give
answers, because that's what the paid hints are for. A server-side AI tutor could replace
`answer()` in `views/tutor.js` later.

### Readiness report links

The report is JSON, base64url-encoded into the URL fragment (`/report/#r=…`). Fragments never
reach a server, so sharing needs no backend. The report states that it's self-reported: a
learner could edit the data in the link, so treat it as a conversation starter, not proof.

## Tests

Start `tools/serve.ps1`, then open these pages in a browser, or run them headless with
`sh tools/run-test.sh tests/<page>.html`:

- `tests/parity.html` runs the original simulator (`legacy/sim-original.html`) and the new
  engine through 40 seeded random scenarios, comparing full state after every action, the
  Thursday handoff, totals and GRC grading.
- `tests/walkthrough.html` checks that every ticket's exact-steps hint earns full marks, that a
  clean Monday fires no consequences and a careless one fires all 13, the hint penalty maths,
  and a click-through of the UI (hints, Solo/Assisted, tutor, undo, search focus, report link).
- `tests/seed.html?s=mon|thu&to=%23/queue` loads a partly played week for manual QA.
  `tests/frame.html` renders a page at exact phone widths.
