// Company names and marks only, for pages that show a company without loading its data
// (the shared readiness report).
import type { ComponentType } from "react";
import { Mark as PacificCrest } from "./pacific-crest/mark";
import { Mark as HarborHealth } from "./harbor-health/mark";
import { Mark as Meridian } from "./meridian/mark";
import { Mark as Coastline } from "./coastline/mark";

export type Brand = { name: string; Mark: ComponentType<{ className?: string }> };
export const BRANDS: Record<string, Brand> = {
  "pacific-crest": { name: "Pacific Crest Logistics", Mark: PacificCrest },
  "harbor-health": { name: "Harbor Health Network", Mark: HarborHealth },
  "meridian": { name: "Meridian Aerospace", Mark: Meridian },
  "coastline": { name: "Coastline Credit Union", Mark: Coastline },
};
export const brandFor = (id?: string | null) => BRANDS[id ?? ""] ?? BRANDS["pacific-crest"];
