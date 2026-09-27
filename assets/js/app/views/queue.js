// Ticket queue: list, ticket detail with tiered hints, and the tutor panel.
import { S, U } from "../../engine/store.js";
import { T, TK } from "../../engine/tickets.js";
import { CONSEQ, curTickets } from "../../engine/thursday.js";
import { HINT_TIERS, hintsUsed, hintCost, finalScore, isAssisted } from "../../engine/state.js";
import { HINTS, CONSEQ_LINKS, hintSteps } from "../../engine/hints.js";
import { POLICY } from "../../engine/policy.js";
import { h, num, ui, statusPill, modePill, scorePill, userPills, checksHtml, plural } from "../ui.js";
import { matrixTable, sodTable } from "./reference.js";
import { panel as tutorPanel } from "./tutor.js";

export const tutorIsOpen = () => ui.tutorOpen ?? innerWidth >= 1400;

export function render(r){
  const list = curTickets(ui.view);
  const sel = r.id && TK[r.id] && S.tickets[r.id] ? r.id : null;
  const isThuShift = S.shift === "thu";
  const closedN = list.filter(t => S.tickets[t.id].checks).length;
  const shown = list.filter(t => ui.qfilter === "all" || (ui.qfilter === "closed") === !!S.tickets[t.id].checks)
    .sort((a, b) => (S.tickets[a.id].checks ? 1 : 0) - (S.tickets[b.id].checks ? 1 : 0) || a.pri - b.pri);
  const toggle = isThuShift ? `<div class="segmented" role="group" aria-label="Which shift"><button data-a="setView" data-v="cur" aria-pressed="${ui.view !== "mon"}">Thursday</button><button data-a="setView" data-v="mon" aria-pressed="${ui.view === "mon"}">Monday (review)</button></div>` : "";
  const done = closedN === list.length;
  let banner = "";
  if (done && !isThuShift) banner = `<div class="callout acc spread" style="margin-bottom:16px"><span><b>Monday complete.</b> Thursday's queue is built from what you did today.</span><span class="btns"><a class="btn" href="#/results">Review results</a><button class="btn primary" data-a="startThursday">Start Thursday</button></span></div>`;
  else if (done && ui.view !== "mon") banner = `<div class="callout acc spread" style="margin-bottom:16px"><span><b>Thursday complete.</b> Your readiness report is ready.</span><span class="btns"><a class="btn" href="#/results">Shift results</a><a class="btn primary" href="#/report">Readiness report</a></span></div>`;
  const tOpen = sel && tutorIsOpen();

  const items = shown.map(t => { const ts = S.tickets[t.id]; return `<a class="tk ${ts.checks ? "done" : ""}" href="#/queue/${t.id}" ${sel === t.id ? 'aria-current="page"' : ""}>
      <span class="pri p${t.pri}" title="Priority ${t.pri}">P${t.pri}</span>
      <span><span class="t" style="display:block">${h(t.title)}</span><span class="s" style="display:block"><span class="mono">${t.id}</span> · ${h(t.from)}</span></span>
      <span class="pills">${ts.status === "new" ? "" : statusPill(ts.status)}${scorePill(ts)}${modePill(ts)}${!ts.checks && hintsUsed(ts) && !isAssisted(ts) ? `<span class="pill">${plural(hintsUsed(ts), "hint", "hints")}</span>` : ""}</span></a>`; }).join("");

  return `<div class="page-h spread"><div><h1>${ui.view === "mon" && isThuShift ? "Monday queue (review)" : isThuShift ? "Thursday queue" : "Monday queue"}</h1>
      <p>${closedN} of ${list.length} closed. Work the P1s first. Start a ticket before changing accounts, so the audit log ties your changes to it.</p></div>${toggle}</div>
    ${banner}
    <div class="queue ${sel ? "has-detail" : ""} ${tOpen ? "tutor-open" : ""}">
      <div class="qlist">
        <div class="qfilters" role="group" aria-label="Filter tickets">${[["open", "Open", list.length - closedN], ["closed", "Closed", closedN], ["all", "All", list.length]].map(([k, l, n]) => `<button data-a="qfilter" data-v="${k}" aria-pressed="${ui.qfilter === k}">${l} <span class="mono">${n}</span></button>`).join("")}</div>
        <nav aria-label="Tickets" class="stack" style="gap:8px">${items || `<div class="panel empty"><p>${ui.qfilter === "open" ? "No open tickets. Nice work." : "No closed tickets yet."}</p></div>`}</nav>
      </div>
      <div class="qdetail">${sel ? ticket(sel) : `<div class="panel empty"><h2>Pick a ticket</h2><p>Priority 1 tickets are the most urgent. Open one to read it and start work.</p></div>`}</div>
      ${tOpen ? `<div class="tutor-dock" id="tutor-dock">${tutorPanel(sel)}</div>` : ""}
    </div>`;
}

