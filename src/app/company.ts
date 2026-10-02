// The company the learner is working at. Picking one loads its pack into the engine's live
// bindings, then loads that company's own saved progress for the current path.
import { setCompanyData } from "@/engine/company.js";
import { setPolicyData } from "@/engine/policy.js";
import { setTicketData } from "@/engine/ticketSet.js";
import { S } from "@/engine/store.js";
import { init, setCompanyState } from "@/engine/state.js";
import { COMPANIES, DEFAULT_COMPANY, companyById, type CompanyPack } from "@/packs";
import { commit, ui } from "./sim";
import { path, setPath, stateKey, type PathId } from "./pathStore";
import { playJordanWeek } from "./audit/jordan";
import { buildWeekAudit } from "./audit/weekAudit";

const STORE = "rolevara-company";
let active: CompanyPack = DEFAULT_COMPANY;
export const company = () => active;
export { COMPANIES };

// On the GRC-only path the saved week is Jordan Reyes' week, played once and then audited.
export function ensureJordan() {
  if (path() !== "grc" || !active.hasTickets || S.jordan) return;
  playJordanWeek();
  buildWeekAudit("jordan");
}

// Loads the saved progress for the active company and path.
function loadState() {
  setCompanyState(stateKey(active.storageKey), active.hasTickets);
  init();
  ensureJordan();
  // Per-screen UI state belongs to the previous company or path.
  Object.assign(ui, { view: "cur", dirQ: "", dirDept: "All", dirStatus: "all", hintConfirm: null, closeError: null, confirmReset: false, freeHints: {}, tutor: {} });
}

export async function selectCompany(id: string) {
  const p = companyById(id);
  if (!p) return;
  const m = await p.load();
  setCompanyData(m.company);
  setPolicyData(m.policy);
  if (m.tickets) setTicketData(m.tickets);
  active = p;
  loadState();
  try { localStorage.setItem(STORE, id); } catch { /* storage blocked: the choice lasts for this visit */ }
  commit();
}

// Switching path keeps the other paths' progress: each has its own saved state.
export function selectPath(p: PathId) {
  setPath(p);
  loadState();
  commit();
}

// On load, go back to the company used last time.
export async function restoreCompany() {
  let id: string | null = null;
  try { id = localStorage.getItem(STORE); } catch { /* storage blocked */ }
  if (id && id !== active.id && companyById(id)) await selectCompany(id).catch(() => { /* keep the default company */ });
  else ensureJordan();
}
