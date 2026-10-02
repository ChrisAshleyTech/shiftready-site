// Admin-center shell: collapsible left nav grouped by section (21st Animated Sidebar), top bar with
// global search and shift status, breadcrumbs, and the active-ticket bar.
import { lazy, Suspense, useEffect, useRef, useState, type ComponentType } from "react";
import { ArrowLeft, CircleHelp, Home as HomeIcon, Moon, PanelLeft, Sun } from "lucide-react";
import {
  AnimatedSidebar, AnimatedSidebarClose, AnimatedSidebarContent, AnimatedSidebarFooter, AnimatedSidebarGroup,
  AnimatedSidebarGroupContent, AnimatedSidebarGroupLabel, AnimatedSidebarHeader, AnimatedSidebarInset,
  AnimatedSidebarMenu, AnimatedSidebarMenuButton, AnimatedSidebarMenuItem, AnimatedSidebarProvider,
  AnimatedSidebarRail, AnimatedSidebarTrigger,
} from "@/components/ui/animated-sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { S } from "@/engine/store.js";
import { fmtDay } from "@/engine/company.js";
import { clockStr, totals } from "@/engine/state.js";
import { queueTickets } from "@/engine/followups.js";
import { TK } from "@/engine/tickets.js";
import { G, GK, gTotals } from "@/engine/grc.js";
import { SET } from "@/engine/ticketSet.js";
import { useSim, useRoute, num, pct, type Route } from "./sim";
import { navFor, pageInfo } from "./nav";
import { inPath, path, pathChosen, pathInfo } from "./paths";
import { waTotals, weekAudit } from "./audit/weekAudit";
import { Logo } from "./components/Logo";
import { Logo as BrandLogo } from "@/components/brand/Rolevara";
import { GlobalSearch } from "./components/GlobalSearch";
import { ticketNo, ticketName } from "./ticketLabel";
import { CompanySwitcher } from "./components/CompanySwitcher";
import { NoTickets, CompanyOverview } from "./components/NoTickets";
import { company } from "./company";
import { TrialNotice } from "./components/TrialNotice";
import { Tour } from "./components/Tour";
import { startTour } from "./tour";
import Home from "./pages/Home";
// Other screens load on first use, so the charting library and large pages stay out of the
// initial bundle.
const Reference = lazy(() => import("./pages/Reference"));
const Grc = lazy(() => import("./pages/Grc"));
const Queue = lazy(() => import("./pages/Queue"));
const Directory = lazy(() => import("./pages/Directory"));
const Groups = lazy(() => import("./pages/Groups"));
const Results = lazy(() => import("./pages/Results"));
const Report = lazy(() => import("./pages/Report"));
const Lab = lazy(() => import("./pages/Lab"));
const WeekAudit = lazy(() => import("./pages/WeekAudit"));
const ShiftSummary = lazy(() => import("./pages/ShiftSummary"));
const Settings = lazy(() => import("./pages/Settings"));

// Shown only if a screen takes more than 300 ms to load, to avoid a flash on fast connections.
function Loading() {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 300); return () => clearTimeout(t); }, []);
  return show ? <p role="status" className="t-meta py-10 text-center">Loading…</p> : null;
}

const PAGES: Record<string, ComponentType<{ r: Route }>> = {
  home: Home, queue: Queue, directory: Directory, groups: Groups, policy: Reference, hr: Reference, log: Reference,
  results: Results, report: Report, grc: Grc, labs: Lab, audit: WeekAudit, week: ShiftSummary, settings: Settings,
};

// Screens that need the company's tickets.
const TICKET_PAGES = new Set(["queue", "results", "week", "audit", "report", "grc", "labs"]);

function badgeFor(k: string) {
  if (!company().hasTickets) return k === "log" ? S.log.length || null : null;
  if (k === "queue") return queueTickets().filter((t: any) => !S.tickets[t.id].checks).length || null;
  if (k === "log") return S.log.length || null;
  if (k === "grc") return G.length - gTotals().done || null;
  if (k === "audit") { const t = waTotals(); return weekAudit() ? t.n - t.done || null : null; }
  return null;
}

function Nav({ r }: { r: Route }) {
  return (
    <>
      {navFor().map(s => (
        <AnimatedSidebarGroup key={s.label}>
          <AnimatedSidebarGroupLabel>{s.label}</AnimatedSidebarGroupLabel>
          <AnimatedSidebarGroupContent>
            <AnimatedSidebarMenu>
              {s.items.map(it => { const b = badgeFor(it.k); return (
                <AnimatedSidebarMenuItem key={it.k}>
                  <AnimatedSidebarMenuButton href={`#/${it.k}`} isActive={r.name === it.k} icon={<it.icon className="size-4" />}
                    badge={b != null ? <span className="font-mono">{b}</span> : undefined}>
                    {it.label}
                  </AnimatedSidebarMenuButton>
                </AnimatedSidebarMenuItem>); })}
            </AnimatedSidebarMenu>
          </AnimatedSidebarGroupContent>
        </AnimatedSidebarGroup>
      ))}
    </>
  );
}

