// Generates src/marketing/sampleReport.json: a realistic, imperfect shift played through the real
// engine, so the sample readiness report shows genuine scores. Run: node scripts/make-sample-report.mjs
import { writeFileSync } from "node:fs";
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
const E = new URL("../src/engine/", import.meta.url).href;
const store = await import(E + "store.js");
const st = await import(E + "state.js");
const { T, TK } = await import(E + "tickets.js");
const { queueTickets } = await import(E + "followups.js");
const { ROLES } = await import(E + "company.js");
const { buildReport } = await import(E + "report.js");
const U = id => store.S.users[id];
const setGroups = (uid, want) => { U(uid).groups.slice().forEach(g => { if (!want.includes(g)) st.act("rmgrp", uid, g); }); want.forEach(g => st.act("addgrp", uid, g)); };
const work = (id, fn, kind = "resolve", answer) => { st.tact("start", id); fn?.(); st.closeTicket(id, kind, { note: "", answer }); };

store.setState(st.fresh());
// The assigned tickets: mostly sound, a few realistic misses, two hints and one assisted ticket.
work("REQ0018841", () => { st.act("enable", "maria.lopez"); setGroups("maria.lopez", ROLES["Finance|AP Clerk"]); });
work("INC0041207", () => { st.tact("verify", "INC0041207"); st.act("pwreset", "james.carter"); });
work("INC0041209", () => { st.tact("verify", "INC0041209"); st.act("unlock", "aisha.brown"); });
st.revealHint("INC0041212"); work("INC0041212", () => { st.tact("verify", "INC0041212"); st.act("mfareset", "kevin.nguyen"); st.act("revoke", "kevin.nguyen"); });
work("REQ0018850", () => { st.act("disable", "robert.hayes"); st.act("revoke", "robert.hayes"); setGroups("robert.hayes", []); });
work("REQ0018852", () => { st.act("job", "tanya.wright", "Operations|Dispatcher"); st.act("addgrp", "tanya.wright", "APP-CargoWise-Ops"); st.act("addgrp", "tanya.wright", "APP-WMS-User"); }); // forgot to remove Salesforce
work("REQ0018855", null, "reject");
work("REQ0018858", () => { st.tact("approval", "REQ0018858"); st.act("addgrp", "omar.hassan", "APP-Salesforce-Reports"); });
work("INC0041220", () => { st.tact("escalate", "INC0041220", "Security team"); }, "reject");
work("REQ0018861", () => { st.tact("approval", "REQ0018861"); st.act("expiry", "dev.patel", "90"); });
work("TSK0007712", () => { ["greg.foster", "nina.shah", "paul.kim"].forEach(u => st.act("disable", u)); st.tact("escalate", "TSK0007712", "Account owner"); });
work("INC0041231", () => { st.act("disable", "brian.walsh"); st.act("revoke", "brian.walsh"); setGroups("brian.walsh", []); st.tact("escalate", "INC0041231", "Security team"); });
work("REQ0018866", null, "reject");
[1, 2, 3].forEach(() => st.revealHint("REQ0018870"));
work("REQ0018870", () => { st.act("enable", "sofia.ramirez"); st.act("pwreset", "sofia.ramirez"); st.act("job", "sofia.ramirez", "HR|HR Generalist"); setGroups("sofia.ramirez", ROLES["HR|HR Generalist"]); });
work("REQ0018873", null, "reject");
work("REQ0018876", () => { st.act("rmgrp", "jordan.lee", "APP-Finance-Reports"); });
work("REQ0018879", () => { st.act("disable", "rachel.adams"); });
work("REQ0018881", () => { st.act("enable", "ethan.moore"); setGroups("ethan.moore", ROLES["Operations|Dispatcher"]); });
work("REQ0018884", null, "resolve", "derek.chan");
work("INC0041240", () => { st.act("revoke", "sam.okafor"); st.act("pwreset", "sam.okafor"); st.act("mfareset", "sam.okafor"); }); // did not escalate
// Then work whatever arrived or was reopened, until the queue is clear.
const fixes = {
  REQ0018910: () => work("REQ0018910", null, "reject"),
  REQ0018912: () => work("REQ0018912", () => st.act("enable", "rachel.adams")),
  REQ0018921: () => work("REQ0018921", () => setGroups("tanya.wright", ROLES["Operations|Dispatcher"])),
  INC0041326: () => work("INC0041326", () => { ["revoke", "pwreset", "mfareset"].forEach(a => st.act(a, "sam.okafor")); st.tact("escalate", "INC0041326", "Security team"); }),
};
for (let i = 0; i < 100; i++) {
  const t = queueTickets().find(t => !store.S.tickets[t.id].checks);
  if (!t) break;
  (fixes[t.id] || (() => work(t.id)))();
}

const d = buildReport("Sample learner");
d.date = "2026-10-08";
writeFileSync(new URL("../src/marketing/sampleReport.json", import.meta.url), JSON.stringify(d, null, 1) + "\n");
console.log("week", d.week, "mon", d.mon.pct, "thu", d.thu && d.thu.pct, "caused", d.caused, "tickets", d.tickets.length);
