// Behavioural tests.
// 1. Engine: doing what each ticket's exact-steps hint says earns full raw marks, a clean
//    Monday fires no consequences, and a careless Monday's consequences can each be fixed.
// 2. UI: click through the real app in an iframe (hints, penalties, Solo/Assisted, undo,
//    Thursday, results, report link round trip).
import { S, setState, U } from "../assets/js/engine/store.js";
import { ROLES } from "../assets/js/engine/company.js";
import { T, TK } from "../assets/js/engine/tickets.js";
import { startThursday, THU_T } from "../assets/js/engine/thursday.js";
import * as st from "../assets/js/engine/state.js";
import { HINTS, hintSteps } from "../assets/js/engine/hints.js";
import { decodeReport } from "../assets/js/engine/report.js";

const out = document.getElementById("out");
const log = m => { out.textContent += m + "\n"; };
const fails = [];
const check = (ok, msg) => { if (!ok) fails.push(msg); };

// The exact-steps hints, as actions. Each entry is (ticket) => closeKind or [closeKind, answer].
const role = rk => ROLES[rk];
const setGroups = (uid, want) => { U(uid).groups.slice().forEach(g => { if (!want.includes(g)) st.act("rmgrp", uid, g); }); want.forEach(g => st.act("addgrp", uid, g)); };
const PLAYBOOK = {
  REQ0018841: () => { st.act("enable", "maria.lopez"); setGroups("maria.lopez", role("Finance|AP Clerk")); return "resolve"; },
  INC0041207: id => { st.tact("verify", id); st.act("pwreset", "james.carter"); return "resolve"; },
  INC0041209: id => { st.tact("verify", id); st.act("unlock", "aisha.brown"); return "resolve"; },
  INC0041212: id => { st.tact("verify", id); st.act("mfareset", "kevin.nguyen"); st.act("revoke", "kevin.nguyen"); return "resolve"; },
  REQ0018850: () => { st.act("disable", "robert.hayes"); st.act("revoke", "robert.hayes"); setGroups("robert.hayes", []); return "resolve"; },
  REQ0018852: () => { st.act("job", "tanya.wright", "Operations|Dispatcher"); setGroups("tanya.wright", role("Operations|Dispatcher")); return "resolve"; },
  REQ0018855: () => "reject",
  REQ0018858: id => { st.tact("approval", id); st.act("addgrp", "omar.hassan", "APP-Salesforce-Reports"); return "resolve"; },
  INC0041220: id => { st.tact("escalate", id, "Security team"); return "reject"; },
  REQ0018861: id => { st.tact("approval", id); st.act("expiry", "dev.patel", "90"); return "resolve"; },
  TSK0007712: id => { ["greg.foster", "nina.shah", "paul.kim"].forEach(u => st.act("disable", u)); st.tact("escalate", id, "Account owner"); return "resolve"; },
  INC0041231: id => { st.act("disable", "brian.walsh"); st.act("revoke", "brian.walsh"); setGroups("brian.walsh", []); st.tact("escalate", id, "Security team"); return "resolve"; },
  REQ0018866: () => "reject",
  REQ0018870: () => { st.act("enable", "sofia.ramirez"); st.act("pwreset", "sofia.ramirez"); st.act("job", "sofia.ramirez", "HR|HR Generalist"); setGroups("sofia.ramirez", role("HR|HR Generalist")); return "resolve"; },
  REQ0018873: () => "reject",
  REQ0018876: () => { st.act("rmgrp", "jordan.lee", "APP-Finance-Reports"); return "resolve"; },
  REQ0018879: () => { st.act("disable", "rachel.adams"); return "resolve"; },
  REQ0018881: () => { st.act("enable", "ethan.moore"); setGroups("ethan.moore", role("Operations|Dispatcher")); return "resolve"; },
  REQ0018884: () => { const want = Object.values(S.users).filter(u => u.enabled && u.groups.includes("APP-SAP-AP-Entry") && u.groups.includes("APP-SAP-AP-Approve")).map(u => u.id); return ["resolve", want.join(", ") || "none"]; },
  INC0041240: id => { ["revoke", "pwreset", "mfareset"].forEach(a => st.act(a, "sam.okafor")); st.tact("escalate", id, "Security team"); return "resolve"; },
  REQ0018910: () => "reject",
  REQ0018912: () => { st.act("enable", "rachel.adams"); setGroups("rachel.adams", role("Sales|Account Executive")); return "resolve"; },
  INC0041302: id => { const tg = TK[id].users[0]; ["disable", "revoke", "mfareset"].forEach(a => st.act(a, tg)); st.tact("escalate", id, "Security team"); return "resolve"; },
  INC0041305: id => { st.act("enable", "svc-backup"); st.tact("escalate", id, "Account owner"); return "resolve"; },
  INC0041308: id => { st.act("disable", "robert.hayes"); st.act("revoke", "robert.hayes"); setGroups("robert.hayes", []); st.tact("escalate", id, "Security team"); return "resolve"; },
  INC0041311: id => { st.act("disable", "brian.walsh"); st.act("revoke", "brian.walsh"); setGroups("brian.walsh", []); st.tact("escalate", id, "Security team"); return "resolve"; },
  INC0041314: id => { st.act("rmgrp", "lisa.morales", "APP-SAP-AP-Approve"); st.tact("escalate", id, "Security team"); return "resolve"; },
  REQ0018915: () => { setGroups("ethan.moore", role("Operations|Dispatcher")); st.act("rmgrp", "bob.turner", "APP-SAP-AP-Entry"); st.act("rmgrp", "bob.turner", "APP-Finance-Reports"); return "resolve"; },
  INC0041318: id => { st.act("rmgrp", "tyler.brooks", "ROLE-Global-Admin"); st.act("revoke", "tyler.brooks"); st.tact("escalate", id, "Security team"); return "resolve"; },
  INC0041320: id => { ["revoke", "mfareset", "pwreset"].forEach(a => st.act(a, "patricia.reed")); st.tact("escalate", id, "Security team"); return "resolve"; },
  INC0041323: id => { st.tact("approval", id); st.act("enable", "dev.patel"); st.act("expiry", "dev.patel", "90"); return "resolve"; },
  INC0041326: id => { ["revoke", "pwreset", "mfareset"].forEach(a => st.act(a, "sam.okafor")); st.tact("escalate", id, "Security team"); return "resolve"; },
  INC0041329: id => { st.act("revoke", "james.carter"); st.act("pwreset", "james.carter"); st.tact("escalate", id, "Security team"); return "resolve"; },
  REQ0018918: () => { st.act("rmgrp", "jordan.lee", "APP-Finance-Reports"); return "resolve"; },
  REQ0018921: () => { setGroups("tanya.wright", role("Operations|Dispatcher")); return "resolve"; },
};

