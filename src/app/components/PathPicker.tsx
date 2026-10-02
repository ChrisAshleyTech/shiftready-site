// Path picker: three cards, one button each. Shown on Home on the first visit and in Settings.
import { Check, ClipboardCheck, Inbox, Layers } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PATHS, path, pathChosen, type PathId } from "../paths";
import { selectPath } from "../company";
import { focusSoon, go } from "../sim";

const ICON: Record<PathId, typeof Inbox> = { iam: Inbox, "iam-grc": Layers, grc: ClipboardCheck };

export function PathPicker({ headingLevel = 2, onPicked }: { headingLevel?: 2 | 3; onPicked?: (p: PathId) => void }) {
  const current = pathChosen() ? path() : null;
  const H = `h${headingLevel}` as "h2" | "h3";
  const pick = (p: PathId) => {
    if (p === current) return;
    const first = !current;
    selectPath(p);
    toast(first ? `${PATHS.find(x => x.id === p)!.name} it is. You can switch any time in Settings.` : `Switched to ${PATHS.find(x => x.id === p)!.name}. Your progress on the other paths is kept.`);
    if (onPicked) onPicked(p); else { go("#/home"); focusSoon("[data-page-title]"); }
  };
  return (
    <ul className="grid gap-4 lg:grid-cols-3">
      {PATHS.map(p => {
        const Icon = ICON[p.id], on = p.id === current;
        return (
          <li key={p.id} className={cn("flex flex-col gap-4 rounded-2xl border bg-card p-5", on && "border-primary ring-1 ring-primary")}>
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-primary/12 text-primary-strong"><Icon className="size-5" aria-hidden /></span>
              {on && <span className="inline-flex items-center gap-1 rounded-md bg-primary/12 px-2 py-1 text-xs font-semibold text-primary-strong"><Check className="size-3.5" aria-hidden />Current path</span>}
            </div>
            <div className="space-y-1">
              <H className="font-display text-xl font-bold">{p.name}</H>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">You play: {p.role}</p>
            </div>
            <p className="text-sm">{p.blurb}</p>
            <ol className="space-y-1 text-sm text-muted-foreground">
              {p.steps.map((s, i) => <li key={s} className="flex gap-2"><span className="font-mono text-xs leading-5 text-primary-strong">{i + 1}</span>{s}</li>)}
            </ol>
            <div className="mt-auto pt-1">
              {on ? <Button variant="outline" disabled className="w-full">Current path</Button>
                : <Button className="w-full font-bold" onClick={() => pick(p.id)} aria-label={`${current ? "Switch to" : "Choose"} ${p.name}`}>{current ? "Switch to" : "Choose"} {p.name}</Button>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
