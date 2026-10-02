// A labelled pair of CSV and Excel download buttons.
import { useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ExportButtons({ label, onCsv, onXlsx, className }: { label: string; onCsv?: () => void | Promise<void>; onXlsx: () => Promise<void>; className?: string }) {
  const [busy, setBusy] = useState<null | "csv" | "xlsx">(null);
  const run = async (kind: "csv" | "xlsx", f: () => void | Promise<void>) => {
    setBusy(kind);
    try { await f(); } catch { toast("The file couldn't be created. Try again."); } finally { setBusy(null); }
  };
  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-sm text-muted-foreground" aria-hidden>{label}</span>
      {onCsv && <Button type="button" size="sm" variant="outline" disabled={!!busy} onClick={() => run("csv", onCsv)} aria-label={`${label}, CSV`}>
        <FileText className="size-4" aria-hidden />{busy === "csv" ? "Preparing…" : "CSV"}</Button>}
      <Button type="button" size="sm" variant="outline" disabled={!!busy} onClick={() => run("xlsx", onXlsx)} aria-label={`${label}, Excel`}>
        <FileSpreadsheet className="size-4" aria-hidden />{busy === "xlsx" ? "Preparing…" : "Excel"}</Button>
    </div>
  );
}