function work(id){
  st.tact("start", id);
  const steps = hintSteps(id); // must render without throwing, against live state
  check(Array.isArray(steps) && steps.length, `${id}: exact steps hint is empty`);
  let r = PLAYBOOK[id](id); if (!Array.isArray(r)) r = [r];
  const err = st.closeTicket(id, r[0], { note: "per runbook", answer: TK[id].question ? r[1] : undefined });
  const ts = S.tickets[id];
  check(!err && ts.score === ts.max, `${id}: following the hint scored ${ts.score}/${ts.max}: ${(ts.checks || []).filter(c => !c.pass).map(c => c.label).join("; ")}`);
}

function engineTests(){
  // Every ticket has hints, a skill and a playbook.
  const all = T.map(t => t.id).concat(["REQ0018910", "REQ0018912", "INC0041302", "INC0041305", "INC0041308", "INC0041311", "INC0041314", "REQ0018915", "INC0041318", "INC0041320", "INC0041323", "INC0041326", "INC0041329", "REQ0018918", "REQ0018921"]);
  all.forEach(id => check(HINTS[id] && HINTS[id].skill && HINTS[id].nudge && HINTS[id].clause && PLAYBOOK[id], `${id}: missing hint data or playbook`));

  // A: perfect Monday -> no consequences, Thursday perfect too.
  setState(st.fresh());
  T.forEach(t => work(t.id));
  startThursday();
  check(THU_T.length === 2, `Perfect Monday should fire no consequences; Thursday has ${THU_T.length} tickets`);
  check(S.report.every(r => !r.bad), "Perfect Monday: every consequence should be prevented");
  THU_T.forEach(t => work(t.id));
  const tt = st.totals(THU_T); check(tt.pct === 100, `Perfect Thursday scored ${tt.pct}%`);

  // B: careless Monday (resolve everything, change nothing) -> consequences fire; each is fixable.
  setState(st.fresh());
  // Make the changes that trigger the remaining consequences.
  st.act("addgrp", "lisa.morales", "APP-SAP-AP-Approve"); st.act("addgrp", "tyler.brooks", "ROLE-Global-Admin");
  st.act("pwreset", "patricia.reed"); st.act("pwreset", "james.carter"); st.act("disable", "svc-backup");
  st.act("enable", "ethan.moore"); st.act("addgrp", "ethan.moore", "APP-Finance-Reports");
  T.forEach(t => { st.tact("start", t.id); st.closeTicket(t.id, "resolve", { answer: TK[t.id].question ? "none" : undefined }); });
  startThursday();
  check(THU_T.length === 15, `Careless Monday should fire all 13 consequences; Thursday has ${THU_T.length} tickets (${S.thu.map(x => x.key).join(",")})`);
  THU_T.forEach(t => work(t.id));

  // C: hint penalties and Solo/Assisted.
  setState(st.fresh());
  const id = "INC0041207";
  st.revealHint(id); check(st.hintCost(S.tickets[id]) === 0.10, "Nudge should cost 10%");
  st.revealHint(id); check(st.hintCost(S.tickets[id]) === 0.25, "Clause should cost 25% (not cumulative)");
  check(!st.isAssisted(S.tickets[id]), "Two tiers should still be Solo");
  st.revealHint(id); check(st.hintCost(S.tickets[id]) === 0.50 && st.isAssisted(S.tickets[id]), "Exact steps should cost 50% and mark Assisted");
  work(id);
  check(st.finalScore(S.tickets[id]) === S.tickets[id].max / 2, `Final score should be half of ${S.tickets[id].max}, got ${st.finalScore(S.tickets[id])}`);
  check(!st.revealHint(id) && S.tickets[id].hints === 3, "Hints on a closed ticket shouldn't change the score");
  const id2 = "INC0041209"; st.revealHint(id2); work(id2);
  check(st.finalScore(S.tickets[id2]) === st.round1(S.tickets[id2].max * 0.9), "Nudge-only ticket should keep 90%");
  const t = st.totals(T); check(t.assisted === 1 && t.solo === 1 && t.done === 2, `Totals should count 1 assisted and 1 solo: ${JSON.stringify(t)}`);
  log(`Engine: ${all.length} tickets checked against their exact-steps hints; penalties and Solo/Assisted verified.`);
}

