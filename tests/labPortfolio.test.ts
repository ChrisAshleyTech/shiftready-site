// The GitHub portfolio project built from a graded lab.
import { expect, test } from "vitest";
import { unzipSync, strFromU8 } from "fflate";
import { gradeState, labSpec } from "../src/app/lab/core";
import { portfolioZip } from "../src/app/lab/portfolio";

test("portfolio zip holds a README with the score and checks, the results and the export", () => {
  const r = gradeState(labSpec().users.map(u => ({ key: u.key, enabled: u.enabled, dept: u.dept, title: u.title, groups: u.groups })), "2026-10-05T15:00:00Z");
  const files = unzipSync(portfolioZip("okta", "Okta lab", r, "rolevara-okta-export.json", '{"x":1}'));
  expect(Object.keys(files).sort()).toEqual(["rolevara-okta-lab/README.md", "rolevara-okta-lab/results.json", "rolevara-okta-lab/rolevara-okta-export.json"]);
  const readme = strFromU8(files["rolevara-okta-lab/README.md"]);
  expect(readme).toContain("# Identity operations lab: Okta lab");
  expect(readme).toContain(`**Score: ${r.score}/${r.max}`);
  expect(readme).toContain("| REQ0018850 | Termination: Robert Hayes, effective noon | 0/8 |");
  expect(readme).toMatch(/- \[ \] Account disabled \(3 pts\)/);
  expect(readme).toContain("Okta Certified");
  expect(JSON.parse(strFromU8(files["rolevara-okta-lab/results.json"])).score).toBe(r.score);
});
