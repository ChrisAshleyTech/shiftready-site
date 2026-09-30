// Paths: Jordan Reyes' simulated week, the seven-task week audit (answer keys come from the
// audited week's evidence), grading, GRC-only report links, per-path storage keys and framework data.
import { describe, it, expect, beforeEach } from "vitest";
import { S, setState } from "../src/engine/store.js";
import { T, TK } from "../src/engine/tickets.js";
import { startThursday, THU_T, BASE_THU, CONSEQ } from "../src/engine/thursday.js";
import * as st from "../src/engine/state.js";
import { encodeReport, decodeReport } from "../src/engine/report.js";
import { playJordanWeek, MISTAKES } from "../src/app/audit/jordan";
import { buildWeekAudit, gradeTask, submitTask, waTotals, type Task, type Answers } from "../src/app/audit/weekAudit";
import { stateKey } from "../src/app/pathStore";
import { TOPICS, TICKET_TOPICS } from "../src/app/frameworks";
// @ts-ignore: plain JS test helper
import { PLAYBOOK } from "./playbook.js";

beforeEach(() => { localStorage.clear(); setState(st.fresh()); });

const rowsOf = (t: Task) => Object.fromEntries(t.rows!.map(r => [r.name.split(" · ")[0], r.correct]));
// The answer key as a learner would submit it.
const perfect = (t: Task): Answers => Object.fromEntries((t.kind === "table" ? t.rows! : t.qs!).map((q: any, i) => [i, q.correct]));

describe("Jordan Reyes' week", () => {
  it("closes every ticket, and only the planted mistakes lose points", () => {
    playJordanWeek();
    expect(S.shift).toBe("thu");
    const all = [...T, ...THU_T];
    all.forEach((t: any) => expect(S.tickets[t.id].checks, t.id).toBeTruthy());
    const imperfect = all.filter((t: any) => S.tickets[t.id].score < S.tickets[t.id].max).map((t: any) => t.id).sort();
    expect(imperfect).toEqual(Object.keys(MISTAKES).filter(k => k !== "unticketed").sort());
  });
  it("Monday's mistakes come back on Thursday", () => {
    playJordanWeek();
    expect(S.thu.map((x: any) => x.key).sort()).toEqual(["james", "robert", "tanya"]);
    expect(THU_T.map((t: any) => t.id)).toHaveLength(BASE_THU.length + 3);
  });
  it("makes exactly one change without a ticket", () => {
    playJordanWeek();
    expect(S.log.filter((e: any) => !e.ticket)).toHaveLength(1);
  });
});

describe("week audit of Jordan's week", () => {
  beforeEach(() => { playJordanWeek(); });
  it("control testing finds the planted exceptions and nothing else", () => {
    const wa = buildWeekAudit("jordan"), w3 = wa.tasks.find(t => t.id === "W3")!;
    expect(rowsOf(w3)).toEqual({
      INC0041207: 1, INC0041209: 0, INC0041212: 1, INC0041220: 0,
      REQ0018841: 0, REQ0018852: 1, REQ0018870: 0, REQ0018881: 0, REQ0018912: 0,
      REQ0018850: 1, INC0041231: 0,
      REQ0018855: 0, REQ0018858: 0, REQ0018866: 0, REQ0018873: 0, REQ0018910: 1,
    });
    expect(w3.rows!.find(r => r.name.startsWith("REQ0018852"))!.why).toContain("APP-Salesforce-User");
  });
  it("counts the unticketed change and writes the APD-03 finding with real numbers and effects", () => {
    const wa = buildWeekAudit("jordan");
    expect(wa.tasks.find(t => t.id === "W4")!.qs![0].correct).toBe(1);
    const w5 = wa.tasks.find(t => t.id === "W5")!;
    expect(w5.ctrl).toBe("APD-03");
    expect(w5.qs![0].opts![1]).toBe("2 of 4 caller-initiated credential tickets tested were exceptions (INC0041207, INC0041212).");
    expect(w5.qs![3].opts![1]).toContain("INC0041329");
  });
  it("rates risk from the exception rates", () => {
    const w6 = buildWeekAudit("jordan").tasks.find(t => t.id === "W6")!;
    // APD-03 2/4 Likely×Severe=20 High · APD-02 1/2 Likely×Major=16 High · ACC-01 1/5 Possible×Major=12 Medium · APD-01 1/5 Possible×Moderate=9 Medium
    expect(w6.rows!.map(r => [r.name.slice(0, 6), r.opts[r.correct]])).toEqual([["APD-03", "High"], ["APD-02", "High"], ["ACC-01", "Medium"], ["APD-01", "Medium"]]);
  });
  it("the answer key scores 100%, blanks are refused, and totals add up", () => {
    const wa = buildWeekAudit("jordan");
    expect(submitTask("W1", {})).toMatch(/Answer every item/);
    wa.tasks.forEach(t => {
      const checks = gradeTask(t, perfect(t));
      expect(checks.every(c => c.pass), t.id).toBe(true);
      expect(submitTask(t.id, perfect(t))).toBeNull();
    });
    expect(waTotals()).toMatchObject({ done: 7, n: 7, pct: 100 });
  });
  it("the evidence is frozen when the audit is built", () => {
    const wa = buildWeekAudit("jordan"), before = JSON.stringify(wa.tasks);
    st.act("pwreset", "marcus.bell");
    expect(JSON.stringify(S.wa.tasks)).toBe(before);
  });
});

