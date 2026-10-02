// A GitHub-ready portfolio project for a graded lab: README with the scenario, the work and the
// graded checks, the results as JSON, and the learner's own export. Built in the browser.
import { strToU8, zipSync } from "fflate";
import { download } from "../exports";
import type { LabResult } from "./core";

const CERTS: Record<string, string> = {
  entra: "Microsoft SC-300 (Identity and Access Administrator)",
  okta: "Okta Certified Professional and Administrator",
  aws: "AWS Certified Security - Specialty (identity and access management domain)",
};

export function portfolioReadme(lab: string, name: string, r: LabResult, exportFile: string) {
  const date = new Date(r.exportedAt).toISOString().slice(0, 10);
  const pct = r.max ? Math.round((r.score / r.max) * 100) : 0;
  const lines = [
    `# Identity operations lab: ${name}`,
    "",
    `Six joiner, mover, leaver and access tickets for a fictional company (Pacific Crest Logistics), worked in a real ${name.replace(/ lab$/, "")} tenant and graded automatically by [Rolevara](https://rolevara.com) from a read-only export.`,
    "",
    `**Score: ${r.score}/${r.max} (${pct}%)** · graded ${date}`,
    "",
    "## Tickets",
    "",
    "| Ticket | Request | Score |",
    "| --- | --- | --- |",
    ...r.tickets.map(t => `| ${t.id} | ${t.title.replace(/\|/g, "\\|")} | ${t.score}/${t.max} |`),
    "",
    "## Graded checks",
    "",
    ...r.tickets.flatMap(t => [
      `### ${t.id}: ${t.title}`,
      "",
      ...t.checks.map(c => `- ${c.pass ? "[x]" : "[ ]"} ${c.label} (${c.pts} pt${c.pts === 1 ? "" : "s"})${!c.pass && c.detail ? `: ${c.detail}` : ""}`),
      "",
      `> ${t.lesson}`,
      "",
    ]),
    "## Skills shown",
    "",
    "- Joiner, mover, leaver and rehire processing against an access matrix (NIST AC-2, PS-4, PS-5)",
    "- Least privilege: provisioning from the role, not by copying a coworker (NIST AC-6)",
    "- Leaver containment: disabling access and revoking sessions or keys",
    "- Working safely in a lab tenant: seeded with tagged objects, checked read-only, cleaned up after",
    `- Aligned to ${CERTS[lab] ?? "identity and access certifications"}`,
    "",
    "## Files",
    "",
    "- `results.json`: the graded result.",
    `- \`${exportFile}\`: the read-only export that was graded. It holds only the fictional lab users.`,
    "",
    "All companies and people are fictional. Rolevara is not affiliated with Microsoft, Okta or Amazon.",
    "",
  ];
  return lines.join("\n");
}

export function portfolioZip(lab: string, name: string, r: LabResult, exportFile: string, exportText: string) {
  const dir = `rolevara-${lab}-lab`;
  const results = { lab, score: r.score, max: r.max, exportedAt: r.exportedAt, tickets: r.tickets.map(t => ({ id: t.id, title: t.title, score: t.score, max: t.max, checks: t.checks.map(c => ({ label: c.label, pass: c.pass, pts: c.pts })) })) };
  return zipSync({
    [`${dir}/README.md`]: strToU8(portfolioReadme(lab, name, r, exportFile)),
    [`${dir}/results.json`]: strToU8(JSON.stringify(results, null, 2) + "\n"),
    [`${dir}/${exportFile}`]: strToU8(exportText),
  });
}

export function downloadPortfolio(lab: string, name: string, r: LabResult, exportFile: string, exportText: string) {
  download(new Blob([portfolioZip(lab, name, r, exportFile, exportText) as BlobPart], { type: "application/zip" }), `rolevara-${lab}-lab-portfolio.zip`);
}
