// Learner home: where you are in the week, what to do next, and how your skills are trending.
import { S } from "../../engine/store.js";
import { T } from "../../engine/tickets.js";
import { THU_T } from "../../engine/thursday.js";
import { fmtDay } from "../../engine/company.js";
import { G } from "../../engine/grc.js";
import { skillScores, stage, summary, nextTicket } from "../../engine/skills.js";
import { h, num, pct, plural, meter, ui } from "../ui.js";

export function render(){
  const st = stage(), s = summary(), sk = skillScores();
  const cur = S.shift === "thu" ? THU_T : T;
  const next = nextTicket(cur);
  const t = S.shift === "thu" ? s.thu : s.mon;
  const cont = next ? `<a class="btn primary lg" href="#/queue/${next.id}">${S.active === next.id ? "Continue" : "Next"}: ${h(next.title)}</a>` : "";
  let hero;
  if (st === "new") hero = {
    k: "Monday, " + fmtDay(0) + " · 8:00 AM",
    t: "Monday morning. Twenty tickets are waiting.",
    p: "You're the IAM analyst on the Pacific Crest service desk. Open a ticket, start work, make the changes in the Directory, then resolve or reject it. Each ticket is graded on the outcome <i>and</i> the process, and what you do today decides Thursday's queue.",
    a: `<a class="btn primary lg" href="#/queue/${next.id}">Start with ${h(next.id)}</a><a class="btn lg" href="#/policy">Read the runbook first</a>` };
  else if (st === "mon") hero = {
    k: "Monday shift in progress",
    t: `${t.done} of ${T.length} tickets closed`,
    p: `Score so far ${pct(t.pct)}. ${t.n - t.done ? plural(t.n - t.done, "ticket is", "tickets are") + " still open." : ""}`,
    a: `${cont}<a class="btn lg" href="#/queue">Open the queue</a>`, prog: t };
  else if (st === "mon-done") hero = {
    k: "Monday complete",
    t: `You scored ${pct(s.mon.pct)} on Monday.`,
    p: "Your decisions carry forward. Thursday's queue is built from what you did on Monday: anything you missed comes back as an incident.",
    a: `<button class="btn primary lg" data-a="startThursday">Start the Thursday shift</button><a class="btn lg" href="#/results">Review Monday first</a>` };
  else if (st === "thu") hero = {
    k: "Thursday shift in progress",
    t: `${t.done} of ${THU_T.length} Thursday tickets closed`,
    p: s.caused ? `${plural(s.caused, "Monday decision", "Monday decisions")} came back as tickets today.` : "Nothing you did on Monday came back to bite you.",
    a: `${cont}<a class="btn lg" href="#/results">See what Monday caused</a>`, prog: t };
  else hero = {
    k: "Week complete",
    t: `Week score: ${pct(s.weekPct)}`,
    p: "Your readiness report is ready to share. Then try the other side of the desk: audit your own week as the GRC tester.",
    a: `<a class="btn primary lg" href="#/report">View your readiness report</a><a class="btn lg" href="#/grc">Open the audit desk</a>` };

  const day = (name, date, state, body) => `<div class="day ${state}"><span class="dname">${name}</span><span class="muted" style="font-size:14px">${date}</span>${body}</div>`;
  const shiftBody = (x, n) => x.done ? `<span class="big">${pct(x.pct)}</span><span class="muted" style="font-size:14px">${x.done}/${n} closed · ${x.solo} solo · ${x.assisted} assisted</span>` : `<span class="muted" style="font-size:14px">${n} tickets</span>`;
  const week = `<section aria-labelledby="wk"><h2 id="wk" class="sec-title" style="margin-bottom:8px">Your week</h2><div class="week">
    ${day("Monday", fmtDay(0), S.shift !== "thu" ? "current" : "", shiftBody(s.mon, T.length))}
    ${day("Thursday", fmtDay(3), S.shift === "thu" ? "current" : "locked", S.shift === "thu" ? shiftBody(s.thu, THU_T.length) + (s.caused != null ? `<span style="font-size:14px">${s.caused} caused by Monday · ${s.prevented} prevented</span>` : "") : '<span class="muted" style="font-size:14px">Unlocks when every Monday ticket is closed.</span>')}
    ${day("GRC audit", "Q3 fieldwork", s.grc.done ? "" : "locked", s.grc.done ? `<span class="big">${pct(s.grc.pct)}</span><span class="muted" style="font-size:14px">${s.grc.done}/${G.length} tasks submitted</span>` : `<span class="muted" style="font-size:14px">${G.length} audit tasks. Task 4 needs 10 closed Monday tickets.</span> <a href="#/grc" style="font-size:14px">Open the audit desk</a>`)}
  </div></section>`;

  const tried = sk.filter(x => x.n);
  const weak = tried.slice().sort((a, b) => a.pct - b.pct).filter(x => x.pct < 85).slice(0, 2);
  const skills = `<section class="panel pad stack" aria-labelledby="sk"><div class="spread"><h2 id="sk" style="font-size:var(--fs-lg)">Skills</h2><a href="#/report" style="font-size:14px">Readiness report</a></div>
    ${tried.length ? "" : '<p class="muted" style="font-size:14px">Close a ticket to start building your profile.</p>'}
    <div>${sk.map(x => `<div class="skill"><span class="name">${h(x.label)}</span><span class="val">${x.n ? pct(x.pct) : '<span class="muted">–</span>'}</span>${meter(x.pct, x.label)}</div>`).join("")}</div>
    ${weak.length ? `<div class="callout warn"><h4>Work on next</h4>${weak.map(x => `<div><b>${h(x.label)}</b>: ${h(x.blurb)}</div>`).join("")}</div>` : ""}
    ${s.solo + s.assisted ? `<p class="muted" style="font-size:14px">${s.solo} solo · ${s.assisted} assisted · ${plural(s.hints, "hint", "hints")} used</p>` : ""}
  </section>`;

  const reset = `<section class="panel pad stack" aria-labelledby="rs"><h2 id="rs" style="font-size:var(--fs-md)">Start over</h2>
    <p class="muted" style="font-size:14px">Resets the IAM week and the GRC desk. Progress is saved in this browser only.</p>
    ${ui.confirmReset ? `<div class="confirmbox" role="group" aria-label="Confirm reset"><b>Erase all progress?</b> This can't be undone.<div class="btns"><button class="btn danger" data-a="resetYes">Erase and start over</button><button class="btn" data-a="resetNo">Keep my progress</button></div></div>`
      : `<div><button class="btn" data-a="resetAsk">Reset progress…</button></div>`}</section>`;

  return `<div class="home-grid">
    <div class="stack lg">
      <section class="panel pad hero-card"><span class="eyebrow">${h(hero.k)}</span><h1 style="font-size:var(--fs-2xl)">${hero.t}</h1><p class="lead">${hero.p}</p>
        ${hero.prog ? `<div class="progress-line">${meter(Math.round(hero.prog.done / hero.prog.n * 100), "Tickets closed", true)}</div>` : ""}
        <div class="btns">${hero.a}</div></section>
      ${week}
    </div>
    <div class="stack lg">${skills}${reset}</div>
  </div>`;
}
