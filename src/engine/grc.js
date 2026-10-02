// GRC audit desk: grading and totals. The tasks belong to the active company's ticket set (live
// bindings); task G4 audits the learner's own shift and is shared (see grcKit.js).
import { S, U, C } from "./store.js";
import { T } from "./tickets.js";
import { save } from "./state.js";
import { G as PC_G } from "../packs/pacific-crest/grc.js";

export { PROV_OPTS, TERM_OPTS } from "./grcKit.js";
export let G, GK;
export function setGrc(list){ G = list; GK = Object.fromEntries(G.map(g=>[g.id,g])); }
setGrc(PC_G);
export function g4Questions(){
  const noTicket=S.log.filter(e=>!e.ticket).length;
  const callerT=new Set(T.filter(t=>t.caller).map(t=>t.id));
  const resets=[];
  S.log.forEach((e,i)=>{
    if(["pwreset","mfareset","unlock"].includes(e.a)&&callerT.has(e.ticket)){
      const key=e.ticket+"|"+e.target+"|"+e.a;
      if(!resets.find(r=>r.key===key)){
        const verified=S.log.slice(0,i).some(x=>x.ticket===e.ticket&&x.a==="verify");
        resets.push({key,label:e.t+" · "+e.ticket+" · "+U(e.target).name+": "+({pwreset:"password reset",mfareset:"MFA reset",unlock:"unlock"}[e.a]),bad:!verified});
      }
    }
  });
  const qs=[{q:"How many account changes in the audit log have no ticket reference?",short:"Changes without a ticket",num:true,correct:noTicket,pts:3}];
  if(resets.length) qs.push({q:"Select every caller-initiated credential change made before the caller's identity was marked verified on that ticket.",multi:true,opts:resets.map(r=>r.label),correct:resets.map((r,i)=>r.bad?i:-1).filter(i=>i>=0)});
  qs.push({q:"You find exceptions in your own work. What's the right move?",short:"Handling your own exceptions",opts:["Fix the log entries so they look right","Report them like any other exception","Leave your own tickets out of the sample"],correct:1,pts:2});
  return qs;
}
export const gQs = (g,gs) => g.dynamic ? (gs.frozen||(gs.frozen=g4Questions())) : g.qs;
// Reads the draft answers for task g from the rendered form under root.
export function gCollect(g,gs,root=document){
  const a={}; const qs=g.kind==="table"?g.rows:gQs(g,gs);
  qs.forEach((q,i)=>{
    if(g.kind==="table"){ const el=root.querySelector(`#g-${g.id}-r${i}`); if(el&&el.value!=="") a[i]=+el.value; }
    else if(q.num){ const el=root.querySelector(`#g-${g.id}-q${i}`); if(el&&el.value!=="") a[i]=parseInt(el.value,10); }
    else if(q.multi){ a[i]=[...root.querySelectorAll(`input[name="g-${g.id}-q${i}"]:checked`)].map(x=>+x.value); }
    else { const el=root.querySelector(`input[name="g-${g.id}-q${i}"]:checked`); if(el) a[i]=+el.value; }
  });
  return a;
}
export function gGrade(g,gs,a){
  const checks=[];
  if(g.kind==="table") g.rows.forEach((r,i)=>{ const ok=a[i]===r.correct; checks.push(C(ok,r.name+": "+(a[i]==null?"not marked":g.opts[a[i]]),1,ok?(r.why||""):"Correct: "+g.opts[r.correct]+(r.why?". "+r.why:""))); });
  else gQs(g,gs).forEach((q,i)=>{
    if(q.num){ const ok=a[i]===q.correct; checks.push(C(ok,q.short+": you answered "+(a[i]??"nothing"),q.pts,ok?"":"Correct: "+q.correct)); }
    else if(q.multi){ const sel=a[i]||[]; q.opts.forEach((o,j)=>{ const should=q.correct.includes(j), did=sel.includes(j); checks.push(C(should===did,(did?"Selected: ":"Left out: ")+o,1,should===did?"":should?"This should be selected.":"This should not be selected.")); }); }
    else { const ok=a[i]===q.correct; checks.push(C(ok,q.short||q.q,q.pts||2,ok?"":"Correct: "+q.opts[q.correct])); }
  });
  return checks;
}
// Grades task id from collected answers a. Returns an error message when items are unanswered.
export function gSubmit(id,a){
  const g=GK[id], gs=S.grc[id]||(S.grc[id]={});
  const qs=g.kind==="table"?g.rows:gQs(g,gs);
  const missing=qs.some((q,i)=>!q.multi&&a[i]==null);
  if(missing) return "Answer every item before submitting";
  gs.ans=a; gs.checks=gGrade(g,gs,a);
  gs.score=gs.checks.filter(c=>c.pass).reduce((s,c)=>s+c.pts,0); gs.max=gs.checks.reduce((s,c)=>s+c.pts,0);
  save(); return null;
}
export function gTotals(){ let sc=0,mx=0,done=0; G.forEach(g=>{const gs=S.grc[g.id]; if(gs&&gs.checks){sc+=gs.score;mx+=gs.max;done++;}}); return {sc,mx,done,pct:mx?Math.round(sc/mx*100):null}; }

