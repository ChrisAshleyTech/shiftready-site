// The company the learner is working at. Picking one loads its pack into the engine's live
// bindings, then loads that company's own saved progress.
import { setCompanyData } from "@/engine/company.js";
import { setPolicyData } from "@/engine/policy.js";
import { init, setCompanyState } from "@/engine/state.js";
import { COMPANIES, DEFAULT_COMPANY, companyById, type CompanyPack } from "@/packs";
import { commit, ui } from "./sim";

const STORE = "shiftready-company";
let active: CompanyPack = DEFAULT_COMPANY;
export const company = () => active;
export { COMPANIES };

export async function selectCompany(id: string) {
  const p = companyById(id);
  if (!p) return;
  const m = await p.load();
  setCompanyData(m.company);
  setPolicyData(m.policy);
  setCompanyState(p.storageKey, p.hasTickets);
  init();
  active = p;
  // Per-screen UI state belongs to the previous company's data.
  Object.assign(ui, { view: "cur", dirQ: "", dirDept: "All", dirStatus: "all", hintConfirm: null, closeError: null, confirmReset: false, freeHints: {}, tutor: {} });
  try { localStorage.setItem(STORE, id); } catch { /* storage blocked: the choice lasts for this visit */ }
  commit();
}

// On load, go back to the company used last time.
export async function restoreCompany() {
  let id: string | null = null;
  try { id = localStorage.getItem(STORE); } catch { /* storage blocked */ }
  if (id && id !== active.id && companyById(id)) await selectCompany(id).catch(() => { /* keep the default company */ });
}
