// Route map for the admin-center layout: nav sections, breadcrumb trail and page titles.
import { BookOpenText, CalendarCheck, ClipboardCheck, FileBarChart2, FileSearch, FlaskConical, Home, Inbox, ListChecks, ScrollText, Settings, Users, UsersRound, Workflow, type LucideIcon } from "lucide-react";
import { inPath, path } from "./paths";

export type NavItem = { k: string; label: string; icon: LucideIcon; early?: boolean };
export type NavSection = { label: string; items: NavItem[] };

export const NAV: NavSection[] = [
  { label: "Overview", items: [{ k: "home", label: "Home", icon: Home }] },
  { label: "Identity", items: [{ k: "directory", label: "Users", icon: Users }, { k: "groups", label: "Groups", icon: UsersRound }] },
  { label: "Operations", items: [{ k: "queue", label: "Ticket queue", icon: Inbox }, { k: "hr", label: "HR feed", icon: Workflow }] },
  { label: "Governance", items: [{ k: "policy", label: "Policy & matrix", icon: BookOpenText }, { k: "log", label: "Audit log", icon: ScrollText }] },
  { label: "Audit", items: [{ k: "audit", label: "Friday audit", icon: FileSearch }, { k: "grc", label: "Q3 SOX audit desk", icon: ClipboardCheck }] },
  { label: "Progress", items: [{ k: "results", label: "Shift results", icon: ListChecks }, { k: "week", label: "Week summary", icon: CalendarCheck }, { k: "report", label: "Readiness report", icon: FileBarChart2 }] },
  { label: "Platform labs", items: [{ k: "labs", label: "Connect your lab", icon: FlaskConical, early: true }] },
  { label: "Account", items: [{ k: "settings", label: "Settings", icon: Settings }] },
];

// The week audit is the learner's own Friday on IAM + GRC, and Jordan's week on GRC only.
const label = (i: NavItem) => (i.k === "audit" && path() === "grc" ? "Audit Jordan's week" : i.label);
const byKey = Object.fromEntries(NAV.flatMap(s => s.items.map(i => [i.k, { ...i, section: s.label }])));
export const pageInfo = (k: string) => { const i = byKey[k] as (NavItem & { section: string }) | undefined; return i && { ...i, label: label(i) }; };
// The nav for the current path: screens outside it are hidden, and empty sections dropped.
export const navFor = () => NAV.map(s => ({ ...s, items: s.items.filter(i => inPath(i.k)).map(i => ({ ...i, label: label(i) })) })).filter(s => s.items.length);
