// Persistence, directory/ticket actions and scoring. Action and grading logic is
// the original simulator's; UI side effects (toast, render) moved to the caller,
// which receives the message to show instead.
import { S, setState, U, C } from "./store.js";
import { buildUsers, fmtDay } from "./company.js";
import { T, TK } from "./tickets.js";
import { buildFollow, queueTickets, afterClose, migrate } from "./followups.js";

// Each company saves its own progress. Pacific Crest keeps the original single-file simulator's key,
// so existing progress carries over. Companies whose tickets are still in development start with none.
export let KEY = "pcl-iam-sim-v1";
export let HAS_TICKETS = true;
export function setCompanyState(key, hasTickets){ KEY = key; HAS_TICKETS = hasTickets; }
export function fresh(){ return {users:buildUsers(),tickets:Object.fromEntries((HAS_TICKETS?T:[]).map(t=>[t.id,{status:"new",esc:[]}])),log:[],active:null,clock:480,grc:{}}; }
// Progress saved before a company had tickets has none of them (and an older directory), so it
// starts fresh.
function load(){ try{ const s=JSON.parse(localStorage.getItem(KEY)); if(s&&s.users&&s.tickets&&!(HAS_TICKETS&&T.some(t=>!s.tickets[t.id]))){ s.grc=s.grc||{}; return s; } }catch(e){} return fresh(); }
export function save(){ try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){} }

export function init(){ setState(load()); if(HAS_TICKETS){ migrate(); buildFollow(); } }
export function resetAll(){ setState(fresh()); buildFollow(); save(); }

export const clockStr=()=>{ const m=S.clock,h=Math.floor(m/60),mm=m%60; return ((h+11)%12+1)+":"+String(mm).padStart(2,"0")+(h<12?" AM":" PM"); };
export function logIt(a,target,d){ S.clock+=2; S.log.push({n:S.log.length+1,t:clockStr(),ticket:S.active,a,target,d}); }

