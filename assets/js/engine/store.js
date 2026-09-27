// Live simulator state plus the grading helpers every ticket uses.
// `S` is an ES-module live binding: modules that import it always see the
// current state object, so the original grading functions run unchanged.
import { ROLES, SOD } from "./company.js";

export let S = null;
export function setState(next){ S = next; }

// ---------- Grading helpers (verbatim from the original simulator) ----------
export const U = id => S.users[id];
export const has = (id,g) => U(id).groups.includes(g);
export const C = (pass,label,pts,detail="") => ({pass:!!pass,label,pts,detail});
export function roleCheck(id,rk,pts){
  const want=ROLES[rk], have=U(id).groups;
  const missing=want.filter(g=>!have.includes(g)), extra=have.filter(g=>!want.includes(g));
  const ok=!missing.length&&!extra.length;
  return C(ok,"Groups match the "+rk.split("|")[1]+" role in the access matrix",pts,
    ok?"":[missing.length?"Missing: "+missing.join(", "):"",extra.length?"Extra: "+extra.join(", "):""].filter(Boolean).join(" · "));
}
export const firstIdx = f => S.log.findIndex(f);
export function verifiedBefore(tid,acts,target){
  const v=firstIdx(e=>e.ticket===tid&&e.a==="verify");
  const r=firstIdx(e=>acts.includes(e.a)&&e.target===target);
  return v>=0 && (r<0 || v<r);
}
export function approvalBefore(tid,test){
  const v=firstIdx(e=>e.ticket===tid&&e.a==="approval");
  const r=firstIdx(test);
  return v>=0 && (r<0 || v<r);
}
export const esc = (ts,who) => (ts.esc||[]).includes(who);
export const sodConflicts = id => SOD.filter(([a,b])=>has(id,a)&&has(id,b));
