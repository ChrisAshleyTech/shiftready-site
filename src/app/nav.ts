// Route map for the admin-center layout: nav sections, breadcrumb trail and page titles.
import { BookOpenText, ClipboardCheck, FileBarChart2, FlaskConical, Home, Inbox, ListChecks, ScrollText, Users, UsersRound, Workflow, type LucideIcon } from "lucide-react";

export type NavItem = { k: string; label: string; icon: LucideIcon; early?: boolean };
export type NavSection = { label: string; items: NavItem[] };

export const NAV: NavSection[] = [
  { label: "Overview", items: [{ k: "home", label: "Home", icon: Home }] },
  { label: "Identity", items: [{ k: "directory", label: "Users", icon: Users }, { k: "groups", label: "Groups", icon: UsersRound }] },
  { label: "Operations", items: [{ k: "queue", label: "Ticket queue", icon: Inbox }, { k: "hr", label: "HR feed", icon: Workflow }] },
  { label: "Governance", items: [{ k: "policy", label: "Policy & matrix", icon: BookOpenText }, { k: "log", label: "Audit log", icon: ScrollText }] },
  { label: "Progress", items: [{ k: "results", label: "Shift results", icon: ListChecks }, { k: "report", label: "Readiness report", icon: FileBarChart2 }] },
  { label: "Audit", items: [{ k: "grc", label: "GRC audit desk", icon: ClipboardCheck }] },
  { label: "Platform labs", items: [{ k: "labs", label: "Connect your lab", icon: FlaskConical, early: true }] },
];

const byKey = Object.fromEntries(NAV.flatMap(s => s.items.map(i => [i.k, { ...i, section: s.label }])));
export const pageInfo = (k: string) => byKey[k] as (NavItem & { section: string }) | undefined;
