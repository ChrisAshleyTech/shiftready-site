// Pricing: three plans, prices from one place, trial and cancel terms, no one-time lab pack.
import { expect, test } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { TIERS, PRICES, WAITLIST_OPTIONS, yearlySaving } from "../src/marketing/plans";

test("Free, Pro and Pro + Labs, priced from PRICES", () => {
  expect(TIERS.map(t => [t.name, t.monthly])).toEqual([["Free", 0], ["Pro", PRICES.pro.monthly], ["Pro + Labs", PRICES.labs.monthly]]);
  expect(TIERS[1].trialDays).toBe(14);
  expect(TIERS[2].trialDays).toBeUndefined();
  for (const t of TIERS.slice(1)) expect(yearlySaving(t), t.name).toBeGreaterThan(0);
  expect(WAITLIST_OPTIONS.map(o => o.value)).toEqual(["updates", "pro-monthly", "pro-yearly", "labs-monthly", "labs-yearly"]);
  expect(WAITLIST_OPTIONS.find(o => o.value === "labs-monthly")!.label).toBe(`Pro + Labs, monthly ($${PRICES.labs.monthly}/mo)`);
});

test("no single-platform lab pack anywhere in the site source", () => {
  const walk = (d: string): string[] => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
  for (const f of walk("src").filter(f => /\.(tsx?|jsx?)$/.test(f)))
    expect(readFileSync(f, "utf8"), f).not.toMatch(/\$39\b|lab pack|ADDON|"pack"/i);
});
