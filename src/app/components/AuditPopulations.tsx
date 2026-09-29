// Download the populations an auditor samples from: users, joiners, leavers, vendors, purchase
// orders, invoices and monthly metrics. One population as CSV, or all of them as one workbook.
import { useId, useState } from "react";
import { fmtDay } from "@/engine/company.js";
import { auditPopulations } from "../exportData";
import { downloadCsv, downloadXlsx, fileName } from "../exports";
import { company } from "../company";
import { ExportButtons } from "./ExportButtons";

const NAMES = ["Users", "Joiners", "Leavers", "Vendors", "Purchase orders", "Invoices", "Monthly metrics"];
const slugOf = (s: string) => s.toLowerCase().replace(/\s+/g, "-");

export function AuditPopulations({ className }: { className?: string }) {
  const [which, setWhich] = useState(NAMES[0]);
  const id = useId();
  const c = company();
  return (
    <section aria-labelledby={`${id}-h`} className={className}>
      <h2 id={`${id}-h`} className="font-semibold">Audit populations</h2>
      <p className="mt-1 text-sm text-muted-foreground">{c.name}'s records for Oct 2025 to Sep 2026, to sample from. Fictional data.</p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor={id} className="text-sm font-medium">Population</label>
          <select id={id} value={which} onChange={e => setWhich(e.target.value)} className="block h-9 rounded-md border border-input bg-background px-3 text-sm">
            {NAMES.map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
        <ExportButtons label="Download" onCsv={async () => {
          const t = (await auditPopulations()).find(t => t.name === which)!;
          downloadCsv(t, fileName(c.id, slugOf(which), "csv"));
        }} onXlsx={async () => downloadXlsx(await auditPopulations(), fileName(c.id, "audit-populations", "xlsx"),
          [["Company", c.name], ["Contents", "Audit populations: " + NAMES.join(", ")], ["Period", "Oct 1, 2025 to Sep 30, 2026"], ["Directory as of", fmtDay(0)]])} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">CSV downloads the selected population; Excel includes all seven as sheets.</p>
    </section>
  );
}