export function after(){
  const log = document.getElementById("tutor-log");
  if (log) log.scrollTop = log.scrollHeight;
}

function consequenceNote(id){
  const key = Object.keys(CONSEQ_LINKS).find(k => CONSEQ_LINKS[k].thu === id);
  if (!key || !(S.thu || []).some(x => x.key === key)) return "";
  const c = CONSEQ.find(x => x.key === key);
  return `<div class="callout bad"><h4>Caused by your Monday shift</h4>${h(c.cause)} <a href="#/queue/${CONSEQ_LINKS[key].mon}" data-a="setViewLink" data-v="mon">See the Monday ticket</a></div>`;
}

function ticket(id){
  const t = TK[id], ts = S.tickets[id], active = S.active === id, closed = !!ts.checks;
  let s = `<article class="panel pad ticket" aria-labelledby="t-h">
    <a class="backlink" href="#/queue">← All tickets</a>
    <div class="ticket-h">
      <div class="spread"><div class="row-inline"><span class="pri p${t.pri}">P${t.pri}</span><span class="mono muted">${t.id}</span>${statusPill(ts.status)}${modePill(ts)}</div>
        ${tutorIsOpen() ? "" : `<button class="btn sm" data-a="tutorToggle" aria-expanded="false" aria-controls="tutor-dock">Ask the tutor</button>`}</div>
      <h2 id="t-h" data-panel-focus>${h(t.title)}</h2>
      <div class="meta"><span>${t.type}</span><span>From: ${h(t.from)}</span><span>Via: ${h(t.channel)}</span><span>Opened ${t.opened}</span></div>
    </div>
    ${consequenceNote(id)}
    <div class="body-text">${t.body}</div>`;
  if (t.caller) s += `<div class="callout"><h4>Caller-provided identity details</h4>Employee ID: <span class="mono">${t.caller.empId}</span> · Manager named: ${h(t.caller.mgr)}<div class="muted" style="font-size:12px;margin-top:4px">Policy: compare both against the directory before any credential change.</div></div>`;
  if (t.users.length) s += `<section class="sec"><h3>Related accounts</h3><div class="btns">${t.users.map(u => `<a class="btn" href="#/directory/${encodeURIComponent(u)}">${h(U(u).name)} <span class="pills">${userPills(U(u))}</span> <span aria-hidden="true">→</span></a>`).join("")}</div></section>`;

  if (closed) s += grade(id);
  else if (ts.status === "new") s += `<section class="sec"><div class="btns"><button class="btn primary lg" data-a="start" data-tid="${id}">Start work</button></div>
      <p class="muted" style="font-size:14px">Starting makes this your active ticket. Changes you make in the Directory are logged against it.</p></section>`;
  else if (!active) s += `<div class="callout warn spread"><span>Another ticket is active. Make this one active before you work on it, so your changes are logged against it.</span><button class="btn" data-a="resume" data-tid="${id}">Make this the active ticket</button></div>`;
  else s += working(id);

  s += hints(id);
  return s + `</article>`;
}

function working(id){
  const t = TK[id], ts = S.tickets[id];
  return `<section class="sec" aria-labelledby="ta-h"><h3 id="ta-h">Ticket actions</h3>
      <div class="btns">${t.caller ? `<button class="btn" data-a="verify" data-tid="${id}">Mark identity verified</button>` : ""}<button class="btn" data-a="approval" data-tid="${id}">Request manager approval</button></div>
      ${ts.approval ? `<div class="callout"><h4>Approval response</h4>${h(ts.approval)}</div>` : ""}
      <div class="control-row"><div class="field" style="flex:0 1 240px"><label for="esc-${id}">Escalate to</label><select id="esc-${id}"><option>Security team</option><option>Account owner</option><option>Requester's manager</option></select></div><button class="btn" data-a="escalate" data-tid="${id}">Escalate</button></div>
      ${ts.esc.length ? `<p class="muted" style="font-size:14px">Escalated to: ${ts.esc.map(h).join(", ")}</p>` : ""}
    </section>
    <section class="sec" aria-labelledby="ct-h"><h3 id="ct-h">Close ticket</h3>
      ${t.question ? `<div class="field"><label for="ans-${id}">Answer for the auditor</label><input type="text" id="ans-${id}" value="${h(ts.answer || "")}" aria-describedby="ans-help-${id}"><span class="help" id="ans-help-${id}">Usernames (first.last) separated by commas, or "none".</span></div>` : ""}
      <div class="field"><label for="note-${id}">Resolution notes <span class="muted">(optional)</span></label><textarea id="note-${id}" placeholder="What you did and why">${h(ts.note || "")}</textarea></div>
      ${ui.closeError ? `<div class="callout bad" role="alert">${h(ui.closeError)}</div>` : ""}
      <div class="btns"><button class="btn primary" data-a="close" data-kind="resolve" data-tid="${id}">Resolve</button><button class="btn danger" data-a="close" data-kind="reject" data-tid="${id}">Reject</button></div>
      <p class="muted" style="font-size:14px">Reject when the request shouldn't be fulfilled. Closing grades the ticket, and it can't be reopened.</p>
    </section>`;
}

