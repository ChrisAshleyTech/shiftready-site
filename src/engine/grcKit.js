// Shared building blocks for every company's GRC audit desk: answer options, row builders for the
// sample tables, and task G4, which audits the learner's own IAM shift (or Jordan Reyes' shift).
import { T } from "./tickets.js";
import { totals } from "./state.js";

export const PROV_OPTS=["Pass","Exception: no approval on file","Exception: provisioned before approval","Exception: access exceeds role"];
export const TERM_OPTS=["Pass","Exception: disabled late","Exception: disabled late, signed in after termination","Exception: not disabled as of extract"];

// Row builders for a company's sample tables. `roles` is the company's own access matrix.
export const rowKit = roles => ({
  J:(name,rk,hire,appr,prov,extra,correct,why)=>({name,sub:rk.replace("|"," / "),correct,why,
    kv:[["Hire date",hire],["Manager approval",appr],["Provisioned",prov],["Groups granted",roles[rk].concat(extra||[]).join(", ")]]}),
  X:(name,role,term,dis,last,correct,why)=>({name,sub:role,correct,why,kv:[["HR termination date",term],["Account disabled",dis],["Last sign-in",last]]}),
  RR:(name,sub,l,i,correct)=>({name,sub,correct,kv:[["Likelihood",l],["Impact",i]]}),
});

export const G4 = {id:"G4",ctrl:"APD-03",title:"Audit your own IAM Ops shift",kind:"quiz",dynamic:true,
  intro:"<p><b>APD-03:</b> Every account change is tied to an approved ticket, and caller identity is verified before any credential change.</p><p>The evidence is <b>your own</b> IAM Ops audit log (Audit log tab). Test it the way an auditor would.</p>",
  lock:()=>totals(T).done<10?"Close at least 10 IAM Ops tickets first. This task audits that work.":null,
  lesson:"Auditors test the log, not the story. Changes without a ticket and resets before verification are exceptions no matter who made them, including you."};
