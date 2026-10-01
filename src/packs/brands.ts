// Company names and marks only, for pages that show a company without loading its data
// (the shared readiness report).
import type { ComponentType } from "react";
import { Mark as PacificCrest } from "./pacific-crest/mark";
import { Mark as HarborHealth } from "./harbor-health/mark";
import { Mark as Meridian } from "./meridian/mark";
import { Mark as Coastline } from "./coastline/mark";
import { Mark as Brightpath } from "./brightpath/mark";
import { Mark as SunsetRetail } from "./sunset-retail/mark";

// desk: the company's GRC audit desk, named after the audit it runs.
export type Brand = { name: string; desk: string; Mark: ComponentType<{ className?: string }> };
export const BRANDS: Record<string, Brand> = {
  "pacific-crest": { name: "Pacific Crest Logistics", desk: "Q3 SOX audit desk", Mark: PacificCrest },
  "harbor-health": { name: "Harbor Health Network", desk: "HIPAA audit desk", Mark: HarborHealth },
  "meridian": { name: "Meridian Aerospace", desk: "CMMC audit desk", Mark: Meridian },
  "coastline": { name: "Coastline Credit Union", desk: "GLBA audit desk", Mark: Coastline },
  "brightpath": { name: "Brightpath SaaS", desk: "SOC 2 audit desk", Mark: Brightpath },
  "sunset-retail": { name: "Sunset Retail Group", desk: "PCI DSS audit desk", Mark: SunsetRetail },
};
export const brandFor = (id?: string | null) => BRANDS[id ?? ""] ?? BRANDS["pacific-crest"];
// "Q3 SOX audit desk" -> "Q3 SOX desk", for tiles.
export const deskShort = (id?: string | null) => brandFor(id).desk.replace(" audit desk", " desk");
