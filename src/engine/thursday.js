// Thursday: consequences of Monday. Extracted verbatim from the original simulator;
// only the UI side effects of startThursday moved to the caller.
import { S, U, has, C, roleCheck, verifiedBefore, approvalBefore, esc } from "./store.js";
import { TK, T } from "./tickets.js";
import { save } from "./state.js";

// ---------- Thursday: consequences of Monday ----------
export const monEsc = (tid,who) => ((S.tickets[tid]||{}).esc||[]).includes(who);
export const CONSEQ = [
 {key:"stale",when:()=>["greg.foster","nina.shah","paul.kim"].find(id=>U(id).enabled),
  cause:"Inactive accounts over 90 days were left enabled (TSK0007712).",
  prevented:"Overnight, an attacker sprayed passwords at dormant accounts. Every attempt failed because you disabled them Monday.",
  apply:tg=>{Object.assign(U(tg),{last:0,revoked:false,mfaReset:false,mfa:true});},
  make:tg=>({id:"INC0041302",type:"Incident",pri:1,title:"Dormant account signed in from unknown IP: "+U(tg).name,from:"Entra ID Protection alert",channel:"SIEM alert",opened:"2:14 AM",users:[tg],close:"resolve",
   body:`<p>${U(tg).name}'s account had no sign-in for months. At 2:14 AM it signed in from a hosting-provider IP after a password spray, then registered a new MFA method.</p><p>This account was on Monday's inactive-account report.</p>`,
   lesson:"A stale account is a door nobody is watching. Contain it (disable, revoke, remove the attacker's MFA method), hand it to Security, and fix the sweep so it doesn't happen again. NIST AC-2(3), IR-4.",
   grade:ts=>[C(!U(tg).enabled,"Account disabled",3),C(U(tg).revoked,"Sessions revoked",2),C(U(tg).mfaReset,"Attacker's MFA method removed (MFA reset)",2),C(esc(ts,"Security team"),"Escalated to the Security team",3)]})},
 {key:"svc",when:()=>!U("svc-backup").enabled&&"svc-backup",
  cause:"The svc-backup service account was disabled instead of being sent to its owner (TSK0007712).",
  prevented:"Nightly backups ran clean all week. You sent svc-backup to its owner instead of disabling it.",
  apply:()=>{},
  make:()=>({id:"INC0041305",type:"Incident",pri:1,title:"Nightly backups failing since Monday",from:"Backup monitoring",channel:"Automated alert",opened:"6:05 AM",users:["svc-backup"],close:"resolve",
   body:"<p>The SAP and file server backup jobs have failed three nights in a row: <span class=\"mono\">Logon failure: account disabled (svc-backup)</span>.</p><p>There is no restorable backup since Sunday.</p>",
   lesson:"Service accounts aren't people. Disabling one breaks production silently. Restore service, then let the owner decide whether to retire it, and document the impact. NIST AC-2, CP-9.",
   grade:ts=>[C(U("svc-backup").enabled,"svc-backup re-enabled so backups can run",3),C(esc(ts,"Account owner"),"Escalated to the account owner (Victor Alvarez)",2)]})},
 {key:"robert",when:()=>(U("robert.hayes").enabled||!U("robert.hayes").revoked)&&"robert.hayes",
  cause:"Robert Hayes wasn't fully offboarded (REQ0018850): account still enabled or sessions still live.",
  prevented:"Robert Hayes tried CargoWise from home Tuesday night and was blocked. Clean offboarding.",
  apply:()=>{Object.assign(U("robert.hayes"),{revoked:false});},
  make:()=>({id:"INC0041308",type:"Incident",pri:1,title:"Terminated employee opened 41 shipment records",from:"CargoWise audit log review",channel:"Email",opened:"7:30 AM",users:["robert.hayes"],close:"resolve",
   body:"<p>Robert Hayes, terminated Monday at noon, opened 41 shipment records in CargoWise on Tuesday at 9:40 PM from a home IP address.</p>",
   lesson:"Offboarding isn't done until the account is disabled, sessions are revoked, and access is removed. Post-termination access is an incident for Security. NIST PS-4, IR-4.",
   grade:ts=>[C(!U("robert.hayes").enabled,"Account disabled",3),C(U("robert.hayes").revoked,"Sessions revoked",2),C(U("robert.hayes").groups.length===0,"All access removed",2),C(esc(ts,"Security team"),"Escalated to the Security team",3)]})},
 {key:"brian",when:()=>U("brian.walsh").enabled&&"brian.walsh",
  cause:"Brian Walsh, terminated Sep 21, was still enabled after the reconciliation ticket (INC0041231).",
  prevented:"Brian Walsh tried to sign in to Salesforce Tuesday and was blocked.",
  apply:()=>{Object.assign(U("brian.walsh"),{last:0,revoked:false});},
  make:()=>({id:"INC0041311",type:"Incident",pri:1,title:"12,000 Salesforce contacts exported by brian.walsh",from:"Salesforce Shield alert",channel:"SIEM alert",opened:"7:52 AM",users:["brian.walsh"],close:"resolve",
   body:"<p>brian.walsh exported 12,000 customer contacts from Salesforce at 11:18 PM Wednesday. HR shows him terminated on Sep 21. He has started at a competitor.</p>",
   lesson:"Every day a leaver stays enabled is a day of exposure. Now it's a data-loss incident with legal involvement. NIST PS-4, IR-4.",
   grade:ts=>[C(!U("brian.walsh").enabled,"Account disabled",3),C(U("brian.walsh").revoked,"Sessions revoked",2),C(U("brian.walsh").groups.length===0,"Access removed",1),C(esc(ts,"Security team"),"Escalated to the Security team",3)]})},
 {key:"lisa",when:()=>has("lisa.morales","APP-SAP-AP-Approve")&&"lisa.morales",
  cause:"Lisa Morales was granted AP Approve on top of AP Entry, creating an SoD conflict (REQ0018855).",
  prevented:"No self-approved invoices this week. Separation of duties held.",
  apply:()=>{},
  make:()=>({id:"INC0041314",type:"Incident",pri:1,title:"SAP: Lisa Morales approved her own $48,200 invoice",from:"SAP GRC alert",channel:"SIEM alert",opened:"8:02 AM",users:["lisa.morales"],close:"resolve",
   body:"<p>Invoice 5100-22871 for $48,200 to a vendor added last week was entered <i>and</i> approved by lisa.morales. Payment is scheduled for Friday's run.</p>",
   lesson:"This is exactly what SoD prevents. Remove the conflicting access now and send it to Security as possible fraud. Treasury needs to hold the payment. NIST AC-5.",
   grade:ts=>[C(!has("lisa.morales","APP-SAP-AP-Approve"),"AP Approve removed",4),C(has("lisa.morales","APP-SAP-AP-Entry"),"Her normal AP Entry access kept",1),C(esc(ts,"Security team"),"Escalated to Security as possible fraud",3)]})},
 {key:"ethan",when:()=>(has("ethan.moore","APP-SAP-AP-Entry")||has("ethan.moore","APP-Finance-Reports"))&&"ethan.moore",
  cause:"Ethan Moore's access was copied from Bob Turner, including Bob's leftover Finance access (REQ0018881).",
  prevented:"Ethan started with clean Dispatcher access. Bob's leftover Finance access is still worth a review.",
  apply:()=>{},
  make:()=>({id:"REQ0018915",type:"Request",pri:2,title:"Why can a new Dispatcher see payroll reports?",from:"Dana Whitfield (Controller)",channel:"Email",opened:"8:15 AM",users:["ethan.moore","bob.turner"],close:"resolve",
   body:"<p>\"Ethan Moore started Monday as a Dispatcher and opened the payroll summary in Finance Reports yesterday. How does he have that? Fix it, and check whoever he was copied from.\"</p>",
   lesson:"Copying a peer copies their mistakes. Fix both people, and use the role matrix from now on. NIST AC-6.",
   grade:ts=>[roleCheck("ethan.moore","Operations|Dispatcher",4),C(!has("bob.turner","APP-SAP-AP-Entry")&&!has("bob.turner","APP-Finance-Reports"),"Bob Turner's leftover Finance access removed",2)]})},
 {key:"tyler",when:()=>has("tyler.brooks","ROLE-Global-Admin")&&"tyler.brooks",
  cause:"Tyler Brooks was given standing Global Admin (REQ0018866).",
  prevented:"Standing Global Admins stayed at the two emergency accounts.",
  apply:()=>{U("tyler.brooks").revoked=false;},
  make:()=>({id:"INC0041318",type:"Incident",pri:1,title:"Global Admin created a forwarding rule on the CFO's mailbox",from:"Microsoft 365 audit alert",channel:"SIEM alert",opened:"8:21 AM",users:["tyler.brooks","patricia.reed"],close:"resolve",
   body:"<p>tyler.brooks used Global Admin to create a rule forwarding all of Patricia Reed's mail to an external address. Tyler says he didn't do it. His account signed in from a new device Tuesday.</p>",
   lesson:"Standing admin rights turn one phished tech into a company-wide breach. Remove the role, contain the account, and move admins to just-in-time access. NIST AC-6(5).",
   grade:ts=>[C(!has("tyler.brooks","ROLE-Global-Admin"),"Global Admin removed",4),C(U("tyler.brooks").revoked,"Tyler's sessions revoked",2),C(esc(ts,"Security team"),"Escalated to the Security team",3)]})},
 {key:"cfo",when:()=>(U("patricia.reed").mfaReset||U("patricia.reed").pwReset)&&"patricia.reed",
  cause:"The fake \"CFO\" caller got an MFA or password change on Patricia Reed's account (INC0041220).",
  prevented:"The real Patricia Reed thanked the desk. The \"airport call\" came from a fraud crew hitting three local firms this week.",
  apply:()=>{Object.assign(U("patricia.reed"),{revoked:false,mfaReset:false,pwReset:false,mfa:true});},
  make:()=>({id:"INC0041320",type:"Incident",pri:1,title:"Wire fraud: $250,000 sent to a new vendor",from:"Dana Whitfield (Controller)",channel:"Phone",opened:"8:30 AM",users:["patricia.reed"],close:"resolve",
   body:"<p>A $250,000 wire was approved from Patricia Reed's account Monday at 9:05 AM. The real Patricia was in the office all day and never called the desk. The attacker registered their own phone for MFA.</p>",
   lesson:"One skipped identity check paid for the attacker's quarter. Contain the account, remove their MFA method, and involve Security, Legal and the bank right away. NIST IA-5, IR-4.",
   grade:ts=>[C(U("patricia.reed").revoked,"Sessions revoked",3),C(U("patricia.reed").mfaReset,"Attacker's MFA method removed",2),C(U("patricia.reed").pwReset,"Password reset",2),C(esc(ts,"Security team"),"Escalated to the Security team",3)]})},
 {key:"dev",when:()=>(U("dev.patel").expiry===null||U("dev.patel").expiry<=2)&&"dev.patel",
  cause:"Dev Patel's contractor account wasn't extended (REQ0018861).",
  prevented:"Dev Patel's contract rolled over without a gap.",
  apply:()=>{Object.assign(U("dev.patel"),{enabled:false,expiry:null});},
  make:()=>({id:"INC0041323",type:"Incident",pri:2,title:"Contractor locked out; second shift short a forklift lead",from:"Carla Jensen (sponsor)",channel:"Phone",opened:"8:40 AM",users:["dev.patel"],close:"resolve",
   approval:"Carla Jensen (sponsor) replied: \"Approved. Same 90-day SOW I sent Monday.\"",
   body:"<p>\"Dev's account expired Wednesday and he couldn't clock into WMS last night. We were short on the dock all shift. I asked for this Monday!\"</p>",
   lesson:"Missed requests have a business cost too. Contractors need the end date, the sponsor approval and the extension handled together. NIST PS-7.",
   grade:ts=>[C(U("dev.patel").enabled,"Account re-enabled",2),C(approvalBefore("INC0041323",e=>e.a==="expiry"&&e.target==="dev.patel"),"Sponsor approval on this ticket before extending",2),C(U("dev.patel").expiry!==null&&U("dev.patel").expiry>0&&U("dev.patel").expiry<=90,"Expiry set within the 90-day cap",3)]})},
 {key:"sam",when:()=>!(U("sam.okafor").revoked&&U("sam.okafor").pwReset&&U("sam.okafor").mfaReset&&monEsc("INC0041240","Security team"))&&"sam.okafor",
  cause:"Sam Okafor's compromised account wasn't fully contained and escalated (INC0041240).",
  prevented:"Security traced the Frankfurt sign-in to a phishing kit and blocked it company-wide after your escalation.",
  apply:()=>{Object.assign(U("sam.okafor"),{revoked:false,pwReset:false,mfaReset:false,mfa:true});},
  make:()=>({id:"INC0041326",type:"Incident",pri:1,title:"Sam Okafor's mailbox sent 300 phishing emails",from:"Email security",channel:"SIEM alert",opened:"9:02 AM",users:["sam.okafor"],close:"resolve",
   body:"<p>sam.okafor sent 300 emails with a fake invoice link to customers and staff overnight. The sign-ins came from the same Frankfurt infrastructure as Monday's alert.</p>",
   lesson:"Half-contained is not contained. The attacker kept a session or token and came back. Do every step, then escalate. NIST IR-4, AC-12.",
   grade:ts=>[C(U("sam.okafor").revoked,"Sessions revoked",3),C(U("sam.okafor").pwReset,"Password reset",2),C(U("sam.okafor").mfaReset,"MFA reset",2),C(esc(ts,"Security team"),"Escalated to the Security team",3)]})},
 {key:"james",when:()=>U("james.carter").pwReset&&!verifiedBefore("INC0041207",["pwreset"],"james.carter")&&"james.carter",
  cause:"James Carter's password was reset without recorded identity verification (INC0041207).",
  prevented:"James Carter confirmed the reset was him, and your verification is on record.",
  apply:()=>{Object.assign(U("james.carter"),{revoked:false,pwReset:false});},
  make:()=>({id:"INC0041329",type:"Incident",pri:1,title:"\"I never asked for a password reset\"",from:"James Carter",channel:"Phone (desk line)",opened:"9:10 AM",users:["james.carter"],close:"resolve",
   body:"<p>\"I was on a flight Monday morning. Someone called in as me, got my password reset, and has been in my email since. How did they get through?\"</p><p>There is no identity verification on record for Monday's reset.</p>",
   lesson:"If verification isn't recorded, it didn't happen. That's true for auditors and for attackers. Contain, rotate, escalate. NIST IA-5.",
   grade:ts=>[C(U("james.carter").revoked,"Sessions revoked",3),C(U("james.carter").pwReset,"Password reset again",2),C(esc(ts,"Security team"),"Escalated to the Security team",3)]})},
 {key:"jordan",when:()=>has("jordan.lee","APP-Finance-Reports")&&"jordan.lee",
  cause:"The Q3 access review revocation for Jordan Lee wasn't carried out (REQ0018876).",
  prevented:"Internal Audit closed the Q3 access review with no open revocations.",
  apply:()=>{},
  make:()=>({id:"REQ0018918",type:"Request",pri:2,title:"Audit: Q3 review revocation still open",from:"Internal Audit",channel:"Email",opened:"9:20 AM",users:["jordan.lee"],close:"resolve",
   body:"<p>\"Our follow-up testing shows Jordan Lee still holds APP-Finance-Reports, which the Q3 reviewer marked for revocation. This will be reported as an exception unless it's fixed and evidenced today.\"</p>",
   lesson:"An access review isn't finished when the manager clicks Revoke. It's finished when access is actually removed. NIST AC-2(j).",
   grade:ts=>[C(!has("jordan.lee","APP-Finance-Reports"),"APP-Finance-Reports removed",4)]})},
 {key:"tanya",when:()=>has("tanya.wright","APP-Salesforce-User")&&"tanya.wright",
  cause:"Tanya Wright kept her Sales access after moving to Operations (REQ0018852).",
  prevented:"Tanya's transfer was clean. Sales confirmed she has no access to her old accounts.",
  apply:()=>{},
  make:()=>({id:"REQ0018921",type:"Request",pri:2,title:"Transferred employee still pulling Sales leads",from:"Linda Park (Sales Manager)",channel:"Email",opened:"9:31 AM",users:["tanya.wright"],close:"resolve",
   body:"<p>\"Tanya moved to Operations Monday, but she exported her old territory's leads yesterday. Why does she still have Salesforce?\"</p>",
   lesson:"Movers keep old access unless someone removes it. This is how privilege creep builds. NIST PS-5.",
   grade:ts=>[roleCheck("tanya.wright","Operations|Dispatcher",4)]})}
];
export const BASE_THU = [
 {id:"REQ0018910",type:"Request",pri:3,title:"Access request: WMS Admin for Aisha Brown",from:"Aisha Brown",channel:"Self-service portal",opened:"7:45 AM",users:["aisha.brown"],approval:"Carla Jensen replied: \"Approved. She's helping with inventory counts this month.\"",close:"reject",
  body:"<p>Requesting <span class=\"mono\">APP-WMS-Admin</span> to adjust inventory counts during the monthly cycle count.</p>",
  lesson:"Approval isn't enough when the access isn't requestable. Admin rights come with a role change, or through a temporary, logged process owned by the app team. NIST AC-6.",
  grade:ts=>[C(!has("aisha.brown","APP-WMS-Admin"),"Non-requestable admin access not granted",4)]},
 {id:"REQ0018912",type:"Request",pri:3,title:"Early return from leave: Rachel Adams",from:"Workday HR (automated)",channel:"HR integration",opened:"8:00 AM",users:["rachel.adams"],close:"resolve",
  body:"<p>Rachel Adams is ending her leave early and returns today. Restore her access so she can work.</p>",
  lesson:"Because leave means disable-and-keep, a return is one click. If her groups were removed Monday, you're rebuilding access from the matrix now. NIST AC-2.",
  grade:ts=>[C(U("rachel.adams").enabled,"Account enabled",2),roleCheck("rachel.adams","Sales|Account Executive",4)]}
];
export let THU_T = [];
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
