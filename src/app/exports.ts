// CSV and Excel downloads, built in the browser. Nothing is uploaded.
// CSV cells that start with = + - @ (or a tab/return) get a leading apostrophe, so a spreadsheet
// shows them as text instead of running them as formulas. In .xlsx files text cells are never
// formulas, so values are written as they are.

export type Cell = string | number | boolean | null | undefined;
export type Column = { header: string; kind?: "text" | "number" | "money" | "date"; width?: number };
export type Table = { name: string; columns: Column[]; rows: Cell[][] };

export const NOTICE = "Fictional training data from Verdelit. All companies, people and vendors are fictional.";

export function csvCell(v: Cell): string {
  if (v == null) return "";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  let s = v;
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Money columns hold cents; files show dollars.
const out = (c: Column, v: Cell): Cell => (c.kind === "money" && typeof v === "number" ? v / 100 : v);

export function toCsv(t: Table): string {
  const lines = [t.columns.map(c => csvCell(c.header)), ...t.rows.map(r => t.columns.map((c, i) => csvCell(out(c, r[i]))))];
  // Byte-order mark so Excel opens UTF-8 names (José, Wiśniewski) correctly.
  return String.fromCharCode(0xfeff) + lines.map(l => l.join(",")).join("\r\n") + "\r\n";
}

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const downloadCsv = (t: Table, filename: string) => download(new Blob([toCsv(t)], { type: "text/csv;charset=utf-8" }), filename);

export async function xlsxFrom(tables: Table[], about: [string, string][]) {
  const { xlsxBytes } = await import("./xlsx");
  const sheets = tables.map(t => ({
    name: t.name, header: t.columns.map(c => c.header),
    rows: t.rows.map(r => t.columns.map((c, i) => c.kind === "money" && typeof r[i] === "number" ? { value: (r[i] as number) / 100, money: true as const } : r[i])),
    widths: t.columns.map(c => c.width ?? (c.kind === "money" ? 14 : c.kind === "date" ? 12 : 18)),
  }));
  sheets.push({ name: "About", header: ["Item", "Detail"], rows: [...about, ["Notice", NOTICE]], widths: [22, 90] });
  return xlsxBytes(sheets);
}

export async function downloadXlsx(tables: Table[], filename: string, about: [string, string][]) {
  const bytes = await xlsxFrom(tables, about);
  download(new Blob([bytes as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
}

// File names: company, what, date. "pacific-crest-access-review-2026-10-05.csv"
export const fileName = (company: string, what: string, ext: "csv" | "xlsx", date = new Date().toISOString().slice(0, 10)) => `${company}-${what}-${date}.${ext}`;
