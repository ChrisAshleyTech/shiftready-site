// Readiness report data for the current path. IAM paths use the engine's shift report (plus the
// Friday audit on IAM + GRC); GRC only reports the audit of Jordan Reyes' week.
import { buildReport } from "@/engine/report.js";
import { gTotals, G } from "@/engine/grc.js";
import { path } from "./paths";
import { waTotals, weekAudit } from "./audit/weekAudit";

export function reportData(name: string, companyId: string) {
  const p = path(), wa = weekAudit(), wt = waTotals();
  const audit = wa && wt.done ? { pct: wt.pct, sc: wt.sc, mx: wt.mx, done: wt.done, n: wt.n } : null;
  if (p === "grc") {
    const g = gTotals();
    return {
      v: 1, p, c: companyId, name: (name || "").trim().slice(0, 60), date: new Date().toISOString().slice(0, 10),
      audit: audit ?? { pct: null, sc: 0, mx: 0, done: 0, n: wt.n },
      // [task id, step, score, max] for each task; -1 when not submitted.
      tasks: wa ? wa.tasks.map(t => { const st = wa.st[t.id]; return [t.id, t.step, st?.checks ? st.score : -1, st?.checks ? st.max : 0]; }) : [],
      grc: g.done ? { pct: g.pct, done: g.done, n: G.length } : null,
      mon: null, thu: null, skills: [], tickets: [],
    };
  }
  return { ...buildReport(name), p, c: companyId, ...(p === "iam-grc" ? { fri: audit } : { grc: null }) };
}