function grade(id){
  const t = TK[id], ts = S.tickets[id], f = finalScore(ts), used = hintsUsed(ts);
  const math = used ? `Raw ${ts.score}/${ts.max} − ${Math.round(hintCost(ts) * 100)}% for the ${HINT_TIERS[used - 1].label.toLowerCase()} hint = ${num(f)}` : "No hints used";
  return `<section class="sec" aria-labelledby="grade-h"><h3 id="grade-h" tabindex="-1">Grade</h3>
      <div class="scoreline"><span class="scorebig">${num(f)}/${ts.max}</span>${modePill(ts)}<span class="scoremath">${math}</span></div>
      ${checksHtml(ts.checks)}</section>
    <div class="lesson"><b>Takeaway.</b> ${h(t.lesson)}</div>
    ${ts.answer ? `<div class="callout"><h4>Your answer</h4>${h(ts.answer)}</div>` : ""}
    ${ts.note ? `<div class="callout"><h4>Your notes</h4>${h(ts.note)}</div>` : ""}`;
}

function clauseHtml(c){
  let out = (c.keys || []).map(k => `<blockquote><b>${h(POLICY[k].title)}.</b> ${POLICY[k].html} <a href="#/policy?c=${k}">In the runbook</a></blockquote>`).join("");
  if (c.note) out += `<p style="margin-top:8px">${h(c.note)}</p>`;
  if (c.matrix) out += `<div style="margin-top:8px">${matrixTable(c.matrix)}</div>`;
  if (c.sod) out += `<div style="margin-top:8px">${sodTable()}</div>`;
  return out;
}
function tierBody(id, i){
  const H = HINTS[id];
  if (i === 0) return `<p>${H.nudge}</p>`;
  if (i === 1) return clauseHtml(H.clause);
  return `<ol>${hintSteps(id).map(x => `<li>${x}</li>`).join("")}</ol>`;
}

function hints(id){
  const H = HINTS[id], ts = S.tickets[id];
  if (!H) return "";
  const used = hintsUsed(ts), closed = !!ts.checks;
  const shownN = closed ? Math.max(used, ui.freeHints[id] || 0) : used;
  const revealed = HINT_TIERS.slice(0, shownN).map((tier, i) => `<div class="hint" id="hint-${id}-${i}" tabindex="-1"><div class="ht">${tier.label}${i < used ? `<span class="pill ${i === 2 ? "warn" : ""}">${closed ? "Used" : "−" + Math.round(tier.cost * 100) + "%"}</span>` : '<span class="pill ok">Free review</span>'}</div>${tierBody(id, i)}</div>`).join("");
  const next = HINT_TIERS[shownN];
  let control = "";
  if (next && closed) control = `<div><button class="btn sm" data-a="hintFree" data-tid="${id}">Show ${next.label.toLowerCase()} (free now)</button></div>`;
  else if (next && ui.hintConfirm === id) {
    const extra = shownN === 2 ? ` instead of ${Math.round(HINT_TIERS[1].cost * 100)}%, and the ticket will be marked <b>Assisted</b>` : shownN === 1 ? ` instead of ${Math.round(HINT_TIERS[0].cost * 100)}%` : "";
    control = `<div class="confirmbox" role="group" aria-labelledby="hc-${id}"><span id="hc-${id}">Show the ${next.label.toLowerCase()}? This ticket's score will be reduced by <b>${Math.round(next.cost * 100)}%</b>${extra}.</span>
      <div class="btns"><button class="btn primary sm" data-a="hintYes" data-tid="${id}" id="hint-yes">Show ${next.label.toLowerCase()}</button><button class="btn sm" data-a="hintNo" data-tid="${id}">Cancel</button></div></div>`;
  } else if (next) control = `<div><button class="btn sm" data-a="hintAsk" data-tid="${id}">Show ${next.label.toLowerCase()} <span class="muted">(−${Math.round(next.cost * 100)}%)</span></button></div>`;
  return `<section class="hints" aria-labelledby="hints-h-${id}">
    <div class="hints-h"><h3 id="hints-h-${id}">Hints</h3><span class="muted" style="font-size:12px">${closed ? (used ? `${plural(used, "tier", "tiers")} used before closing` : "Solved without hints") : "You lose the % of the highest tier you open. Exact steps marks the ticket Assisted."}</span></div>
    ${revealed}${control}
  </section>`;
}
