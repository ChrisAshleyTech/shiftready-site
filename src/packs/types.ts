import type { ComponentType } from "react";
import type { AppIconKey } from "./appIcons";
import type { Finance } from "./lib/finance";

// Planted directory findings, kept for future audit tickets. Hidden from learners.
export type IamFinding = { kind: "dormant" | "sod" | "excess" | "leaver-active"; user: string; note: string };
// Vendors, purchase orders, invoices and metrics. Loaded only for exports and future tracks.
// A play: what an analyst does on a ticket. Returns the close kind, or [kind, answer] for questions.
export type Play = (id: string) => string | string[];
// One company's tickets and everything that runs them. Pacific Crest's is hand-written
// (pacific-crest/set.js); the industry companies build theirs with lib/ticketKit.js.
export type TicketSet = {
  id: string;
  // Monday tickets, Thursday consequences and standing tickets, hints, and the GRC desk tasks.
  T: any[]; CONSEQ: any[]; BASE_THU: any[]; HINTS: Record<string, any>; CONSEQ_LINKS: Record<string, { mon: string; thu: string }>; G: any[];
  // Doing exactly what each ticket's exact-steps hint says. Tests and Jordan Reyes' week use it.
  playbook: Record<string, Play>;
  // Jordan Reyes' week: close notes, the plays that differ from the playbook (the planted
  // mistakes), one change made without a ticket, and the mistakes for the answer key.
  jordan: { notes: Record<string, string>; plays: Record<string, Play>; unticketed: { after: string; act: [string, string] }; MISTAKES: Record<string, string> };
  // The week audit: who walks the auditor through the process, the populations for each control,
  // the sampling questions' options and the incidents a finding can cite as its effect.
  audit: {
    manager: { name: string; title: string };
    callers: string[]; jml: [string, string, string][]; leavers: [string, string][]; requests: [string, string, string | null][];
    sampling: Record<"APD-03" | "APD-02", [string, boolean][]>;
    effects: Record<string, [string, string][]>;
  };
  // Framework topics for each ticket (see app/frameworks.ts).
  topics: Record<string, string[]>;
  // The GRC desk's top-bar context, page intro and deficiency levels.
  grc: { ctx: string; intro: string; levels: { title: string; items: [string, string][]; note: string } };
};

export type Records = { finance: () => Finance; metricRules: (rows: Finance["metrics"]) => string[]; IAM_KEY: readonly IamFinding[] };

// One fictional company. Metadata and the logo load with the app; the directory, access matrix,
// SoD rules, HR feed and policies load only when the company is picked.
export type CompanyPack = {
  id: string;
  name: string;
  industry: string;
  frameworks: string;
  // localStorage key for this company's saved progress.
  storageKey: string;
  // False until the company's tickets are written: the queue, results and report show a notice.
  hasTickets: boolean;
  // Email domain for usernames in the directory.
  domain: string;
  Mark: ComponentType<{ className?: string }>;
  appIcon: (group: string) => AppIconKey;
  // "On the job": the real products a generic app usually is in this industry. Text only.
  toolNote?: (group: string) => string | undefined;
  // The ticket set comes with the company data when the company has tickets.
  load: () => Promise<{ company: unknown; policy: unknown; tickets?: TicketSet }>;
  loadRecords: () => Promise<Records>;
};
