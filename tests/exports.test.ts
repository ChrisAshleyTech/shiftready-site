// CSV/Excel exports: formula-injection guard, quoting, and what each export contains.
import { beforeAll, describe, expect, test } from "vitest";
import { csvCell, toCsv } from "../src/app/exports";
import { accessReview, sampleTable, auditPopulations } from "../src/app/exportData";
import { init } from "../src/engine/state.js";
import { S } from "../src/engine/store.js";
import { G } from "../src/engine/grc.js";
import { finance } from "../src/packs/pacific-crest/finance";

beforeAll(() => { localStorage.clear(); init(); });

describe("CSV cells", () => {
  test("cells a spreadsheet would run as formulas become text", () => {
    for (const bad of ["=HYPERLINK(\"http://x\")", "+1+1", "-2+3", "@SUM(A1)", "\tx"]) expect(csvCell(bad).replace(/^"/, "")).toMatch(/^'/);
    expect(csvCell(-5)).toBe("-5"); // real numbers stay numbers
  });
  test("commas, quotes and line breaks are quoted", () => {
    expect(csvCell('Chen, "Wei"')).toBe('"Chen, ""Wei"""');
    expect(csvCell("a\nb")).toBe('"a\nb"');
    expect(csvCell(null)).toBe("");
  });
  test("files start with a byte-order mark and show money in dollars", () => {
    const csv = toCsv({ name: "t", columns: [{ header: "Name" }, { header: "Total", kind: "money" }], rows: [["José Wiśniewski", 1234567]] });
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.slice(1)).toBe("Name,Total\r\nJosé Wiśniewski,12345.67\r\n");
  });
});

describe("export contents", () => {
  test("access review has one row per user and group, with SoD conflicts named", () => {
    const [review, matrix, sod] = accessReview();
    const users = Object.values(S.users) as any[];
    expect(review.rows.length).toBe(users.reduce((n, u) => n + Math.max(1, u.groups.length), 0));
    const derek = review.rows.filter(r => r[0] === "derek.chan" && r[10] === "APP-SAP-AP-Approve")[0];
    expect(derek[13]).toBe("APP-SAP-AP-Entry + APP-SAP-AP-Approve");
    expect(review.rows.every(r => r.length === review.columns.length)).toBe(true);
    expect(matrix.rows.length).toBeGreaterThan(10);
    expect(sod.rows.length).toBe(3);
  });

  test("GRC samples are blank workpapers: the facts, never the answers", () => {
    for (const g of G.filter((g: any) => g.kind === "table")) {
      const t = sampleTable(g);
      expect(t.rows.length).toBe(g.rows.length);
      const text = JSON.stringify(t);
      for (const r of g.rows) if (r.why) expect(text).not.toContain(r.why);
      expect(t.columns.slice(-2).map(c => c.header)).toEqual(["Conclusion", "Notes"]);
      expect(t.rows.every(r => r.at(-1) === "" && r.at(-2) === "")).toBe(true);
    }
  });

  test("audit populations match the finance records", async () => {
    const f = finance();
    const t = Object.fromEntries((await auditPopulations()).map(x => [x.name, x]));
    expect(t["Purchase orders"].rows.length).toBe(f.pos.length);
    expect(t["Invoices"].rows.length).toBe(f.invoices.length);
    expect(t["Vendors"].rows.length).toBe(f.vendors.length);
    expect(t["Monthly metrics"].rows.length).toBe(12);
    expect(t["Leavers"].rows.map(r => r[0])).toContain("Brian Walsh");
    const po = t["Purchase orders"].rows[0];
    expect(po[9]).toBe(f.pos[0].totalCents);
  });
});

describe("Excel files", () => {
  test("open in a real .xlsx reader with every sheet, header, text and money value intact", async () => {
    const { xlsxFrom } = await import("../src/app/exports");
    const { default: readXlsxFile } = await import("read-excel-file/node");
    const tables = [...accessReview(), { name: "Money & <tricky> [names]", columns: [{ header: "Name" }, { header: "Total", kind: "money" as const }], rows: [["=cmd|' /C calc'!A0", 1234567], ["José Wiśniewski", 5]] }];
    const bytes = await xlsxFrom(tables, [["Company", "Pacific Crest Logistics"]]);
    const book = await readXlsxFile(Buffer.from(bytes));
    expect(book.map(s => s.sheet)).toEqual(["Access review", "Access matrix", "SoD rules", "Money & <tricky>  names ", "About"]);
    const review = book[0].data;
    expect(review[0].slice(0, 3)).toEqual(["Username", "Name", "Employee ID"]);
    expect(review.length).toBe(tables[0].rows.length + 1);
    const money = book[3].data;
    expect(money[1]).toEqual(["=cmd|' /C calc'!A0", 12345.67]); // stored as text, never as a formula
    expect(money[2]).toEqual(["José Wiśniewski", 0.05]);
    expect(book[4].data.at(-1)?.[1]).toMatch(/fictional/);
  });
});
