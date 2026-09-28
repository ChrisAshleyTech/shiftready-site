// App shell: 21st Animated Sidebar, top bar with shift context and score, active-ticket bar.
import { useEffect, useRef, type ComponentType } from "react";
import {
  BookOpenText, ClipboardCheck, FileBarChart2, Home as HomeIcon, Inbox, ListChecks, Moon, PanelLeft,
  ScrollText, Sun, Users, Workflow, ArrowLeft,
} from "lucide-react";
import {
  AnimatedSidebar, AnimatedSidebarClose, AnimatedSidebarContent, AnimatedSidebarFooter, AnimatedSidebarGroup,
  AnimatedSidebarGroupContent, AnimatedSidebarGroupLabel, AnimatedSidebarHeader, AnimatedSidebarInset,
  AnimatedSidebarMenu, AnimatedSidebarMenuButton, AnimatedSidebarMenuItem, AnimatedSidebarProvider,
  AnimatedSidebarRail, AnimatedSidebarTrigger,
} from "@/components/ui/animated-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { S } from "@/engine/store.js";
import { fmtDay } from "@/engine/company.js";
import { clockStr, totals } from "@/engine/state.js";
import { curTickets } from "@/engine/thursday.js";
import { TK } from "@/engine/tickets.js";
import { G, gTotals } from "@/engine/grc.js";
import { useSim, useRoute, ui, num, pct, type Route } from "./sim";
import { Logo } from "./components/Logo";
import Reference from "./pages/Reference";
import Grc from "./pages/Grc";
import Soon from "./pages/Soon";
import Home from "./pages/Home";

const PAGES: Record<string, { C: ComponentType<{ r: Route }>; title: string }> = {
  home: { C: Home, title: "Home" },
  queue: { C: Soon, title: "Ticket queue" },
  directory: { C: Soon, title: "Directory" },
  policy: { C: Reference, title: "Policy & matrix" },
  hr: { C: Reference, title: "HR feed" },
  log: { C: Reference, title: "Audit log" },
  results: { C: Soon, title: "Shift results" },
  report: { C: Soon, title: "Readiness report" },
  grc: { C: Grc, title: "GRC audit desk" },
};

function Nav({ r }: { r: Route }) {
  const open = curTickets(ui.view).filter((t: any) => !S.tickets[t.id].checks).length;
  const gt = gTotals();
  const groups = [
    { label: "Shift", items: [
      { k: "home", label: "Home", icon: HomeIcon },
      { k: "queue", label: "Ticket queue", icon: Inbox, badge: open || null },
      { k: "directory", label: "Directory", icon: Users },
    ]},
    { label: "Reference", items: [
      { k: "policy", label: "Policy & matrix", icon: BookOpenText },
      { k: "hr", label: "HR feed", icon: Workflow },
      { k: "log", label: "Audit log", icon: ScrollText, badge: S.log.length || null },
    ]},
    { label: "Progress", items: [
      { k: "results", label: "Shift results", icon: ListChecks },
      { k: "report", label: "Readiness report", icon: FileBarChart2 },
    ]},
    { label: "GRC track", items: [
      { k: "grc", label: "Audit desk", icon: ClipboardCheck, badge: G.length - gt.done || null },
    ]},
  ];
  return (
    <>
      {groups.map(g => (
        <AnimatedSidebarGroup key={g.label}>
          <AnimatedSidebarGroupLabel>{g.label}</AnimatedSidebarGroupLabel>
          <AnimatedSidebarGroupContent>
            <AnimatedSidebarMenu>
              {g.items.map(it => (
                <AnimatedSidebarMenuItem key={it.k}>
                  <AnimatedSidebarMenuButton href={`#/${it.k}`} isActive={r.name === it.k} icon={<it.icon className="size-4" />}
                    badge={it.badge != null ? <span className="font-mono">{it.badge}</span> : undefined}>
                    {it.label}
                  </AnimatedSidebarMenuButton>
                </AnimatedSidebarMenuItem>
              ))}
            </AnimatedSidebarMenu>
          </AnimatedSidebarGroupContent>
        </AnimatedSidebarGroup>
      ))}
    </>
  );
}

