import type { ComponentType } from "react";
import type { AppIconKey } from "./appIcons";
import type { Finance } from "./lib/finance";

// Planted directory findings, kept for future audit tickets. Hidden from learners.
export type IamFinding = { kind: "dormant" | "sod" | "excess" | "leaver-active"; user: string; note: string };
// Vendors, purchase orders, invoices and metrics. Loaded only for exports and future tracks.
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
  Mark: ComponentType<{ className?: string }>;
  appIcon: (group: string) => AppIconKey;
  // "On the job": the real products a generic app usually is in this industry. Text only.
  toolNote?: (group: string) => string | undefined;
  load: () => Promise<{ company: unknown; policy: unknown }>;
  loadRecords: () => Promise<Records>;
};
