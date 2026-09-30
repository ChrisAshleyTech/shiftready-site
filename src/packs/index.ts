// Every company pack, in the order the switcher lists them.
import { pack as pacificCrest } from "./pacific-crest";
import { pack as harborHealth } from "./harbor-health";
import { pack as meridian } from "./meridian";
import type { CompanyPack } from "./types";

export type { CompanyPack } from "./types";
export const COMPANIES: CompanyPack[] = [pacificCrest, harborHealth, meridian];
export const DEFAULT_COMPANY = pacificCrest;
export const companyById = (id: string | null | undefined) => COMPANIES.find(c => c.id === id);
