// Route map for the admin-center layout: nav sections, breadcrumb trail and page titles.
import { BookOpenText, CalendarCheck, ClipboardCheck, FileBarChart2, FileSearch, FlaskConical, Home, Inbox, ListChecks, ScrollText, Settings, Users, UsersRound, Workflow, type LucideIcon } from "lucide-react";
import { inPath, path } from "./paths";
import { company } from "./company";
import { brandFor } from "@/packs/brands";

export type NavItem = { k: string; label: string; icon: LucideIcon; early?: boolean };
export type NavSection = { label: string; items: NavItem[] };

export const NAV: NavSection[] = [
  { label: "Overview", items: [{ k: "home", label: "Home", icon: Home }] },
  { label: "Identity", items: [{ k: "directory", label: "Users", icon: Users }, { k: "groups", label: "Groups", icon: UsersRound }] },
  { label: "Operations", items: [{ k: "queue", label: "Ticket queue", icon: Inbox }, { k: "hr", label: "HR feed", icon: Workflow }] },
  { label: "Governance", items: [{ k: "policy", label: "Policy & matrix", icon: BookOpenText }, { k: "log", label: "Audit log", icon: ScrollText }] },
  { label: "Audit", items: [{ k: "audit", label: "Audit your shift", icon: FileSearch }, { k: "grc", label: "Q3 SOX audit desk", icon: ClipboardCheck }] },
  { label: "Progress", items: [{ k: "results", label: "Shift results", icon: ListChecks }, { k: "week", label: "Shift summary", icon: CalendarCheck }, { k: "report", label: "Readiness report", icon: FileBarChart2 }] },
  { label: "Platform labs", items: [{ k: "labs", label: "Connect your lab", icon: FlaskConical, early: true }] },
  { label: "Account", items: [{ k: "settings", label: "Settings", icon: Settings }] },
];

// The shift audit is the learner's own shift on IAM + GRC, and Jordan's shift on GRC only. The GRC
// desk is named after the company's audit.
const label = (i: NavItem) => (i.k === "audit" && path() === "grc" ? "Audit Jordan's shift" : i.k === "grc" ? deskName() : i.label);
const deskName = () => { const d = brandFor(company().id).desk; return d[0].toUpperCase() + d.slice(1); };
const byKey = Object.fromEntries(NAV.flatMap(s => s.items.map(i => [i.k, { ...i, section: s.label }])));
export const pageInfo = (k: string) => { const i = byKey[k] as (NavItem & { section: string }) | undefined; return i && { ...i, label: label(i) }; };
// The nav for the current path: screens outside it are hidden, and empty sections dropped.
export const navFor = () => NAV.map(s => ({ ...s, items: s.items.filter(i => inPath(i.k)).map(i => ({ ...i, label: label(i) })) })).filter(s => s.items.length);
