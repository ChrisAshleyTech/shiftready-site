import type { ComponentType } from "react";
import type { AppIconKey } from "./appIcons";

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
  load: () => Promise<{ company: unknown; policy: unknown }>;
};