describe("Friday audit of a clean week", () => {
  it("finds no exceptions and asks for a clean-result report", () => {
    const work = (id: string) => { st.tact("start", id); let r = PLAYBOOK[id](id); if (!Array.isArray(r)) r = [r]; st.closeTicket(id, r[0], { answer: TK[id].question ? r[1] : undefined }); };
    T.forEach((t: any) => work(t.id));
    startThursday();
    THU_T.forEach((t: any) => work(t.id));
    const wa = buildWeekAudit("self");
    expect(Object.values(rowsOf(wa.tasks.find(t => t.id === "W3")!)).every(v => v === 0)).toBe(true);
    expect(wa.tasks.find(t => t.id === "W4")!.qs![0].correct).toBe(0);
    expect(wa.tasks.find(t => t.id === "W5")!.title).toBe("Report a clean result");
    expect(wa.tasks.find(t => t.id === "W7")!.qs![3].short).toBe("Auditing your own work");
  });
});

describe("paths", () => {
  it("IAM + GRC keeps each company's original key; the others get their own", () => {
    expect(stateKey("pcl-iam-sim-v1", "iam-grc")).toBe("pcl-iam-sim-v1");
    expect(stateKey("pcl-iam-sim-v1", "iam")).toBe("pcl-iam-sim-v1:iam");
    expect(stateKey("pcl-iam-sim-v1", "grc")).toBe("pcl-iam-sim-v1:grc");
  });
  it("a GRC-only report link round-trips", () => {
    const d = { v: 1, p: "grc", c: "pacific-crest", name: "Jordan", date: "2026-10-09", audit: { pct: 90, sc: 90, mx: 100, done: 7, n: 7 }, tasks: [["W1", "Walkthrough", 8, 8]], grc: null, mon: null, thu: null, skills: [], tickets: [] };
    expect(decodeReport(encodeReport(d))).toMatchObject({ p: "grc", audit: { pct: 90 } });
  });
});

describe("framework panels", () => {
  it("every Monday and Thursday ticket maps to known topics", () => {
    const ids = [...T.map((t: any) => t.id), ...BASE_THU.map((t: any) => t.id), ...CONSEQ.map((c: any) => c.make("james.carter").id)];
    ids.forEach(id => { expect(TICKET_TOPICS[id], id).toBeTruthy(); TICKET_TOPICS[id].forEach(k => expect(TOPICS[k], `${id}: ${k}`).toBeTruthy()); });
  });
  it("quotes only public-domain text; ISO, SOC 2 and PCI get summaries", () => {
    Object.values(TOPICS).flatMap(t => t.refs).forEach(r => {
      if (r.fw === "nist" || r.fw === "hipaa") expect(r.quote, r.id).toBeTruthy();
      else { expect(r.quote, r.id).toBeUndefined(); expect(r.summary, r.id).toBeTruthy(); }
    });
  });
});
