// Event handlers, keyed by data-a / data-submit / data-input / data-change names.
import { S, U } from "../engine/store.js";
import { act, tact, closeTicket, revealHint, resetAll, finalScore, isAssisted, save } from "../engine/state.js";
import { startThursday as engineStartThursday, THU_T } from "../engine/thursday.js";
import { TK } from "../engine/tickets.js";
import { GK, gCollect, gSubmit } from "../engine/grc.js";
import { ui, toast, num, plural } from "./ui.js";
import { render, go } from "./main.js";
const tutorAsk = () => {};
const tutorIsOpen = () => false;
const saveName = () => {};

const val = id => (document.getElementById(id) || {}).value;
const focusSoon = sel => requestAnimationFrame(() => { const el = document.querySelector(sel); if (el) { if (!el.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) el.setAttribute("tabindex", "-1"); el.focus(); el.scrollIntoView({ block: "nearest" }); } });
const noTicket = () => (S.active ? "" : " No active ticket, so this change isn't tied to one.");

function doAct(op, uid, arg){
  const d = act(op, uid, arg);
  render();
  if (d === null) return;
  const name = U(uid).name;
  // Reversible changes get an undo. It applies the opposite change, so the audit log stays honest.
  if (op === "disable") toast(`${name}: account disabled.${noTicket()}`, { label: "Undo", run: () => { act("enable", uid); render(); toast(`${name}: re-enabled. Both changes are in the audit log.`); } });
  else if (op === "rmgrp") toast(`${name}: removed from ${arg}.${noTicket()}`, { label: "Undo", run: () => { act("addgrp", uid, arg); render(); toast(`${name}: added back to ${arg}. Both changes are in the audit log.`); } });
  else toast(`${name}: ${d.charAt(0).toLowerCase() + d.slice(1)}.${noTicket()}`);
}

