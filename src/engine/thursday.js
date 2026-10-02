// Thursday: consequences of Monday. The consequences and Thursday's standing tickets belong to the
// active company's ticket set (live bindings); building and starting the shift is shared.
import { S } from "./store.js";
import { TK, T } from "./tickets.js";
import { save } from "./state.js";
import { CONSEQ as PC_CONSEQ, BASE_THU as PC_BASE_THU } from "../packs/pacific-crest/thursday.js";

export { monEsc } from "./store.js";
export let CONSEQ, BASE_THU;
export function setThursday(conseq, base){ CONSEQ = conseq; BASE_THU = base; THU_T = []; }
export let THU_T = [];
setThursday(PC_CONSEQ, PC_BASE_THU);
export function buildThu(){
  THU_T = BASE_THU.concat((S.thu||[]).map(x=>CONSEQ.find(c=>c.key===x.key).make(x.target)));
  THU_T.forEach(t=>{TK[t.id]=t;});
}
export function startThursday(){
  const fired=[], report=[];
  CONSEQ.forEach(c=>{ const tg=c.when(); if(tg){ fired.push({key:c.key,target:tg}); report.push({bad:true,text:c.cause}); } else report.push({bad:false,text:c.prevented}); });
  fired.forEach(x=>CONSEQ.find(c=>c.key===x.key).apply(x.target));
  // Rachel's leave ended early
  S.thu=fired; S.report=report; S.shift="thu"; S.clock=480; S.active=null;
  buildThu();
  THU_T.forEach(t=>{ S.tickets[t.id]={status:"new",esc:[]}; });
  save();
}
// view: "mon" shows Monday's list during the Thursday shift (was ui.view).
export const curTickets = (view) => (S.shift==="thu"&&view!=="mon") ? THU_T : T;

