// Company packs: switching the active pack updates every importer, and progress is saved per company.
import { beforeEach, describe, expect, test } from "vitest";
import * as engineCompany from "../src/engine/company.js";
import * as enginePolicy from "../src/engine/policy.js";
import * as state from "../src/engine/state.js";
import { S } from "../src/engine/store.js";
import { roleCheck } from "../src/engine/store.js";
import * as pcl from "../src/packs/pacific-crest/company.js";
import * as pclPolicy from "../src/packs/pacific-crest/policy.js";
import { COMPANIES } from "../src/packs";
import { BRANDS } from "../src/packs/brands";

const fixture = {
  ROLES: { "Ops|Clerk": ["GRP-Everyone", "APP-Fixture"] }, REQUESTABLE: [], SOD: [], ALL_GROUPS: ["APP-Fixture", "GRP-Everyone"],
  BASE: new Date(2026, 9, 5), fmtDay: () => "Oct 5, 2026", HR_FEED: [],
  buildUsers: () => ({ "a.b": { id: "a.b", name: "A B", groups: ["GRP-Everyone"], enabled: true } }),
};
const fixturePolicy = { POLICIES: [{ key: "x", title: "X", html: "x" }], POLICY: { x: { key: "x" } } };

beforeEach(() => {
  localStorage.clear();
  engineCompany.setCompanyData(pcl); enginePolicy.setPolicyData(pclPolicy); state.setCompanyState("pcl-iam-sim-v1", true);
});

describe("company packs", () => {
  test("Pacific Crest is the default pack, unchanged", () => {
    expect(engineCompany.ROLES).toBe(pcl.ROLES);
    expect(enginePolicy.POLICIES).toBe(pclPolicy.POLICIES);
    expect(state.KEY).toBe("pcl-iam-sim-v1");
  });

  test("switching packs updates the live bindings the engine grades with", () => {
    engineCompany.setCompanyData(fixture); enginePolicy.setPolicyData(fixturePolicy); state.setCompanyState("fixture-v1", false);
    state.init();
    expect(engineCompany.ROLES).toBe(fixture.ROLES);
    expect(enginePolicy.POLICIES).toHaveLength(1);
    expect(Object.keys(S.users)).toEqual(["a.b"]);
    expect(S.tickets).toEqual({});
    expect(roleCheck("a.b", "Ops|Clerk", 4).detail).toBe("Missing: APP-Fixture");
  });

  test("each company saves its own progress", () => {
    state.init(); S.clock = 999; state.save();
    engineCompany.setCompanyData(fixture); state.setCompanyState("fixture-v1", false); state.init();
    expect(S.clock).toBe(480);
    S.clock = 600; state.save();
    engineCompany.setCompanyData(pcl); state.setCompanyState("pcl-iam-sim-v1", true); state.init();
    expect(S.clock).toBe(999);
    expect(JSON.parse(localStorage.getItem("fixture-v1")!).clock).toBe(600);
  });

  test("every company has a unique id and storage key, and a brand for the report", () => {
    expect(new Set(COMPANIES.map(c => c.id)).size).toBe(COMPANIES.length);
    expect(new Set(COMPANIES.map(c => c.storageKey)).size).toBe(COMPANIES.length);
    for (const c of COMPANIES) expect(BRANDS[c.id]?.name).toBe(c.name);
  });

  test("every Pacific Crest group maps to a specific app icon", () => {
    const p = COMPANIES.find(c => c.id === "pacific-crest")!;
    expect(pcl.ALL_GROUPS.filter((g: string) => p.appIcon(g) === "app")).toEqual([]);
  });
});
