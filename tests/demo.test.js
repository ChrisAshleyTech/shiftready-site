// The landing-page demo shows INC0041207 being worked correctly. Its grade lines must be exactly
// what the engine awards for those steps.
import { describe, it, expect } from "vitest";
import { S, setState } from "../src/engine/store.js";
import * as st from "../src/engine/state.js";
import { DEMO_CHECKS, DEMO_TICKET, DEMO_DIRECTORY } from "../src/landing/demoScript.ts";

describe("landing demo", () => {
  it("matches the engine's grade for the demonstrated steps", () => {
    localStorage.clear(); setState(st.fresh());
    st.tact("start", "INC0041207"); st.tact("verify", "INC0041207"); st.act("pwreset", "james.carter");
    st.closeTicket("INC0041207", "resolve", { note: "" });
    const ts = S.tickets.INC0041207;
    expect(ts.checks.map(c => ({ label: c.label, pts: c.pts }))).toEqual(DEMO_CHECKS);
    expect(ts.checks.every(c => c.pass)).toBe(true);
    expect(DEMO_TICKET.caller).toEqual({ empId: DEMO_DIRECTORY.empId, mgr: DEMO_DIRECTORY.mgr });
    expect(S.users[DEMO_DIRECTORY.user]).toMatchObject({ name: DEMO_DIRECTORY.name, empId: DEMO_DIRECTORY.empId, mgr: DEMO_DIRECTORY.mgr });
  });
});
