// AWS-style top navigation with dropdown panels (disclosure pattern): click to open, Escape closes
// and returns focus to the trigger, arrow keys move between items, clicking outside closes.
// Mobile: a slide-out sheet with accordion sections.
import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { EarlyAccess } from "@/components/brand/EarlyAccess";
import { LogoHorizontal } from "@/components/brand/Rolevara";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { INDUSTRIES, LABS, RESOURCES, TRACKS, type Item } from "./catalog";

type Menu = { key: string; label: string; href: string; lead: string; items: Item[] };
const MENUS: Menu[] = [
  { key: "tracks", label: "Tracks", href: "/tracks/", lead: "Role-based tracks, each graded on outcome and process.", items: TRACKS },
  { key: "industries", label: "Industries", href: "/industries/", lead: "Six companies on one engine, each with its own systems and regulations.",
    items: INDUSTRIES.map(c => ({ id: c.id, name: c.name, text: `${c.industry} · ${c.frameworks}`, early: c.early, href: `/industries/#${c.id}` })) },
  { key: "labs", label: "Platform labs", href: "/labs/", lead: "Practise the same scenarios in a real identity platform.", items: LABS },
  { key: "resources", label: "Resources", href: "/resources/", lead: "Grading, runbooks, sample output and accessibility.", items: RESOURCES },
];

// Horizontal logo with the tagline under the wordmark.
export const Brand = ({ small = false }: { small?: boolean }) => <a href="/" className="flex min-w-0 items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"><LogoHorizontal tagline taglineClass={small ? "hidden min-[380px]:block" : undefined} logoClass="h-8" /></a>;

function Panel({ m, id, onClose }: { m: Menu; id: string; onClose: () => void }) {
  return (
    <div id={id} className="absolute inset-x-0 top-full border-b bg-card shadow-xl">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[18rem_1fr]">
        <div className="space-y-3">
          <p className="font-display text-2xl font-extrabold">{m.label}</p>
          <p className="text-muted-foreground">{m.lead}</p>
          <a href={m.href} onClick={onClose} className="inline-flex items-center gap-1 font-semibold text-primary-strong hover:underline">Overview <ArrowRight className="size-4" aria-hidden /></a>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {m.items.map(it => (
            <li key={it.id}>
              <a href={it.href} onClick={onClose} data-menu-item className="block h-full rounded-xl p-3 outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
                <span className="flex flex-wrap items-center gap-2 font-display font-bold">{it.name}{it.early && <EarlyAccess />}</span>
                <span className="mt-1 block text-[15px] leading-snug text-muted-foreground">{it.text}</span>
              </a>
            </li>))}
        </ul>
      </div>
    </div>
  );
}

export function MegaNav({ current }: { current?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const bar = useRef<HTMLDivElement>(null);
  const uid = useId();
  const { theme, setTheme } = useTheme();
  const trigger = (k: string) => bar.current?.querySelector<HTMLButtonElement>(`[data-trigger="${k}"]`);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!bar.current?.contains(e.target as Node)) setOpen(null); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { const k = open; setOpen(null); trigger(k)?.focus(); return; }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const items = [...(bar.current?.querySelectorAll<HTMLElement>("[data-menu-item]") || [])];
      if (!items.length) return;
      e.preventDefault();
      const i = items.indexOf(document.activeElement as HTMLElement);
      const next = e.key === "ArrowDown" ? (i + 1) % items.length : (i <= 0 ? items.length - 1 : i - 1);
      items[next].focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div ref={bar} className="relative">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex items-center gap-8">
            {/* Below 380px the header has room for the logo only; the tagline shows from 380px up. */}
            <Brand small />
            <nav aria-label="Main" className="hidden lg:block">
              <ul className="flex items-center gap-1">
                {MENUS.map(m => (
                  <li key={m.key}>
                    <button type="button" data-trigger={m.key} aria-expanded={open === m.key} aria-controls={`${uid}-${m.key}`}
                      onClick={() => setOpen(o => (o === m.key ? null : m.key))}
                      onKeyDown={e => { if (e.key === "ArrowDown") { e.preventDefault(); setOpen(m.key); requestAnimationFrame(() => bar.current?.querySelector<HTMLElement>("[data-menu-item]")?.focus()); } }}
                      className={cn("inline-flex h-10 items-center gap-1 rounded-lg px-3 font-display text-[15px] font-semibold text-foreground/85 hover:bg-muted hover:text-foreground",
                        (open === m.key || current === m.key) && "text-primary-strong")}>
                      {m.label}<ChevronDown className={cn("size-4 transition-transform", open === m.key && "rotate-180")} aria-hidden />
                    </button>
                  </li>))}
                <li><a href="/pricing/" aria-current={current === "pricing" ? "page" : undefined}
                  className="inline-flex h-10 items-center rounded-lg px-3 font-display text-[15px] font-semibold text-foreground/85 hover:bg-muted hover:text-foreground aria-[current=page]:text-primary-strong">Pricing</a></li>
              </ul>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden min-[380px]:inline-flex" aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun /> : <Moon />}
            </Button>
            <a href="/app/" className="hidden font-display text-[15px] font-semibold text-foreground/85 hover:text-foreground sm:inline">Open the app</a>
            <Button asChild className="h-10 px-4 font-display font-bold sm:px-5"><a href="/app/">Start free</a></Button>
            <Sheet>
              <SheetTrigger asChild><Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu"><Menu /></Button></SheetTrigger>
              <SheetContent side="right" className="w-[22rem] max-w-full overflow-y-auto">
                <SheetHeader><SheetTitle className="text-left"><Brand /></SheetTitle></SheetHeader>
                <nav aria-label="Main" className="px-4 pb-6">
                  <Accordion type="single" collapsible>
                    {MENUS.map(m => (
                      <AccordionItem key={m.key} value={m.key}>
                        <AccordionTrigger className="font-display text-base font-bold">{m.label}</AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-1">
                            <li><a href={m.href} className="block rounded-lg px-2 py-2 font-semibold text-primary-strong hover:bg-muted">{m.label} overview</a></li>
                            {m.items.map(it => <li key={it.id}><a href={it.href} className="flex flex-wrap items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted">{it.name}{it.early && <EarlyAccess />}</a></li>)}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>))}
                  </Accordion>
                  <a href="/pricing/" className="block border-b py-4 font-display text-base font-bold">Pricing</a>
                  <button type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="flex w-full items-center gap-2 border-b py-4 text-left font-display text-base font-bold min-[380px]:hidden">
                    {theme === "dark" ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}{theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                  </button>
                  <Button asChild className="mt-6 w-full font-bold"><a href="/app/">Start free</a></Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        {MENUS.map(m => open === m.key && <Panel key={m.key} m={m} id={`${uid}-${m.key}`} onClose={() => setOpen(null)} />)}
      </div>
    </header>
  );
}