function TopBar({ r }: { r: Route }) {
  const isG = r.name === "grc";
  const list = curTickets(ui.view);
  const tt = isG ? gTotals() : totals(list);
  const isThu = S.shift === "thu" && ui.view !== "mon";
  const ctx = isG ? ["Internal Audit · Q3 SOX ITGC", "Fieldwork week of " + fmtDay(0)]
    : [`Pacific Crest Logistics · ${isThu ? "Thursday" : "Monday"} shift`, `${isThu ? "Thu, " + fmtDay(3) : "Mon, " + fmtDay(0)} · ${clockStr()}`];
  const n = isG ? G.length : list.length;
  const { theme, setTheme } = useTheme();
  return (
    <header className="sticky top-0 z-30 flex min-h-14 items-center gap-3 border-b bg-background/90 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/75 md:px-5" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <AnimatedSidebarTrigger className="text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Toggle navigation">
        <PanelLeft aria-hidden className="size-4" />
      </AnimatedSidebarTrigger>
      <div className="h-5 w-px bg-border" aria-hidden />
      <div className="min-w-0 flex-1 leading-tight">
        <div className="truncate font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">{ctx[0]}</div>
        <div className="truncate text-sm font-medium">{ctx[1]}</div>
      </div>
      <dl className="hidden items-center gap-5 sm:flex" aria-label={`${isG ? "Audit" : "Shift"} progress`}>
        {[[isG ? "Submitted" : "Closed", `${tt.done}/${n}`], ["Points", num(tt.sc)], ["Score", pct(tt.pct)]].map(([k, v]) => (
          <div key={k} className="flex flex-col-reverse leading-tight">
            <dt className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{k}</dt>
            <dd className="font-mono text-sm tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      <Button variant="ghost" size="icon" aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
    </header>
  );
}

function ActiveBar({ r }: { r: Route }) {
  const t = S.active && S.tickets[S.active] && S.tickets[S.active].status === "working" ? TK[S.active] : null;
  if (!t || (r.name === "queue" && r.id === t.id)) return null;
  return (
    <div className="sticky bottom-0 z-20 mt-auto border-t bg-card/95 px-4 py-2.5 backdrop-blur" style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom, 0px))" }}>
      <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">Active ticket · <span className="font-mono">{t.id}</span></div>
          <div className="truncate text-sm font-medium">{t.title}</div>
        </div>
        <Button asChild size="sm"><a href={`#/queue/${t.id}`}>Back to ticket</a></Button>
      </div>
    </div>
  );
}

export default function App() {
  useSim();
  const r = useRoute();
  const P = PAGES[r.name];
  const last = useRef("");
  useEffect(() => {
    // Move focus to the new content on navigation, so keyboard and screen-reader users land in it.
    const key = r.name + "/" + (r.id || "");
    if (key === last.current) return;
    const samePage = last.current.split("/")[0] === r.name;
    last.current = key;
    document.title = `${P.title} · ShiftReady`;
    requestAnimationFrame(() => {
      const el = (samePage && document.querySelector<HTMLElement>("[data-panel-focus]")) || document.querySelector<HTMLElement>("[data-page-title]");
      el?.setAttribute("tabindex", "-1"); el?.focus({ preventScroll: true });
      if (!samePage || innerWidth < 1024) scrollTo({ top: 0 });
    });
  }, [r.name, r.id, P.title]);

  return (
    <AnimatedSidebarProvider>
      <a href="#main" onClick={e => { e.preventDefault(); document.getElementById("main")?.focus(); }}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:shadow-lg">Skip to content</a>
      <AnimatedSidebar ariaLabel="ShiftReady navigation" collapsible="icon" panelClassName="bg-card/40">
        <AnimatedSidebarHeader className="p-3 pb-1">
          <div className="flex min-h-11 items-center gap-3 overflow-hidden px-1.5">
            <a href="#/home" className="flex min-w-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Logo className="size-7 shrink-0" />
              <span className="min-w-0 group-data-[state=collapsed]/sidebar:hidden">
                <span className="block truncate font-display text-base font-semibold leading-tight">ShiftReady</span>
                <span className="block truncate text-[11px] text-muted-foreground">Pacific Crest · IAM desk</span>
              </span>
            </a>
            <AnimatedSidebarClose className="ml-auto text-muted-foreground hover:bg-muted md:hidden"><span aria-hidden>✕</span></AnimatedSidebarClose>
          </div>
        </AnimatedSidebarHeader>
        <AnimatedSidebarContent><Nav r={r} /></AnimatedSidebarContent>
        <AnimatedSidebarFooter className="border-none">
          <AnimatedSidebarMenu>
            <AnimatedSidebarMenuItem>
              <AnimatedSidebarMenuButton href="/" icon={<ArrowLeft className="size-4" />}>ShiftReady site</AnimatedSidebarMenuButton>
            </AnimatedSidebarMenuItem>
          </AnimatedSidebarMenu>
        </AnimatedSidebarFooter>
        <AnimatedSidebarRail />
      </AnimatedSidebar>
      <AnimatedSidebarInset>
        <TopBar r={r} />
        <div id="main" tabIndex={-1} className="mx-auto w-full max-w-[1480px] flex-1 px-4 py-6 outline-none md:px-6 md:py-8">
          <P.C r={r} />
        </div>
        <ActiveBar r={r} />
      </AnimatedSidebarInset>
      <Toaster position="bottom-center" closeButton />
    </AnimatedSidebarProvider>
  );
}
