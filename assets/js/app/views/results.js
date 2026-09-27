// Shift results: per-ticket scores with hint penalties, Solo vs Assisted, and the
// Monday-to-Thursday consequence timeline.
import { S } from "../../engine/store.js";
import { T, TK } from "../../engine/tickets.js";
import { CONSEQ, THU_T } from "../../engine/thursday.js";
import { totals, finalScore, hintsUsed, hintCost, isAssisted } from "../../engine/state.js";
import { CONSEQ_LINKS, HINTS, SKILLS } from "../../engine/hints.js";
import { summary } from "../../engine/skills.js";
import { h, num, pct, plural, ui, statusPill, modePill } from "../ui.js";

const hashQuery = () => new URLSearchParams(location.hash.split("?")[1] || "");
const skillLabel = id => (SKILLS.find(s => s.key === (HINTS[id] || {}).skill) || {}).label || "";

export function render(){
  const thu = S.shift === "thu";
  const tab = thu && hashQuery().get("s") !== "mon" ? "thu" : "mon";
  const list = tab === "thu" ? THU_T : T, tt = totals(list), s = summary();
  const seg = thu ? `<div class="segmented" role="group" aria-label="Shift"><a href="#/results?s=mon" ${tab === "mon" ? 'aria-current="page"' : ""}>Monday</a><a href="#/results?s=thu" ${tab === "thu" ? 'aria-current="page"' : ""}>Thursday</a></div>` : "";
  const tiles = [
    ["Score", pct(tt.pct), `${num(tt.sc)} of ${tt.mx} points`],
    ["Closed", `${tt.done}/${list.length}`, tt.done < list.length ? `${list.length - tt.done} still open` : "All tickets closed"],
    ["Solo", String(tt.solo), "Closed without exact steps"],
    ["Assisted", String(tt.assisted), "Used the exact-steps hint"],
    ...(tab === "thu" ? [["Caused by Monday", String(s.caused), `${s.prevented} prevented`]] : []),
  ].map(([k, v, d]) => `<div class="tile"><span class="k">${k}</span><span class="v">${v}</span><span class="d">${d}</span></div>`).join("");

  const rows = list.slice().sort((a, b) => a.pri - b.pri).map(t => {
    const ts = S.tickets[t.id], u = hintsUsed(ts);
    return `<tr><td><a class="mono" href="#/queue/${t.id}" ${tab === "mon" && thu ? 'data-a="setViewLink" data-v="mon"' : ""}>${t.id}</a><div>${h(t.title)}</div></td>
      <td class="muted">${h(skillLabel(t.id))}</td>
      <td>${ts.checks ? statusPill(ts.status) : '<span class="pill">Open</span>'}</td>
      <td class="num">${ts.checks ? `${ts.score}/${ts.max}` : "–"}</td>
      <td class="num">${u ? `${plural(u, "tier", "tiers")} · −${Math.round(hintCost(ts) * 100)}%` : "–"}</td>
      <td class="num"><b>${ts.checks ? num(finalScore(ts)) : "–"}</b></td>
      <td>${ts.checks ? modePill(ts) : isAssisted(ts) ? modePill(ts) : "–"}</td></tr>`;
  }).join("");
  const table = `<section class="sec" aria-labelledby="tt-h"><h2 id="tt-h" class="sec-title">Tickets</h2><div class="tablewrap"><table><caption class="sr-only">${tab === "thu" ? "Thursday" : "Monday"} tickets with scores</caption>
    <thead><tr><th scope="col">Ticket</th><th scope="col">Skill</th><th scope="col">Result</th><th scope="col" class="num">Raw</th><th scope="col" class="num">Hints</th><th scope="col" class="num">Final</th><th scope="col">Mode</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;

  return `<div class="page-h spread"><div><h1>Shift results</h1><p>Every ticket's grade after hint penalties. You pay for the highest hint tier you opened: nudge −10%, policy clause −25%, exact steps −50%.</p></div>${seg}</div>
    <div class="stack lg">
      <div class="results-sum">${tiles}</div>
      ${consequences(tab)}
      ${table}
      <div class="btns"><a class="btn primary" href="#/report">Readiness report</a>${!thu && tt.done === T.length ? '<button class="btn" data-a="startThursday">Start the Thursday shift</button>' : ""}</div>
    </div>`;
}

function consequences(tab){
  if (S.shift !== "thu") {
    const open = T.filter(t => !S.tickets[t.id].checks).length;
    return `<section class="panel pad stack" aria-labelledby="cq-h"><h2 id="cq-h" style="font-size:var(--fs-lg)">What Monday will cause</h2>
      <p class="muted">Consequences are revealed when the Thursday shift starts. ${CONSEQ.length} of Monday's decisions can come back as incidents or requests.${open ? ` Finish the ${plural(open, "open ticket", "open tickets")} first.` : ""}</p></section>`;
  }
  const items = CONSEQ.map((c, i) => {
    const bad = S.report[i] && S.report[i].bad, L = CONSEQ_LINKS[c.key], mon = TK[L.mon], mts = S.tickets[L.mon];
    const thuT = bad ? TK[L.thu] : null, tts = thuT ? S.tickets[L.thu] : null;
    return `<li class="tl ${bad ? "bad" : "good"}">
      <div class="side-mon"><span class="day-k">Monday · <a class="mono" href="#/queue/${L.mon}" data-a="setViewLink" data-v="mon">${L.mon}</a></span><b>${h(mon.title)}</b>
        <span class="muted">${mts.checks ? `Scored ${num(finalScore(mts))}/${mts.max}` : "Not closed"}</span></div>
      <div class="arrow" aria-hidden="true">→</div>
      <div class="side-thu"><span class="day-k">Thursday · ${bad ? `<a class="mono" href="#/queue/${L.thu}" data-a="setViewLink" data-v="cur">${L.thu}</a>` : "Prevented"}</span>
        ${bad ? `<b><span class="sr-only">Caused: </span>${h(thuT.title)}</b><span>${h(c.cause)}</span><span class="pills">${tts.checks ? `${statusPill(tts.status)}<span class="pill mono">${num(finalScore(tts))}/${tts.max}</span>` : '<span class="pill bad">Open</span>'}</span>`
          : `<span><span class="sr-only">Prevented: </span>${h(c.prevented)}</span>`}</div></li>`;
  });
  const caused = S.report.filter(r => r.bad).length;
  return `<section class="stack" aria-labelledby="cq-h"><div><h2 id="cq-h" style="font-size:var(--fs-lg)">What Monday caused</h2>
    <p class="muted">${caused ? `${plural(caused, "decision", "decisions")} from Monday came back on Thursday. ${S.report.length - caused} were prevented.` : "Nothing you did on Monday came back. Every consequence was prevented."}</p></div>
    <ol class="timeline" style="list-style:none;margin:0;padding:0">${items.sort((a, b) => (b.includes('tl bad') ? 1 : 0) - (a.includes('tl bad') ? 1 : 0)).join("")}</ol></section>`;
}
