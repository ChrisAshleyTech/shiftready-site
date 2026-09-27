// Reference pages: runbook policy and access matrix, HR feed, audit log.
import { S } from "../../engine/store.js";
import { ROLES, SOD, HR_FEED, fmtDay } from "../../engine/company.js";
import { POLICIES } from "../../engine/policy.js";
import { h, plural } from "../ui.js";

const hashQuery = () => new URLSearchParams(location.hash.split("?")[1] || "");

export function render(r){
  if (r.name === "policy") return policy();
  if (r.name === "hr") return hr();
  return log();
}
export function after(r){
  if (r.name !== "policy") return;
  const c = hashQuery().get("c");
  const el = c && document.getElementById("pol-" + c);
  if (el) { el.classList.add("hl"); el.scrollIntoView({ block: "center" }); }
}

export const matrixTable = keys => `<div class="tablewrap"><table><caption class="sr-only">Access matrix: birthright groups by role</caption><thead><tr><th scope="col">Department / title</th><th scope="col">Birthright groups</th></tr></thead><tbody>${keys.map(k=>`<tr><th scope="row" style="font-weight:500;white-space:nowrap">${h(k.replace("|"," / "))}</th><td class="mono">${ROLES[k].join(", ")}</td></tr>`).join("")}</tbody></table></div>`;
export const sodTable = () => `<div class="tablewrap"><table><caption class="sr-only">Separation of duties conflicts</caption><thead><tr><th scope="col">Conflicting pair</th><th scope="col">Risk</th></tr></thead><tbody>${SOD.map(([a,b,r])=>`<tr><td class="mono">${a} + ${b}</td><td>${h(r)}</td></tr>`).join("")}</tbody></table></div>`;

function policy(){
  return `<div class="page-h"><h1>Policy &amp; access matrix</h1><p>The runbook every ticket is graded against. Check it before you guess.</p></div>
  <div class="stack lg">
    <section class="panel pad" aria-labelledby="rb"><h2 id="rb" class="sec-title" style="margin-bottom:12px">Runbook policies</h2>
      <ol class="policy">${POLICIES.map(p=>`<li id="pol-${p.key}"><b>${h(p.title)}.</b> ${p.html}</li>`).join("")}</ol></section>
    <section class="sec" aria-labelledby="am"><h2 id="am" class="sec-title">Access matrix (role-based)</h2>${matrixTable(Object.keys(ROLES))}</section>
    <section class="sec" aria-labelledby="sd"><h2 id="sd" class="sec-title">Separation-of-duties rules</h2>${sodTable()}</section>
  </div>`;
}

function hr(){
  const rows = (S.shift==="thu"?[{type:"Return from leave",who:"Rachel Adams",detail:"Leave ended early. Returns today.",when:3}]:[]).concat(HR_FEED);
  return `<div class="page-h"><h1>HR feed</h1><p>Workday is the source of truth for joiners, movers and leavers. When a ticket and HR disagree, HR wins.</p></div>
  <div class="tablewrap"><table><caption class="sr-only">HR events</caption><thead><tr><th scope="col">Date</th><th scope="col">Event</th><th scope="col">Worker</th><th scope="col">Details</th></tr></thead><tbody>
    ${rows.map(e=>`<tr><td class="mono" style="white-space:nowrap">${fmtDay(e.when)}</td><td><span class="pill ${e.type==="Termination"?"bad":e.type.includes("ire")?"ok":"acc"}">${h(e.type)}</span></td><td style="white-space:nowrap">${h(e.who)}</td><td>${h(e.detail)}</td></tr>`).join("")}
  </tbody></table></div>`;
}

function log(){
  const noTicket = S.log.filter(e => !e.ticket).length;
  const rows = S.log.slice().reverse().map(e=>`<tr><td class="mono num">${e.n}</td><td class="mono" style="white-space:nowrap">${e.t}</td><td class="mono">${e.ticket?`<a href="#/queue/${e.ticket}">${e.ticket}</a>`:'<span class="pill bad">No ticket</span>'}</td><td>${e.target?`<a class="mono" href="#/directory/${encodeURIComponent(e.target)}">${h(e.target)}</a>`:"–"}</td><td>${h(e.d)}</td></tr>`).join("");
  return `<div class="page-h"><h1>Audit log</h1><p>Every change is recorded with the ticket it was made under. Auditors sample this, and so will you on the GRC desk.</p></div>
  ${noTicket?`<div class="callout warn" style="margin-bottom:16px"><b>${plural(noTicket,"change has","changes have")} no ticket.</b> Changes made without an active ticket are exceptions under control APD-03.</div>`:""}
  ${S.log.length?`<div class="tablewrap"><table><caption class="sr-only">Audit log, newest first</caption><thead><tr><th scope="col" class="num">#</th><th scope="col">Time</th><th scope="col">Ticket</th><th scope="col">Account</th><th scope="col">Change</th></tr></thead><tbody>${rows}</tbody></table></div>`
  :`<div class="panel empty"><h2>No changes yet</h2><p>Start a ticket in the <a href="#/queue">queue</a>. Every change you make appears here.</p></div>`}`;
}
