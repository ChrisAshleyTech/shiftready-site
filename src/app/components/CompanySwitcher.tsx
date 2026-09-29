// Company switcher: the fictional company the learner is working at. Each company keeps its own
// progress, so switching never loses work.
import { useState } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { COMPANIES, company, selectCompany } from "../company";
import { go, useSim } from "../sim";

const ALL = 6; // companies listed on the site

export function CompanySwitcher({ className, showMark = true }: { className?: string; showMark?: boolean }) {
  useSim();
  const c = company();
  const [busy, setBusy] = useState(false);
  const change = async (id: string) => {
    if (id === c.id) return;
    setBusy(true);
    try {
      await selectCompany(id);
      go("#/home");
      toast(`Now working at ${company().name}. Progress at each company is saved separately.`);
    } catch {
      toast("That company couldn't be loaded. Check your connection and try again.");
    } finally { setBusy(false); }
  };
  return (
    <Select value={c.id} onValueChange={change} disabled={busy}>
      <SelectTrigger aria-label="Company" className={cn("min-w-0 gap-2 border-none data-[size=default]:h-auto bg-transparent px-1.5 py-1 shadow-none hover:bg-muted dark:bg-transparent dark:hover:bg-muted", className)}>
        <SelectValue>
          <span className="flex min-w-0 items-center gap-2">
            {showMark && <c.Mark className="size-6 shrink-0" />}
            <span className="truncate font-display text-[13px] font-bold">{c.name}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent position="popper" align="start" className="min-w-72">
        {COMPANIES.map(p => (
          <SelectItem key={p.id} value={p.id} className="py-2">
            <span className="flex items-center gap-2.5">
              <p.Mark className="size-7 shrink-0" />
              <span className="leading-tight">
                <span className="block font-semibold">{p.name}</span>
                <span className="block text-xs text-muted-foreground">{p.industry}{p.hasTickets ? "" : " · tickets in development"}</span>
              </span>
            </span>
          </SelectItem>
        ))}
        {COMPANIES.length < ALL && <>
          <SelectSeparator />
          <SelectGroup><SelectLabel className="max-w-72 text-xs font-normal">More industry companies are in development.</SelectLabel></SelectGroup>
        </>}
      </SelectContent>
    </Select>
  );
}