// Label for the item selected in the current page, for the last breadcrumb.
function itemLabel(r: Route): string | null {
  if (!r.id) return null;
  if (r.name === "directory") return S.users[r.id]?.name ?? null;
  if (r.name === "groups") return r.id;
  if (r.name === "queue") return TK[r.id] ? ticketNo(TK[r.id]) : r.id;
  if (r.name === "grc") return r.id === "controls" ? "Controls and definitions" : GK[r.id]?.title ?? null;
  if (r.name === "labs") return ({ entra: "Microsoft Entra ID", okta: "Okta", aws: "AWS" } as Record<string, string>)[r.id] ?? null;
  if (r.name === "audit") return r.id === "controls" ? "Controls" : weekAudit()?.tasks.find(t => t.id === r.id)?.step ?? null;
  return null;
}

function Crumbs({ r }: { r: Route }) {
  const p = pageInfo(r.name)!;
  const item = itemLabel(r);
  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem><BreadcrumbLink href="#/home">Rolevara</BreadcrumbLink></BreadcrumbItem>
        {r.name !== "home" && <><BreadcrumbSeparator /><BreadcrumbItem><span>{p.section}</span></BreadcrumbItem></>}
        <BreadcrumbSeparator />
        <BreadcrumbItem>{item ? <BreadcrumbLink href={`#/${r.name}`}>{p.label}</BreadcrumbLink> : <BreadcrumbPage>{p.label}</BreadcrumbPage>}</BreadcrumbItem>
        {item && <><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>{item}</BreadcrumbPage></BreadcrumbItem></>}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function TopBar({ r }: { r: Route }) {
  const c = company();
  const isG = r.name === "grc" && c.hasTickets;
  // The shift audit is the whole job on GRC only, and an optional last step on IAM + GRC.
  const isA = c.hasTickets && !isG && (path() === "grc" || (r.name === "audit" && !!weekAudit()));
  const list = c.hasTickets ? queueTickets() : [];
  const tt = isG ? gTotals() : isA ? waTotals() : totals(list);
  const ctx = isG ? SET.grc.ctx : path() === "grc" ? "Internal audit · Jordan Reyes' shift"
    : isA ? "Internal audit · your shift" : `Service desk · ${fmtDay(0)} · ${clockStr()}`;
  const n = isG ? G.length : isA ? waTotals().n : list.length;
  const { theme, setTheme } = useTheme();
  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b bg-background/90 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/75 md:px-5" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <AnimatedSidebarTrigger className="text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Toggle navigation">
        <PanelLeft aria-hidden className="size-4" />
      </AnimatedSidebarTrigger>
      <div className="hidden min-w-0 items-center gap-2 md:flex">
        <c.Mark className="size-8 shrink-0" />
        <div className="min-w-0 leading-tight">
          <CompanySwitcher showMark={false} className="-my-1 -ml-1.5" />
          <div className="truncate text-[13px] text-muted-foreground">{ctx}</div>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 justify-center px-1 sm:px-2"><GlobalSearch /></div>
      {c.hasTickets && <dl data-tour="progress" className="hidden items-center gap-5 xl:flex" aria-label={`${isG || isA ? "Audit" : "Shift"} progress`}>
        {[[isG || isA ? "Submitted" : "Closed", `${tt.done}/${n}`], ["Points", num(tt.sc)], ["Score", pct(tt.pct)]].map(([k, v]) => (
          <div key={k} className="flex flex-col-reverse leading-tight">
            <dt className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{k}</dt>
            <dd className="font-mono text-sm tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>}
      <Button asChild variant="outline" className="h-9 gap-1.5 px-3 font-semibold">
        <a href="/" aria-label="Home page"><HomeIcon aria-hidden className="size-4" /><span className="hidden sm:inline">Home</span></a>
      </Button>
      <Button variant="ghost" size="icon" aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
    </header>
  );
}

// A screen that belongs to another path, such as the ticket queue on GRC only.
function NotInPath({ label }: { label: string }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-primary/20 bg-card px-6 py-10 text-center">
      <h1 tabIndex={-1} data-page-title className="font-display text-xl font-bold">{label} isn't part of the {pathInfo().name} path</h1>
      <p className="mt-1 text-sm text-muted-foreground">Switch paths in Settings to use it. Your progress on each path is saved separately.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2"><Button asChild><a href="#/home">Back to home</a></Button><Button asChild variant="outline"><a href="#/settings">Change path</a></Button></div>
    </div>
  );
}

function ActiveBar({ r }: { r: Route }) {
  const t = S.active && S.tickets[S.active] && S.tickets[S.active].status === "working" ? TK[S.active] : null;
  if (!t || (r.name === "queue" && r.id === t.id)) return null;
  return (
    <div className="sticky bottom-0 z-20 mt-auto border-t bg-card/95 px-4 py-2.5 backdrop-blur" style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom, 0px))" }}>
      <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">Active ticket · <span className="font-mono">{ticketNo(t)}</span></div>
          <div className="truncate text-sm font-semibold">{ticketName(t)}</div>
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
  const info = pageInfo(r.name)!;
  const last = useRef("");
  useEffect(() => {
    // Move focus to the new content on navigation, so keyboard and screen-reader users land in it.
    const key = r.name + "/" + (r.id || "");
    if (key === last.current) return;
    const samePage = last.current.split("/")[0] === r.name;
    last.current = key;
    document.title = `${itemLabel(r) ?? info.label} · Rolevara`;
    if (!samePage || innerWidth < 1024) scrollTo({ top: 0 });
    // Screens load on demand, so wait (up to ~1 s) for the heading to exist before focusing it.
    let tries = 0, raf = 0;
    const focus = () => {
      const el = (samePage && document.querySelector<HTMLElement>("[data-panel-focus]")) || document.querySelector<HTMLElement>("[data-page-title]");
      if (el) { el.setAttribute("tabindex", "-1"); el.focus({ preventScroll: true }); return; }
      if (++tries < 60) raf = requestAnimationFrame(focus);
    };
    raf = requestAnimationFrame(focus);
    return () => cancelAnimationFrame(raf);
  }, [r.name, r.id, info.label]);

  return (
    <AnimatedSidebarProvider>
      <a href="#main" onClick={e => { e.preventDefault(); document.getElementById("main")?.focus(); }}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:shadow-lg">Skip to content</a>
      <AnimatedSidebar ariaLabel="Rolevara navigation" collapsible="icon" panelClassName="bg-card">
        <AnimatedSidebarHeader className="p-3 pb-1">
          <div className="flex min-h-11 items-center gap-3 overflow-hidden px-1.5">
            <a href="#/home" className="flex min-w-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="hidden shrink-0 group-data-[state=collapsed]/sidebar:block"><Logo className="h-7" title="RolevaraSim" /></span>
              <span className="min-w-0 group-data-[state=collapsed]/sidebar:hidden"><BrandLogo sim className="h-7" /></span>
            </a>
            <AnimatedSidebarClose className="ml-auto text-muted-foreground hover:bg-muted md:hidden"><span aria-hidden>✕</span></AnimatedSidebarClose>
          </div>
          <div className="px-0.5 pt-2 md:hidden"><CompanySwitcher className="w-full justify-start" /></div>
        </AnimatedSidebarHeader>
        <AnimatedSidebarContent><Nav r={r} /></AnimatedSidebarContent>
        <AnimatedSidebarFooter className="border-none">
          <AnimatedSidebarMenu>
            {pathChosen() && company().hasTickets && <AnimatedSidebarMenuItem>
              <AnimatedSidebarMenuButton onSelect={startTour} icon={<CircleHelp className="size-4" />}>How it works</AnimatedSidebarMenuButton>
            </AnimatedSidebarMenuItem>}
            <AnimatedSidebarMenuItem>
              <AnimatedSidebarMenuButton href="/" icon={<ArrowLeft className="size-4" />}>Rolevara site</AnimatedSidebarMenuButton>
            </AnimatedSidebarMenuItem>
          </AnimatedSidebarMenu>
        </AnimatedSidebarFooter>
        <AnimatedSidebarRail />
      </AnimatedSidebar>
      <AnimatedSidebarInset>
        <TopBar r={r} />
        <TrialNotice />
        <div id="main" tabIndex={-1} className="mx-auto w-full max-w-[1480px] flex-1 px-4 py-6 outline-none md:px-6 md:py-7">
          <Crumbs r={r} />
          <Suspense fallback={<Loading />}>
            {!inPath(r.name) ? <NotInPath label={info.label} />
              : company().hasTickets || (r.name === "home" && !pathChosen()) ? <P r={r} /> : r.name === "home" ? <CompanyOverview /> : TICKET_PAGES.has(r.name) ? <NoTickets title={info.label} /> : <P r={r} />}
          </Suspense>
        </div>
        <ActiveBar r={r} />
      </AnimatedSidebarInset>
      <Toaster position="bottom-center" closeButton />
      <Tour route={r.name} />
    </AnimatedSidebarProvider>
  );
}
