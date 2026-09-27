// App shell: hash router, navigation, focus management, event delegation.
import { S } from "../engine/store.js";
import { fmtDay } from "../engine/company.js";
import { init, clockStr, totals } from "../engine/state.js";
import { curTickets } from "../engine/thursday.js";
import { TK } from "../engine/tickets.js";
import { G, gTotals } from "../engine/grc.js";
import { h, num, pct, ui } from "./ui.js";
import { actions } from "./actions.js";
import * as queue from "./views/queue.js";
import * as reference from "./views/reference.js";
const soon = { render: () => `<div class="page-h"><h1>Coming soon</h1><p>This page is being built.</p></div>` };
 const home = soon; const directory = soon; const results = soon; const report = soon;
import * as grc from "./views/grc.js";

const VIEWS = {
  home: { view: home, title: "Home" },
  queue: { view: queue, title: "Ticket queue" },
  directory: { view: directory, title: "Directory" },
  policy: { view: reference, title: "Policy & matrix" },
  hr: { view: reference, title: "HR feed" },
  log: { view: reference, title: "Audit log" },
  results: { view: results, title: "Shift results" },
  report: { view: report, title: "Readiness report" },
  grc: { view: grc, title: "GRC audit desk" },
};

export function route(){
  const parts = location.hash.replace(/^#\/?/, "").split("?")[0].split("/").filter(Boolean).map(decodeURIComponent);
  const name = VIEWS[parts[0]] ? parts[0] : "home";
  return { name, id: parts[1] || null };
}
export const go = hash => { if (location.hash !== hash) location.hash = hash; else render(); };

function navItems(){
  const open = curTickets(ui.view).filter(t => !S.tickets[t.id].checks).length;
  const gt = gTotals();
  return [
    { k: "home", label: "Home" },
    { grp: "Shift" },
    { k: "queue", label: "Ticket queue", n: open },
    { k: "directory", label: "Directory" },
    { k: "policy", label: "Policy & matrix" },
    { k: "hr", label: "HR feed" },
    { k: "log", label: "Audit log", n: S.log.length },
    { grp: "Progress" },
    { k: "results", label: "Shift results" },
    { k: "report", label: "Readiness report" },
    { grp: "GRC track" },
    { k: "grc", label: "Audit desk", n: G.length - gt.done },
  ];
}

function shell(r){
  const items = navItems();
  const link = (it, cls = "") => `<a href="#/${it.k}" ${r.name === it.k ? 'aria-current="page"' : ""} class="${cls}">${h(it.label)}${it.n != null && it.n !== "" ? `<span class="n" aria-label="(${it.n})">${it.n}</span>` : ""}</a>`;
  const isG = r.name === "grc";
  const tt = isG ? gTotals() : totals(curTickets(ui.view));
  const isThu = S.shift === "thu" && ui.view !== "mon";
  const ctx = isG ? ["Internal Audit · Q3 SOX ITGC", "Fieldwork week of " + fmtDay(0)]
    : [`Pacific Crest Logistics · ${isThu ? "Thursday" : "Monday"} shift`, `${isThu ? "Thursday, " + fmtDay(3) : "Monday, " + fmtDay(0)} · ${clockStr()}`];
  const nTotal = isG ? G.length : curTickets(ui.view).length;
  return {
    side: `<a class="brand" href="#/home"><span class="dot" aria-hidden="true"></span>ShiftReady</a>
      <div class="org"><b>Pacific Crest Logistics</b>IAM analyst · service desk</div>
      <nav class="nav" aria-label="App">${items.map(it => it.grp ? `<div class="navgrp" aria-hidden="true">${it.grp}</div>` : link(it)).join("")}</nav>
      <div class="foot"><a href="/">← ShiftReady site</a></div>`,
    top: `<div class="topbar-in">
        <div class="shiftctx"><span class="k">${h(ctx[0])}</span><span class="v">${h(ctx[1])}</span></div>
        <div class="stats" aria-label="${isG ? "Audit" : "Shift"} progress">
          <div class="stat"><b>${tt.done}/${nTotal}</b><span>${isG ? "Submitted" : "Closed"}</span></div>
          <div class="stat"><b>${num(tt.sc)}</b><span>Points</span></div>
          <div class="stat"><b>${pct(tt.pct)}</b><span>Score</span></div>
        </div></div>
      <div class="mnav"><nav aria-label="App">${items.filter(it => !it.grp).map(it => link(it)).join("")}</nav></div>`,
  };
}

function activeBar(r){
  const bar = document.getElementById("activebar");
  const t = S.active && S.tickets[S.active] && S.tickets[S.active].status === "working" ? TK[S.active] : null;
  const onIt = t && r.name === "queue" && r.id === t.id;
  if (!t || onIt) { bar.hidden = true; bar.innerHTML = ""; document.documentElement.style.setProperty("--bar-h", "0px"); return; }
  bar.hidden = false;
  bar.innerHTML = `<div class="activebar-in"><div><div class="lbl">Active ticket · <span class="mono">${t.id}</span></div><div class="tt">${h(t.title)}</div></div>
    <a class="btn primary" href="#/queue/${t.id}">Back to ticket</a></div>`;
  document.documentElement.style.setProperty("--bar-h", bar.offsetHeight + "px");
}

// ---------- Focus management ----------
// Re-rendering replaces the DOM; restore focus to the equivalent element afterwards.
function focusKey(el){
  if (!el || el === document.body) return null;
  if (el.id) return { id: el.id };
  const attrs = [...el.attributes].filter(a => a.name.startsWith("data-") || a.name === "href" || a.name === "name" || a.name === "value").map(a => a.name + "=" + a.value).join("&");
  return attrs ? { tag: el.tagName, attrs, text: el.textContent.trim().slice(0, 40) } : null;
}
function restoreFocus(key, sel){
  if (!key) return;
  let el = key.id ? document.getElementById(key.id) : null;
  if (!el && key.tag) el = [...document.querySelectorAll(key.tag)].find(x => focusKey(x)?.attrs === key.attrs && x.textContent.trim().slice(0, 40) === key.text)
    || [...document.querySelectorAll(key.tag)].find(x => focusKey(x)?.attrs === key.attrs);
  if (el) { el.focus({ preventScroll: true }); if (sel && el.setSelectionRange) try { el.setSelectionRange(sel[0], sel[1]); } catch (e) {} }
}

let lastRoute = "";
export function render(){
  const r = route();
  const routeKey = r.name + "/" + (r.id || "");
  const routeChanged = routeKey !== lastRoute;
  const panelChanged = routeChanged && lastRoute.split("/")[0] === r.name; // same page, different item
  lastRoute = routeKey;
  const a = document.activeElement, key = routeChanged ? null : focusKey(a);
  const sel = a && typeof a.selectionStart === "number" ? [a.selectionStart, a.selectionEnd] : null;
  const s = shell(r);
  document.getElementById("side").innerHTML = s.side;
  document.getElementById("topbar").innerHTML = s.top;
  const V = VIEWS[r.name];
  document.getElementById("main").innerHTML = V.view.render(r);
  document.title = `${V.title} · ShiftReady`;
  activeBar(r);
  if (V.view.after) V.view.after(r);
  if (routeChanged) {
    // Move focus to the new content so keyboard and screen reader users land in the right place.
    const target = (panelChanged && document.querySelector("[data-panel-focus]")) || document.querySelector("#main h1");
    if (target) { target.setAttribute("tabindex", "-1"); target.focus({ preventScroll: true }); }
    if (!panelChanged || innerWidth < 960) scrollTo({ top: 0 });
    const cur = document.querySelector(".mnav [aria-current=page]");
    if (cur) cur.scrollIntoView({ block: "nearest", inline: "center" });
  } else restoreFocus(key, sel);
}

// ---------- Events ----------
document.addEventListener("click", e => {
  const el = e.target.closest("[data-a]");
  if (!el || el.getAttribute("aria-disabled") === "true") return;
  const fn = actions[el.dataset.a];
  if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener("submit", e => {
  const fn = actions[e.target.dataset.submit];
  if (fn) { e.preventDefault(); fn(e.target, e); }
});
document.addEventListener("input", e => { const fn = actions[e.target.dataset.input]; if (fn) fn(e.target, e); });
document.addEventListener("change", e => { const fn = actions[e.target.dataset.change]; if (fn) fn(e.target, e); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && actions.escape) actions.escape(e); });
addEventListener("hashchange", () => { ui.hintConfirm = null; ui.closeError = null; render(); });
addEventListener("storage", e => { if (e.key === "pcl-iam-sim-v1") { init(); render(); } });

init();
render();
