// GRC audit track. Extracted verbatim from the original simulator; DOM collection
// of answers moved to the view.
import { S, U, C } from "./store.js";
import { ROLES } from "./company.js";
import { T } from "./tickets.js";
import { totals, save } from "./state.js";

// ---------- GRC track ----------
export const PROV_OPTS=["Pass","Exception: no approval on file","Exception: provisioned before approval","Exception: access exceeds role"];
export const TERM_OPTS=["Pass","Exception: disabled late","Exception: disabled late, signed in after termination","Exception: not disabled as of extract"];
const J=(name,rk,hire,appr,prov,extra,correct,why)=>({name,sub:rk.replace("|"," / "),correct,why,
  kv:[["Hire date",hire],["Manager approval",appr],["Provisioned",prov],["Groups granted",ROLES[rk].concat(extra||[]).join(", ")]]});
const X=(name,role,term,dis,last,correct,why)=>({name,sub:role,correct,why,kv:[["HR termination date",term],["Account disabled",dis],["Last sign-in",last]]});
const RR=(name,sub,l,i,correct)=>({name,sub,correct,kv:[["Likelihood",l],["Impact",i]]});
export const G=[
 {id:"G1",ctrl:"APD-01",title:"Test new user provisioning",kind:"table",opts:PROV_OPTS,
  intro:"<p><b>APD-01:</b> Access for new users is approved by the manager <i>before</i> provisioning and limited to the role's birthright groups.</p><p>Test the 15 sampled Q3 joiners. Compare approval date to provisioned date, and groups granted to the access matrix (Policy &amp; matrix tab). Provisioning before the hire date is normal (pre-hire).</p>",
  rows:[J("Jasmine Tran","Operations|Warehouse Associate","Mon, Jul 6","Marcus Bell, Jul 1","Jul 2",null,0),
   J("Kenji Ortiz","Operations|Dispatcher","Mon, Jul 13","Carla Jensen, Jul 8","Jul 9",null,0),
   J("Leah Castillo","Finance|AP Clerk","Mon, Jul 20","Derek Chan, Jul 15","Jul 16",null,0),
   J("Mateo Hughes","Sales|Account Executive","Mon, Jul 20","None on file","Jul 16",null,1),
   J("Naomi Pham","Operations|Warehouse Associate","Mon, Jul 27","Marcus Bell, Jul 21","Jul 23",null,0),
   J("Owen Reyes","HR|HR Generalist","Mon, Aug 3","Angela Ruiz, Jul 29","Jul 30",null,0),
   J("Priya Dawson","IT|Service Desk Tech","Mon, Aug 3","Victor Alvarez, Jul 28","Jul 30",null,0),
   J("Quinn Ibarra","Operations|Warehouse Associate","Mon, Aug 10","Marcus Bell, Aug 4","Aug 5",null,0),
   J("Rosa Mendoza","Operations|Dispatcher","Mon, Aug 17","Carla Jensen, Aug 13","Aug 11",null,2,"Provisioned Aug 11, approved Aug 13."),
   J("Simon Kaur","Sales|Account Executive","Mon, Aug 24","Linda Park, Aug 18","Aug 19",null,0),
   J("Tara Nakamura","Operations|Warehouse Associate","Mon, Aug 31","Marcus Bell, Aug 26","Aug 27",null,0),
   J("Umar Sullivan","Finance|AP Clerk","Tue, Sep 8","Derek Chan, Sep 1","Sep 2",["APP-Finance-Reports"],3,"APP-Finance-Reports isn't an AP Clerk birthright group."),
   J("Vanessa Zamora","Operations|Dispatcher","Mon, Sep 14","Carla Jensen, Sep 9","Sep 10",null,0),
   J("Wesley Vargas","Sales|Account Executive","Mon, Sep 21","Kevin Nguyen, Sep 15","Sep 16",null,0),
   J("Ximena Quintero","HR|HR Generalist","Mon, Sep 28","Angela Ruiz, Sep 24","Sep 23",null,2,"Provisioned Sep 23, approved Sep 24.")],
  lesson:"Test both halves of the control: approval before access, and access limited to the role. 4 of 15 failed (27%), so APD-01 is not operating effectively."},
 {id:"G2",ctrl:"APD-02",title:"Test timely terminations",kind:"table",opts:TERM_OPTS,
  intro:"<p><b>APD-02:</b> Accounts are disabled within <b>one business day</b> of the HR termination date.</p><p>Test the 12 sampled Q3 terminations from the Oct 2 directory extract. Weekends don't count as business days.</p>",
  rows:[X("Carmen Diaz","Account Executive","Wed, Jul 8","Wed, Jul 8","Jul 7",0),
   X("Frank Moreno","Warehouse Associate","Fri, Jul 10","Mon, Jul 13","Jul 10",0,"Friday to Monday is one business day."),
   X("Gina Holt","Dispatcher","Thu, Jul 16","Thu, Jul 16","Jul 16",0),
   X("Henry Lu","AP Clerk","Tue, Jul 21","Tue, Jul 28","Jul 20",1,"Five business days late; no sign-in after termination."),
   X("Ivy Grant","Warehouse Associate","Fri, Jul 31","Fri, Jul 31","Jul 30",0),
   X("Jack Romero","Account Executive","Mon, Aug 3","Fri, Aug 14","Aug 7",2,"Signed in Aug 7, four days after termination."),
   X("Karen Webb","HR Generalist","Wed, Aug 12","Thu, Aug 13","Aug 12",0,"Next business day is within policy."),
   X("Leo Marsh","Warehouse Associate","Fri, Aug 21","Mon, Aug 24","Aug 20",0,"Friday to Monday is one business day."),
   X("Monica Silva","Dispatcher","Tue, Sep 1","Tue, Sep 1","Aug 31",0),
   X("Nate Fox","Warehouse Associate","Thu, Sep 10","Thu, Sep 10","Sep 10",0),
   X("Brian Walsh","Account Executive","Mon, Sep 21","Not disabled","Oct 1",3,"Still enabled at extract and signing in. This is the same account from IAM Ops ticket INC0041231."),
   X("Olga Petrov","AP Clerk","Fri, Sep 25","Mon, Sep 28","Sep 25",0)],
  lesson:"Measure against the policy exactly: Friday to Monday passes. Keep \"late\" separate from \"late and used\". A sign-in after termination raises severity and may be a security incident."},
 {id:"G3",ctrl:"APD-02",title:"Evaluate the termination deficiency",kind:"quiz",
  intro:"<p>Your APD-02 test found 3 exceptions in 12 samples. Additional facts from follow-up:</p><ul><li>Henry Lu (AP Clerk) kept SAP AP-Entry for 5 extra business days. SAP logs show no activity after termination.</li><li>Jack Romero signed in to Salesforce after termination. Salesforce is not a financially significant system.</li><li>Brian Walsh's account is still active (Salesforce only).</li><li>No other in-scope financial system access was involved.</li><li>Assume the quarterly access review (UAR-01) operates effectively for in-scope systems.</li></ul><p>Definitions are on the Controls tab.</p>",
  qs:[{q:"Is APD-02 operating effectively for Q3?",short:"Effectiveness conclusion",opts:["Yes: 9 of 12 passed","No: 3 of 12 (25%) failed, which is well above a tolerable rate for a per-event control"],correct:1,pts:2},
   {q:"How do you classify the deficiency?",short:"Severity classification",opts:["Control deficiency","Significant deficiency","Material weakness"],correct:0,pts:3},
   {q:"What happens with the post-termination sign-in (Jack Romero) and the still-active account (Brian Walsh)?",short:"Handling of the post-termination activity",opts:["Document them in the finding only","Refer them to Security for investigation, and include them in the finding","Leave them out, since Salesforce isn't in SOX scope"],correct:1,pts:3}],
  lesson:"Severity depends on what could reasonably go wrong in the financial statements, not only on the failure rate. No in-scope misuse plus a working compensating control points to a control deficiency. Security risk is a separate track: refer it."},
 {id:"G4",ctrl:"APD-03",title:"Audit your own IAM Ops shift",kind:"quiz",dynamic:true,
  intro:"<p><b>APD-03:</b> Every account change is tied to an approved ticket, and caller identity is verified before any credential change.</p><p>The evidence is <b>your own</b> IAM Ops audit log (Audit log tab). Test it the way an auditor would.</p>",
  lock:()=>totals(T).done<10?"Close at least 10 IAM Ops tickets first. This task audits that work.":null,
  lesson:"Auditors test the log, not the story. Changes without a ticket and resets before verification are exceptions no matter who made them, including you."},
 {id:"G5",ctrl:"UAR-01",title:"Review the Q3 access review for completeness",kind:"quiz",
  intro:"<p><b>UAR-01:</b> Each quarter, managers certify <i>all</i> directory accounts (employees, contractors, service accounts). Revocations are completed within 5 business days.</p>",
  evidence:[["Directory extract, Sep 30","131 accounts: 123 employees, 7 contractors, 1 service account"],["Access review file","123 accounts, all certified by managers"],["Reviewer sign-off","Victor Alvarez, Oct 1"],["Population source","Excel export provided by IT; no query or run parameters attached"]],
  qs:[{q:"What is the main issue?",short:"Issue identified",opts:["Completeness: the 7 contractors and 1 service account were left out of the review","Timeliness: sign-off came after quarter end","Accuracy: managers certified too quickly","No issue"],correct:0,pts:3},
   {q:"What evidence do you request? Select all that apply.",multi:true,opts:["A system-generated population with the query, parameters and run date","Review evidence for the 8 excluded accounts","An email from IT confirming the review was complete","Re-perform the whole review yourself"],correct:[0,1]},
   {q:"Until the 8 accounts are reviewed, can UAR-01 be relied on as a compensating control?",short:"Reliance on UAR-01",opts:["Yes","No"],correct:1,pts:2}],
  lesson:"Before testing a review, test the population. An incomplete population means the review can't be relied on, however carefully the managers certified. Contractors and service accounts are the usual gaps."},
 {id:"G6",ctrl:"RISK",title:"Rate the IT risk register",kind:"table",opts:["High","Medium","Low"],
  intro:"<p>Rate each risk's inherent level. Score = likelihood × impact. <b>High</b> 15–25, <b>Medium</b> 8–14, <b>Low</b> 1–7.</p><p class=\"mono\" style=\"font-size:12px\">Likelihood: Rare 1 · Unlikely 2 · Possible 3 · Likely 4 · Almost certain 5<br>Impact: Minimal 1 · Minor 2 · Moderate 3 · Major 4 · Severe 5</p>",
  rows:[RR("R-01 Terminated users keep access","APD-01/02 failures this quarter","Likely","Major",0),
   RR("R-02 Shared scanner login on warehouse floor","Requested by Operations","Possible","Minor",2),
   RR("R-03 Standing Global Admin accounts","14 permanent Global Admins found","Possible","Severe",0),
   RR("R-04 Vendor SOC 2 coverage gap","FreightCloud report ends Jun 30","Unlikely","Moderate",2),
   RR("R-05 MFA fatigue attacks","One successful push approval this week","Likely","Moderate",1)],
  lesson:"Apply the matrix the same way every time. The register's value is consistent ranking, so the top items (R-01 at 16 and R-03 at 15) get funded first."},
 {id:"G7",ctrl:"VEN-01",title:"Review a vendor SOC 2 report",kind:"quiz",
  intro:"<p>FreightCloud Systems hosts Pacific Crest's transportation management system. Our fiscal year ends Dec 31.</p>",
  evidence:[["Report","SOC 2 Type II, Security and Availability"],["Period","Oct 1, 2025 to Jun 30, 2026"],["Opinion","Unqualified"],["Exception","CC6.2: 2 of 25 sampled terminated users were removed late. Management response: automated deprovisioning implemented Jul 2026."],["Subservice org","AWS (carve-out method)"],["Complementary user entity controls","1) Customers notify FreightCloud of terminated users within 1 business day. 2) Customers review their users' access quarterly."]],
  qs:[{q:"Which follow-ups are needed? Select all that apply.",multi:true,opts:["Get a bridge letter covering Jul 1 to Dec 31","Evaluate whether the CC6.2 exception affects our reliance","Confirm our own user entity controls (termination notice, quarterly review) are operating","Get and review AWS's SOC report for the carved-out subservice","Reject the vendor because the report has an exception","No action needed; the opinion is unqualified"],correct:[0,1,2,3]},
   {q:"Why does your APD-02 result matter for this vendor review?",short:"Link to APD-02",opts:["It doesn't; it's a different system","The vendor relies on us to report terminations on time. Our late terminations mean that user entity control is failing.","It means the vendor's opinion should be qualified"],correct:1,pts:3}],
  lesson:"A clean SOC 2 opinion isn't the end of the review. Cover the gap period, weigh the exceptions, check the carved-out subservice provider, and confirm your own side of the user entity controls."},
 {id:"G8",ctrl:"POL-EX",title:"Decide a policy exception request",kind:"quiz",
  intro:"<p>After IAM Ops rejected the shared <span class=\"mono\">warehouse01</span> login, Operations filed a formal policy exception: \"Second shift loses 20 minutes a night to logins on the scanner station. Badge-tap SSO is budgeted for Q2 2027.\"</p>",
  qs:[{q:"What is the decision?",short:"Exception decision",opts:["Deny outright; policy is policy","Approve permanently","Approve temporarily with compensating controls and risk owner sign-off"],correct:2,pts:3},
   {q:"Which compensating controls belong in the approval? Select all that apply.",multi:true,opts:["Kiosk locked to the WMS scan function only","Expiry of 90 days or less, with re-review","Badge-in log to tie each shift's scans to named people","Sign-off by the risk owner (Operations leadership)","Tracked project to replace it with badge-tap SSO","Give the login admin rights so IT can support it","Send the password to the team by email"],correct:[0,1,2,3,4]}],
  lesson:"GRC's job is managed risk, not saying no. A good exception is time-limited, narrow, compensated, owned by the business, and tied to a permanent fix."},
 {id:"G9",ctrl:"MAP",title:"Map APD-02 to frameworks",kind:"quiz",
  intro:"<p>Map APD-02 (disable accounts within one business day of termination) so one test can serve several audits.</p>",
  qs:[{q:"Select every requirement APD-02 supports.",multi:true,opts:["NIST 800-53 PS-4 Personnel Termination","NIST 800-53 AC-2 Account Management","ISO 27001:2022 A.5.18 Access rights","SOC 2 CC6.2 (removal of credentials)","CMMC PS.L2-3.9.2 (protect systems during and after terminations)","NIST 800-53 CP-9 System Backup","ISO 27001:2022 A.8.13 Information backup","SOC 2 CC7.4 Incident response","CMMC MP.L2-3.8.3 Media sanitization"],correct:[0,1,2,3,4]}],
  lesson:"Test once, satisfy many. A mapped control lets one set of APD-02 evidence answer SOX, SOC 2, ISO and CMMC requests."},
 {id:"G10",ctrl:"APD-02",title:"Write the termination finding",kind:"quiz",
  intro:"<p>Build the APD-02 finding. Pick the strongest statement for each element.</p>",
  qs:[{q:"Condition",short:"Condition",opts:["Access was removed late for some users.","3 of 12 sampled terminations (25%) were not disabled within one business day. One account was still active 11 days later, and one former user signed in after termination.","IT does not take terminations seriously."],correct:1,pts:2},
   {q:"Criteria",short:"Criteria",opts:["Access Management Policy section 4.3 requires accounts to be disabled within one business day of the HR termination date (control APD-02).","Best practice says access should be removed quickly.","NIST requires same-day removal."],correct:0,pts:2},
   {q:"Cause",short:"Cause",opts:["The service desk was careless.","Unknown.","Terminations are processed manually from HR emails. There is no automated HR-to-directory trigger or daily reconciliation."],correct:2,pts:2},
   {q:"Effect",short:"Effect",opts:["The company will fail its SOX audit.","Former employees could reach company systems and data after separation, and one did (Salesforce, 4 days).","No impact, because no fraud occurred."],correct:1,pts:2},
   {q:"Recommendation",short:"Recommendation",opts:["Automate deprovisioning from the HR termination event, and add a daily HR-to-directory reconciliation with exceptions reviewed by IT management.","Remind the service desk to be faster.","Remove all users' access every quarter."],correct:0,pts:2}],
  lesson:"A finding that holds up is specific (numbers), cites the actual requirement, names a fixable cause, states real impact without exaggeration, and recommends a fix that addresses the cause."}
];
export const GK=Object.fromEntries(G.map(g=>[g.id,g]));
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
