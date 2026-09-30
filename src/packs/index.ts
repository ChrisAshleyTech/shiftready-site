// Every company pack, in the order the switcher lists them.
import { pack as pacificCrest } from "./pacific-crest";
import { pack as harborHealth } from "./harbor-health";
import { pack as meridian } from "./meridian";
import { pack as coastline } from "./coastline";
import { pack as brightpath } from "./brightpath";
import type { CompanyPack } from "./types";

export type { CompanyPack } from "./types";
export const COMPANIES: CompanyPack[] = [pacificCrest, harborHealth, meridian, coastline, brightpath];
export const DEFAULT_COMPANY = pacificCrest;
export const companyById = (id: string | null | undefined) => COMPANIES.find(c => c.id === id);
