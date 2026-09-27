// Readiness report: the in-app page (with sharing controls) and the renderer the public
// /report/ page reuses. renderReport() only reads the report data, never live state.
import { buildReport, encodeReport, ticketTitle } from "../../engine/report.js";
import { SKILLS } from "../../engine/hints.js";
import { h, num, pct, plural, meter } from "../ui.js";

const NAME_KEY = "shiftready-report-name";
export const savedName = () => { try { return localStorage.getItem(NAME_KEY) || ""; } catch (e) { return ""; } };
export const saveName = v => { try { localStorage.setItem(NAME_KEY, v); } catch (e) {} };
export const shareUrl = data => new URL("/report/#r=" + encodeReport(data), location.origin).href;

// Readiness band. Needs Monday complete; weighs the week score and how much was solved solo.
export function band(d){
  const done = d.mon.done === d.mon.n, closed = d.mon.done + (d.thu ? d.thu.done : 0);
  const assisted = d.mon.assisted + (d.thu ? d.thu.assisted : 0);
  if (!done) return { label: "In progress", tone: "", note: `${d.mon.done} of ${d.mon.n} Monday tickets closed so far.` };
  const share = closed ? assisted / closed : 0, p = d.week ?? 0;
  const lbl = p >= 90 && share <= 0.1 ? ["Ready for a real queue", "ok"] : p >= 75 && share <= 0.25 ? ["Nearly ready", "ok"] : p >= 60 ? ["Developing", "warn"] : ["Early practice", "bad"];
  return { label: lbl[0], tone: lbl[1], note: d.thu && d.thu.done === d.thu.n ? "Based on the full week." : "Based on Monday only. The Thursday shift isn't finished." };
}

export function renderReport(d, { own = false } = {}){
  const b = band(d);
  const skills = SKILLS.map(sk => { const p = (d.skills.find(x => x[0] === sk.key) || [])[1] ?? null; return `<div class="skill"><span class="name">${h(sk.label)}</span><span class="val">${p == null ? '<span class="muted">Not tested</span>' : pct(p)}</span>${meter(p, sk.label)}</div>`; }).join("");
  const shiftTile = (k, x) => x ? `<div class="tile"><span class="k">${k}</span><span class="v">${pct(x.pct)}</span><span class="d">${x.done}/${x.n} closed · ${x.solo} solo · ${x.assisted} assisted</span></div>` : `<div class="tile"><span class="k">${k}</span><span class="v muted">–</span><span class="d">Not started</span></div>`;
  const rows = (from, to, label) => { const list = d.tickets.slice(from, to); if (!list.length) return "";
    return `<tr><th colspan="4" scope="colgroup" style="background:var(--panel2)">${label}</th></tr>` + list.map(r => `<tr><td><span class="mono muted" style="font-size:12px">${h(r[0])}</span><div>${h(ticketTitle(r))}</div></td>
      <td>${r[4] === 0 ? '<span class="pill">Open</span>' : r[4] === 1 ? '<span class="pill ok">Resolved</span>' : '<span class="pill warn">Rejected</span>'}</td>
      <td class="num">${r[1] < 0 ? "–" : `${num(r[1] / 10)}/${r[2]}`}</td>
      <td>${r[4] === 0 ? "–" : r[3] >= 3 ? '<span class="pill warn">Assisted</span>' : `<span class="pill solid">Solo</span>${r[3] ? ` <span class="muted" style="font-size:12px">${plural(r[3], "hint", "hints")}</span>` : ""}`}</td></tr>`).join(""); };
  const monN = d.mon.n;
  return `<article class="report stack lg" aria-labelledby="rp-h">
    <header class="panel pad stack">
      <span class="eyebrow">ShiftReady readiness report</span>
      <h1 id="rp-h" style="font-size:var(--fs-2xl)">${d.name ? h(d.name) : "IAM analyst readiness"}</h1>
      <p class="muted">IAM Ops track · Pacific Crest Logistics simulation · ${h(new Date(d.date + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }))}</p>
      <div class="row-inline"><span class="pill ${b.tone}" style="font-size:14px;padding:8px 12px">${h(b.label)}</span><span class="muted" style="font-size:14px">${h(b.note)}</span></div>
    </header>
    <section class="results-sum" aria-label="Headline numbers">
      <div class="tile"><span class="k">Week score</span><span class="v">${pct(d.week)}</span><span class="d">After hint penalties</span></div>
      ${shiftTile("Monday", d.mon)}${shiftTile("Thursday", d.thu)}
      <div class="tile"><span class="k">Consequences</span><span class="v">${d.caused == null ? "–" : d.caused}</span><span class="d">${d.caused == null ? "Revealed on Thursday" : `caused · ${d.prevented} prevented`}</span></div>
      ${d.grc ? `<div class="tile"><span class="k">GRC audit</span><span class="v">${pct(d.grc.pct)}</span><span class="d">${d.grc.done}/${d.grc.n} tasks</span></div>` : ""}
    </section>
    <section class="panel pad stack" aria-labelledby="rs-h"><h2 id="rs-h" style="font-size:var(--fs-lg)">Skills</h2><div>${skills}</div></section>
    <section class="sec" aria-labelledby="rt-h"><h2 id="rt-h" class="sec-title">Every ticket</h2>
      <div class="tablewrap"><table><caption class="sr-only">Ticket results</caption><thead><tr><th scope="col">Ticket</th><th scope="col">Result</th><th scope="col" class="num">Score</th><th scope="col">Solo / Assisted</th></tr></thead>
      <tbody>${rows(0, monN, "Monday")}${rows(monN, undefined, "Thursday")}</tbody></table></div></section>
    <section class="callout stack" style="gap:6px"><h4>How to read this</h4>
      <p><b>Solo</b> means the ticket was closed without the exact-steps hint. <b>Assisted</b> means the learner revealed the exact steps. Smaller hints (a nudge or the policy clause) cost 10% or 25% of a ticket's score, and the ticket still counts as Solo.</p>
      <p>Thursday's queue is generated from Monday's decisions. <b>Consequences caused</b> counts the Monday mistakes that came back as incidents.</p>
      <p>This report was generated in the learner's own browser and isn't verified by ShiftReady.${own ? "" : ' <a href="/app/">Try the simulator yourself</a>.'}</p></section>
  </article>`;
}

// ---------- In-app page ----------
export function render(){
  const d = buildReport(savedName());
  const url = shareUrl(d);
  return `<div class="page-h"><h1>Readiness report</h1><p>A shareable summary of your week. The link contains your scores and the name you enter, nothing else. Anyone with the link can view it.</p></div>
    <div class="stack lg">
      <section class="panel pad stack no-print" aria-labelledby="sh-h"><h2 id="sh-h" style="font-size:var(--fs-lg)">Share</h2>
        <div class="control-row"><div class="field" style="flex:1 1 240px"><label for="rp-name">Name on the report <span class="muted">(optional)</span></label><input type="text" id="rp-name" data-input="reportName" value="${h(savedName())}" maxlength="60" autocomplete="name"></div></div>
        <div class="field"><label for="rp-url">Share link</label><input type="url" id="rp-url" readonly value="${h(url)}" data-a="selectAll"></div>
        <div class="btns"><button class="btn primary" data-a="copyReport">Copy link</button><a class="btn" id="rp-open" href="${h(url)}" target="_blank" rel="noopener">Open shareable view</a><button class="btn" data-a="print">Print or save as PDF</button></div>
        <p class="muted" style="font-size:12px">The link is a snapshot. If you keep working, copy a new one.</p>
      </section>
      ${renderReport(d, { own: true })}
    </div>`;
}
