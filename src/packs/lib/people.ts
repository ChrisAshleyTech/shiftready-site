// Directory builder for the industry packs. Produces the same user shape as Pacific Crest's
// buildUsers(), so the engine and every screen work unchanged.
import { FIRST, LAST } from "./names";
import { int, pick, rng } from "./util";

export type User = {
  id: string; name: string; empId: string; dept: string; title: string; mgr: string;
  type: "Employee" | "Contractor" | "Service"; enabled: boolean; locked: boolean; mfa: boolean; groups: string[];
  last: number | null; expiry: number | null; revoked: boolean; pwReset: boolean; mfaReset: boolean; preHire: boolean;
};
export type Extra = Partial<User>;
// A hand-written person: [id, name, employee ID, "Dept|Title" role key or null, manager's name, overrides].
export type Core = [string, string, string, string | null, string, Extra?];
// Generated staff: [role key, how many, manager name (or several, used in turn)].
export type Filler = [string, number, string | string[]];

export const slug = (name: string) => name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").toLowerCase()
  .replace(/[^a-z .-]/g, "").trim().replace(/\s+/g, ".");

export function makeDirectory(o: {
  roles: Record<string, string[]>; core: Core[]; filler: Filler[]; seed: number;
  empId: (n: number) => string; firstEmp: number; conId: (n: number) => string;
  contractorExpiry?: [number, number]; lastMax?: number;
}) {
  const U: Record<string, User> = {};
  const K = (id: string, name: string, empId: string, rk: string | null, mgr: string, x: Extra = {}) => {
    const [dept, title] = rk ? rk.split("|") : [x.dept!, x.title!];
    U[id] = Object.assign({ id, name, empId, dept, title, mgr, type: "Employee" as const, enabled: true, locked: false, mfa: true,
      groups: rk ? o.roles[rk].slice() : [], last: 1, expiry: null, revoked: false, pwReset: false, mfaReset: false, preHire: false }, x);
  };
  for (const [id, name, emp, rk, mgr, x] of o.core) K(id, name, emp, rk, mgr, x);

  const r = rng(o.seed);
  const taken = new Set(Object.values(U).map(u => u.name));
  let emp = o.firstEmp, con = 1;
  for (const [rk, n, mgrs] of o.filler) {
    for (let k = 0; k < n; k++) {
      let name = "";
      do { name = `${pick(r, FIRST)} ${pick(r, LAST)}`; } while (taken.has(name));
      taken.add(name);
      let id = slug(name); while (U[id]) id += "2";
      const mgr = Array.isArray(mgrs) ? mgrs[k % mgrs.length] : mgrs;
      const x: Extra = { last: int(r, 0, o.lastMax ?? 29) };
      const isCon = rk.endsWith("Contractor");
      if (isCon) { x.type = "Contractor"; const [lo, hi] = o.contractorExpiry ?? [20, 80]; x.expiry = int(r, lo, hi); }
      K(id, name, isCon ? o.conId(con++) : o.empId(emp++), rk, mgr, x);
    }
  }
  return U;
}