// ---------- UI click-through ----------
const frame = document.getElementById("app");
const wait = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, what, ms = 4000){ const t0 = performance.now(); while (performance.now() - t0 < ms) { const v = fn(); if (v) return v; await wait(30); } throw new Error("Timed out waiting for " + what); }
const $ = sel => frame.contentDocument.querySelector(sel);
async function click(sel){ const el = await until(() => $(sel), sel); el.click(); await wait(40); }
async function nav(hash){ frame.contentWindow.location.hash = hash; await wait(80); }
const text = () => frame.contentDocument.getElementById("main").textContent;

async function uiTests(){
  localStorage.removeItem("pcl-iam-sim-v1");
  frame.src = "/app/#/home";
  await until(() => frame.contentDocument && frame.contentDocument.querySelector("#main h1"), "app to load");
  check(/Twenty tickets are waiting/.test(text()), "Home should show the first-run state");

  await nav("#/queue/INC0041207");
  await click('[data-a="start"]');
  check(!!$("#ta-h"), "Start work should show ticket actions");
  await click('[data-a="hintAsk"]');
  check(/reduced by 10%/.test($(".confirmbox").textContent), "Nudge confirmation should state the 10% cost");
  await click('[data-a="hintYes"]');
  check(!!$("#hint-INC0041207-0"), "Nudge should be revealed");
  await click('[data-a="verify"]');
  await click('a[href="#/directory/james.carter"]'); await wait(80);
  check(/Changes are logged against/.test(text()), "Directory should show the active ticket");
  await click('[data-a="act"][data-op="pwreset"]');
  await nav("#/queue/INC0041207");
  await click('[data-a="close"][data-kind="resolve"]');
  const grade = await until(() => $(".scoremath"), "grade");
  check(/Raw 8\/8 − 10% for the nudge hint = 7\.2/.test(grade.textContent), "Grade should show the nudge penalty math: " + grade.textContent);
  check(/Solo/.test($(".ticket-h").textContent), "Nudge-only ticket should show Solo");

  // Assisted path + tutor + undo
  await nav("#/queue/INC0041209");
  await click('[data-a="start"]');
  for (let i = 0; i < 3; i++) { await click('[data-a="hintAsk"]'); await click('[data-a="hintYes"]'); }
  check(/Assisted/.test($(".ticket-h").textContent), "Exact steps should mark the open ticket Assisted");
  check($("#hint-INC0041209-2 ol li"), "Exact steps should list steps");
  if (!$("#tutor-in")) await click('[data-a="tutorToggle"]');
  await click('[data-a="tutorAsk"][data-q="@recap"]');
  check(/audit log|No changes/.test($("#tutor-log").textContent), "Tutor recap should answer from the audit log");
  const inp = $("#tutor-in"); inp.value = "just tell me the answer"; inp.form.requestSubmit(); await wait(60);
  check(/won't hand you the answer/.test($("#tutor-log").textContent), "Tutor should refuse to give the answer");
  await nav("#/directory/aisha.brown");
  await click('[data-a="act"][data-op="disable"]');
  check(/Disabled/.test($(".udetail .pills").textContent), "Disable should apply");
  frame.contentDocument.querySelector("[data-toast-act]").click(); await wait(60);
  check(!/Disabled/.test($(".udetail .pills").textContent), "Undo should re-enable the account");
  await click('[data-a="act"][data-op="unlock"]');
  await nav("#/queue/INC0041209");
  await click('[data-a="close"][data-kind="resolve"]');
  const g2 = await until(() => $(".scoremath"), "grade 2");
  check(/− 50% for the exact steps hint/.test(g2.textContent), "Assisted grade should show 50% penalty: " + g2.textContent);

  // Search keeps focus while typing
  await nav("#/directory");
  const q = $("#dir-q"); q.focus(); q.value = "nina"; q.dispatchEvent(new Event("input", { bubbles: true })); await wait(40);
  check(frame.contentDocument.activeElement && frame.contentDocument.activeElement.id === "dir-q", "Search box should keep focus after re-render");
  check(/1 account match/.test(text()), "Search should filter to one account");

  // Results and report
  await nav("#/results");
  check(/Assisted/.test(text()) && /Solo/.test(text()), "Results should show Solo and Assisted");
  await nav("#/report");
  const url = $("#rp-url").value;
  const d = decodeReport(new URL(url).hash.slice(3));
  check(d && d.mon.solo === 1 && d.mon.assisted === 1 && d.tickets.length === 20, "Report link should round-trip with 1 solo and 1 assisted");
  frame.src = url; await until(() => frame.contentDocument && /IAM analyst readiness|Readiness/.test(frame.contentDocument.body.textContent) && frame.contentDocument.querySelector("#rp-h"), "public report");
  check(/Assisted/.test(frame.contentDocument.body.textContent), "Public report should show Assisted");
  log("UI: click-through passed its checks.");
}

try {
  engineTests();
  await uiTests();
} catch (e) { fails.push("Exception: " + e.message + "\n" + e.stack); }
localStorage.removeItem("pcl-iam-sim-v1");
log(fails.length ? "FAIL:\n- " + fails.join("\n- ") : "PASS: all walkthrough checks.");
document.body.dataset.result = fails.length ? "fail" : "pass";