// ---------- Actions ----------
// Returns the change description, or null when nothing changed.
export function act(a,uid,arg){
  const u=U(uid); let d="";
  switch(a){
    case "enable": u.enabled=true; d="Account enabled"; break;
    case "disable": u.enabled=false; d="Account disabled"; break;
    case "unlock": u.locked=false; d="Account unlocked"; break;
    case "pwreset": u.pwReset=true; d="Temporary password issued, change required at next sign-in"; break;
    case "mfareset": u.mfa=false; u.mfaReset=true; d="MFA methods cleared, re-registration required"; break;
    case "revoke": u.revoked=true; d="All sessions and refresh tokens revoked"; break;
    case "addgrp": if(!arg||u.groups.includes(arg)) return null; u.groups.push(arg); d="Added to "+arg; break;
    case "rmgrp": u.groups=u.groups.filter(g=>g!==arg); if(u.jit) delete u.jit[arg]; d="Removed from "+arg; break;
    // PAM: activate a privileged group for a limited time ("GROUP|hours"). A standing member has
    // to be removed first, so a permanent grant can't be relabelled as just in time.
    case "jit": { const [g,h]=String(arg||"").split("|"), n=parseInt(h,10); if(!g||isNaN(n)||n<=0) return null;
      if(u.groups.includes(g)&&!(u.jit&&u.jit[g])) return null;
      if(!u.groups.includes(g)) u.groups.push(g); u.jit={...(u.jit||{}),[g]:n}; d="Activated "+g+" just in time for "+n+(n===1?" hour":" hours"); break; }
    // PAM: the vault sets a new credential; whoever knew the old one can't use it.
    case "rotate": u.rotated=true; d="Credential rotated in the vault, the old password no longer works"; break;
    case "job": { const [dp,ti]=arg.split("|"); u.dept=dp; u.title=ti; d="Job info set to "+dp+" / "+ti; break; }
    case "expiry": { const n=parseInt(arg,10); u.expiry=isNaN(n)||n<=0?null:n; d=u.expiry?"Account expiry set to "+fmtDay(u.expiry):"Account expiry cleared"; break; }
  }
  logIt(a,uid,d); save();
  return d;
}
// Ticket-level actions. Returns a message worth announcing, or null.
export function tact(a,tid,arg){
  const ts=S.tickets[tid]; let msg=null;
  if(a==="start"){ ts.status="working"; S.active=tid; logIt("start",null,"Started work"); }
  if(a==="verify"){ logIt("verify",null,"Caller identity marked verified"); msg="Identity marked verified"; }
  if(a==="approval"){ ts.approval=TK[tid].approval||"No approver is associated with this request."; logIt("approval",null,"Manager approval requested"); }
  if(a==="escalate"){ if(!ts.esc.includes(arg)) ts.esc.push(arg); logIt("escalate",null,"Escalated to "+arg); msg="Escalated to "+arg; }
  if(a==="resume"){ S.active=tid; }
  save();
  return msg;
}
// Closes and grades a ticket. Returns an error message, or null on success.
export function closeTicket(tid,kind,{note="",answer}={}){
  const t=TK[tid], ts=S.tickets[tid];
  ts.note=note||"";
  if(answer!==undefined) ts.answer=answer;
  if(t.question && !String(ts.answer||"").trim()) return "Enter an answer before closing";
  S.active=tid; logIt("close",null,kind==="resolve"?"Resolved":"Rejected");
  const checks=t.grade(ts);
  checks.push(C(kind===t.close, t.close==="resolve"?"Closed as resolved":"Closed as rejected (request shouldn't be fulfilled)", 1));
  ts.status=kind==="resolve"?"resolved":"rejected";
  // A reopened ticket keeps its first resolution's grade; this attempt is kept for review.
  if(ts.first){ ts.last=checks; ts.checks=ts.first.checks; ts.score=ts.first.score; ts.max=ts.first.max; }
  else { ts.checks=checks; ts.score=checks.filter(c=>c.pass).reduce((s,c)=>s+c.pts,0); ts.max=checks.reduce((s,c)=>s+c.pts,0); }
  S.active=null; afterClose(tid); save();
  return null;
}

// ---------- Hints ----------
// Cost is set by the highest tier revealed before the ticket closed (not cumulative).
// ts.score stays the raw graded score; the penalty is applied on top of it.
export const HINT_TIERS = [
  {key:"nudge", label:"Nudge", cost:0.10},
  {key:"clause", label:"Policy clause", cost:0.25},
  {key:"steps", label:"Exact steps", cost:0.50},
];
export const hintsUsed = ts => ts.hints||0;
export const hintCost = ts => hintsUsed(ts) ? HINT_TIERS[hintsUsed(ts)-1].cost : 0;
// Using the exact-steps hint marks a ticket Assisted; anything else is Solo.
export const isAssisted = ts => hintsUsed(ts) >= 3;
export function revealHint(tid){
  const ts=S.tickets[tid];
  if(ts.checks) return false; // closed: hints are free to read and don't change the score
  ts.hints=Math.min(HINT_TIERS.length,hintsUsed(ts)+1); save();
  return true;
}
export const round1 = x => Math.round(x*10)/10;
// Final score for a closed ticket after the hint penalty.
export const finalScore = ts => ts.checks ? round1(ts.score*(1-hintCost(ts))) : null;

// ---------- Totals ----------
// Totals after hint penalties. `list` defaults to the whole queue.
export function totals(list){
  list=list||queueTickets(); let sc=0,mx=0,done=0,assisted=0,raw=0;
  list.forEach(t=>{const ts=S.tickets[t.id]; if(ts&&ts.checks){sc+=finalScore(ts);raw+=ts.score;mx+=ts.max;done++; if(isAssisted(ts)) assisted++;}});
  sc=round1(sc);
  return {sc,raw,mx,done,assisted,solo:done-assisted,n:list.length,pct:mx?Math.round(sc/mx*100):null};
}