export const actions = {
  // ----- Queue -----
  start: el => { tact("start", el.dataset.tid); render(); focusSoon("#ta-h"); },
  resume: el => { tact("resume", el.dataset.tid); render(); focusSoon("#ta-h"); },
  verify: el => { toast(tact("verify", el.dataset.tid)); render(); },
  approval: el => { tact("approval", el.dataset.tid); render(); toast("Approval requested. The reply is on the ticket."); },
  escalate: el => { const tid = el.dataset.tid; toast(tact("escalate", tid, val("esc-" + tid))); render(); },
  close: el => {
    const tid = el.dataset.tid, t = TK[tid];
    const err = closeTicket(tid, el.dataset.kind, { note: val("note-" + tid), answer: t.question ? val("ans-" + tid) : undefined });
    ui.closeError = err;
    render();
    if (err) { focusSoon(t.question ? "#ans-" + tid : "[role=alert]"); return; }
    const ts = S.tickets[tid];
    toast(`${tid} ${ts.status}: ${num(finalScore(ts))}/${ts.max}${isAssisted(ts) ? " · Assisted" : ""}.`);
    focusSoon("#grade-h");
  },
  qfilter: el => { ui.qfilter = el.dataset.v; render(); },
  setView: el => { ui.view = el.dataset.v; render(); },
  setViewLink: el => { ui.view = el.dataset.v; go(el.getAttribute("href")); },
  startThursday: () => {
    engineStartThursday(); ui.view = "cur"; ui.qfilter = "open";
    const caused = S.report.filter(r => r.bad).length;
    go("#/queue");
    toast(`Thursday, 8:00 AM. ${caused ? plural(caused, "Monday decision", "Monday decisions") + " came back as tickets." : "Nothing from Monday came back."} ${THU_T.length} tickets waiting.`);
  },
  // ----- Hints -----
  hintAsk: el => { ui.hintConfirm = el.dataset.tid; render(); focusSoon("#hint-yes"); },
  hintNo: el => { ui.hintConfirm = null; render(); focusSoon(`[data-a=hintAsk][data-tid="${el.dataset.tid}"]`); },
  hintYes: el => {
    const tid = el.dataset.tid; ui.hintConfirm = null; revealHint(tid); render();
    focusSoon(`#hint-${tid}-${S.tickets[tid].hints - 1}`);
  },
  hintFree: el => { const tid = el.dataset.tid; const n = Math.max(S.tickets[tid].hints || 0, ui.freeHints[tid] || 0) + 1; ui.freeHints[tid] = n; render(); focusSoon(`#hint-${tid}-${n - 1}`); },
  // ----- Tutor -----
  tutorToggle: () => { ui.tutorOpen = !tutorIsOpen(); render(); if (ui.tutorOpen) focusSoon("#tutor-in"); else focusSoon("[data-a=tutorToggle]"); },
  tutorAsk: el => { tutorAsk(el.dataset.tid, el.dataset.q, el.textContent.trim()); render(); },
  tutorSubmit: form => { const inp = form.querySelector("input"), q = inp.value.trim(); if (!q) return; tutorAsk(form.dataset.tid, q); inp.value = ""; render(); focusSoon("#tutor-in"); },
  escape: () => {
    if (ui.hintConfirm) { ui.hintConfirm = null; render(); return; }
    if (tutorIsOpen() && innerWidth < 1400 && document.getElementById("tutor-dock")) { ui.tutorOpen = false; render(); focusSoon("[data-a=tutorToggle]"); }
  },
  // ----- Directory -----
  act: el => doAct(el.dataset.op, el.dataset.uid),
  rmgrp: el => doAct("rmgrp", el.dataset.uid, el.dataset.g),
  addgrp: el => doAct("addgrp", el.dataset.uid, val("addg")),
  job: el => doAct("job", el.dataset.uid, val("job")),
  expiry: el => { const v = val("exp"); if (v === "" || v == null) { toast("Enter a number of days first (0 removes the expiry)."); focusSoon("#exp"); return; } doAct("expiry", el.dataset.uid, v); },
  dirQ: el => { ui.dirQ = el.value; render(); },
  dirDept: el => { ui.dirDept = el.value; render(); },
  dirStatus: el => { ui.dirStatus = el.value; render(); },
  dirClear: () => { ui.dirQ = ""; ui.dirDept = "All"; ui.dirStatus = "all"; render(); focusSoon("#dir-q"); },
  dirSort: el => { const k = el.dataset.k; ui.dirSort = { key: k, dir: ui.dirSort.key === k ? -ui.dirSort.dir : 1 }; render(); },
  // ----- Home -----
  resetAsk: () => { ui.confirmReset = true; render(); focusSoon("[data-a=resetNo]"); },
  resetNo: () => { ui.confirmReset = false; render(); focusSoon("[data-a=resetAsk]"); },
  resetYes: () => { resetAll(); Object.assign(ui, { confirmReset: false, view: "cur", tutor: {}, freeHints: {}, qfilter: "open" }); go("#/home"); toast("Progress erased. Monday starts again."); },
  // ----- GRC -----
  grcDraft: el => { const g = GK[el.dataset.gid], gs = S.grc[g.id] || (S.grc[g.id] = {}); gs.draft = gCollect(g, gs, el.form || document); save(); },
  grcSubmit: form => {
    const id = form.dataset.gid, g = GK[id], gs = S.grc[id] || (S.grc[id] = {});
    const err = gSubmit(id, gCollect(g, gs, form));
    if (err) { form.querySelector(`#gerr-${id}`).innerHTML = `<div class="callout bad">${err}.</div>`; return; }
    render(); focusSoon("#gt-h"); toast(`Workpaper submitted: ${S.grc[id].score}/${S.grc[id].max}.`);
  },
  grcRetry: el => { S.grc[el.dataset.gid] = {}; save(); render(); },
  grcRefresh: el => { const gs = S.grc[el.dataset.gid]; delete gs.frozen; delete gs.draft; save(); render(); toast("Snapshot refreshed from your current log."); },
  // ----- Report -----
  reportName: el => { saveName(el.value); render(); },
  selectAll: el => el.select(),
  copyReport: async () => {
    const url = val("rp-url");
    try { await navigator.clipboard.writeText(url); toast("Link copied."); }
    catch (e) { const el = document.getElementById("rp-url"); el.focus(); el.select(); toast("Couldn't copy automatically. The link is selected, so press Ctrl+C (or ⌘C)."); }
  },
  print: () => print(),
};
