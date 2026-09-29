// Global search (Ctrl+K / Cmd+K): users, groups, tickets, policies and pages.
import { useEffect, useState } from "react";
import { BookOpenText, FileText, Search, User, UsersRound } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { S } from "@/engine/store.js";
import { T } from "@/engine/tickets.js";
import { THU_T } from "@/engine/thursday.js";
import { ALL_GROUPS } from "@/engine/company.js";
import { POLICIES } from "@/engine/policy.js";
import { NAV } from "../nav";
import { go } from "../sim";
import { company } from "../company";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setOpen(o => !o); } };
    addEventListener("keydown", onKey); return () => removeEventListener("keydown", onKey);
  }, []);
  const pick = (hash: string) => { setOpen(false); go(hash); };
  const tickets = company().hasTickets ? T.concat(S.shift === "thu" ? THU_T : []) : [];
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-keyshortcuts="Control+K Meta+K"
        className="flex h-10 w-full min-w-0 max-w-md items-center gap-2 rounded-xl border border-input/60 bg-background px-3 text-left text-[15px] text-muted-foreground hover:border-primary/50">
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="flex-1 truncate">Search users, groups, tickets and policies</span>
        <kbd className="hidden rounded border bg-muted px-1.5 font-mono text-[11px] sm:inline">Ctrl K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search ShiftReady" description="Search users, groups, tickets, policies and pages">
        <CommandInput placeholder="Search by name, username, ticket ID, group or policy" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Pages">
            {NAV.flatMap(s => s.items).map(i => (
              <CommandItem key={i.k} value={`page ${i.label}`} onSelect={() => pick(`#/${i.k}`)}><i.icon aria-hidden />{i.label}</CommandItem>))}
          </CommandGroup>
          <CommandGroup heading="Tickets">
            {tickets.map((t: any) => (
              <CommandItem key={t.id} value={`ticket ${t.id} ${t.title}`} onSelect={() => pick(`#/queue/${t.id}`)}><FileText aria-hidden /><span className="font-mono text-xs">{t.id}</span><span className="truncate">{t.title}</span></CommandItem>))}
          </CommandGroup>
          <CommandGroup heading="Users">
            {Object.values(S.users).map((u: any) => (
              <CommandItem key={u.id} value={`user ${u.name} ${u.id} ${u.empId} ${u.title}`} onSelect={() => pick(`#/directory/${encodeURIComponent(u.id)}`)}><User aria-hidden /><span>{u.name}</span><span className="truncate text-xs text-muted-foreground">{u.id} · {u.title}</span></CommandItem>))}
          </CommandGroup>
          <CommandGroup heading="Groups">
            {ALL_GROUPS.map((g: string) => (
              <CommandItem key={g} value={`group ${g}`} onSelect={() => pick(`#/groups/${encodeURIComponent(g)}`)}><UsersRound aria-hidden /><span className="font-mono text-xs">{g}</span></CommandItem>))}
          </CommandGroup>
          <CommandGroup heading="Policies">
            {POLICIES.map((p: any) => (
              <CommandItem key={p.key} value={`policy ${p.title}`} onSelect={() => pick(`#/policy?c=${p.key}`)}><BookOpenText aria-hidden />{p.title}</CommandItem>))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
