// Company blueprint: roles, SoD rules, people and HR feed. Extracted verbatim from the original simulator.
export const ROLES = {
  "Executive|CEO":["GRP-All-Staff","APP-M365-E3","APP-Finance-Reports","APP-Concur-Approver"],
  "Finance|CFO":["GRP-All-Staff","APP-M365-E3","APP-Finance-Reports","APP-Concur-Approver"],
  "Finance|Controller":["GRP-All-Staff","APP-M365-E3","APP-SAP-GL-Post","APP-Finance-Reports","APP-Concur-Approver"],
  "Finance|AP Manager":["GRP-All-Staff","APP-M365-E3","APP-SAP-AP-Approve","APP-Concur-Approver","APP-Finance-Reports"],
  "Finance|AP Clerk":["GRP-All-Staff","APP-M365-E3","APP-SAP-AP-Entry","APP-Concur-User"],
  "Sales|Sales Manager":["GRP-All-Staff","APP-M365-E3","APP-Salesforce-User","APP-Salesforce-Reports","APP-Concur-Approver"],
  "Sales|Account Executive":["GRP-All-Staff","APP-M365-E3","APP-Salesforce-User"],
  "Operations|Operations Manager":["GRP-All-Staff","APP-M365-E3","APP-CargoWise-Ops","APP-WMS-User","APP-Concur-Approver"],
  "Operations|Warehouse Manager":["GRP-All-Staff","APP-M365-E3","APP-WMS-User","APP-WMS-Admin","APP-Concur-Approver"],
  "Operations|Dispatcher":["GRP-All-Staff","APP-M365-E3","APP-CargoWise-Ops","APP-WMS-User"],
  "Operations|Warehouse Associate":["GRP-All-Staff","APP-M365-F3","APP-WMS-User"],
  "Operations|Ops Contractor":["GRP-Contractors","APP-WMS-User"],
  "HR|HR Director":["GRP-All-Staff","APP-M365-E3","APP-Workday-HR","APP-Concur-Approver"],
  "HR|HR Generalist":["GRP-All-Staff","APP-M365-E3","APP-Workday-HR"],
  "IT|IT Manager":["GRP-All-Staff","APP-M365-E3","APP-ServiceNow-Agent","ROLE-User-Admin","APP-Concur-Approver"],
  "IT|Service Desk Tech":["GRP-All-Staff","APP-M365-E3","APP-ServiceNow-Agent","ROLE-Helpdesk-Admin"]
};
export const REQUESTABLE = ["APP-Salesforce-Reports","APP-Finance-Reports"];
export const SOD = [
  ["APP-SAP-AP-Entry","APP-SAP-AP-Approve","One person could enter and approve their own invoice."],
  ["APP-SAP-Vendor-Master","APP-SAP-AP-Approve","One person could create a fake vendor and approve payment to it."],
  ["APP-SAP-Vendor-Master","APP-SAP-AP-Entry","One person could create a vendor and invoice from it."]
];
export const ALL_GROUPS = [...new Set([].concat(...Object.values(ROLES), ["ROLE-Global-Admin","APP-SAP-Vendor-Master","SVC-Backup-Operators"]))].sort();
export const BASE = new Date(2026,9,5);
export const fmtDay = off => { const d=new Date(BASE); d.setDate(d.getDate()+off); return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); };

export function buildUsers(){
  const U={};
  const K=(id,name,empId,rk,mgr,x={})=>{
    const [dept,title]=rk?rk.split("|"):[x.dept,x.title];
    U[id]=Object.assign({id,name,empId,dept,title,mgr,type:"Employee",enabled:true,locked:false,mfa:true,
      groups:rk?ROLES[rk].slice():[],last:1,expiry:null,revoked:false,pwReset:false,mfaReset:false,preHire:false},x);
  };
  K("howard.lane","Howard Lane","10001","Executive|CEO","Board of Directors",{last:0});
  K("patricia.reed","Patricia Reed","10002","Finance|CFO","Howard Lane",{last:0});
  K("dana.whitfield","Dana Whitfield","10011","Finance|Controller","Patricia Reed");
  K("derek.chan","Derek Chan","10047","Finance|AP Manager","Dana Whitfield",{groups:ROLES["Finance|AP Manager"].concat("APP-SAP-AP-Entry")});
  K("linda.park","Linda Park","10105","Sales|Sales Manager","Howard Lane");
  K("kevin.nguyen","Kevin Nguyen","10244","Sales|Sales Manager","Linda Park");
  K("carla.jensen","Carla Jensen","10150","Operations|Operations Manager","Howard Lane");
  K("marcus.bell","Marcus Bell","10163","Operations|Warehouse Manager","Carla Jensen");
  K("angela.ruiz","Angela Ruiz","10180","HR|HR Director","Howard Lane");
  K("victor.alvarez","Victor Alvarez","10190","IT|IT Manager","Howard Lane");
  K("james.carter","James Carter","10231","Sales|Account Executive","Linda Park",{last:3});
  K("aisha.brown","Aisha Brown","10318","Operations|Dispatcher","Carla Jensen",{locked:true});
  K("robert.hayes","Robert Hayes","10322","Operations|Dispatcher","Carla Jensen",{last:0});
  K("tanya.wright","Tanya Wright","10257","Sales|Account Executive","Linda Park");
  K("lisa.morales","Lisa Morales","10291","Finance|AP Clerk","Derek Chan");
  K("omar.hassan","Omar Hassan","10266","Sales|Account Executive","Kevin Nguyen");
  K("dev.patel","Dev Patel","C-2051","Operations|Ops Contractor","Carla Jensen (sponsor)",{type:"Contractor",expiry:2});
  K("greg.foster","Greg Foster","10210","Sales|Account Executive","Linda Park",{last:112});
  K("nina.shah","Nina Shah","10330","Operations|Dispatcher","Carla Jensen",{last:97});
  K("paul.kim","Paul Kim","10288","Finance|AP Clerk","Derek Chan",{last:134});
  K("helen.cho","Helen Cho","10185","HR|HR Generalist","Angela Ruiz",{last:88});
  K("svc-backup","svc-backup","SVC-003",null,"Victor Alvarez (owner)",{dept:"IT",title:"Service account: nightly backups",type:"Service",groups:["SVC-Backup-Operators"],last:200,mfa:false});
  K("brian.walsh","Brian Walsh","10239","Sales|Account Executive","Linda Park",{last:2});
  K("tyler.brooks","Tyler Brooks","10197","IT|Service Desk Tech","Victor Alvarez");
  K("sofia.ramirez","Sofia Ramirez","10218","Sales|Account Executive","Linda Park",{enabled:false,groups:["GRP-All-Staff","APP-Salesforce-User"],last:412});
  K("jordan.lee","Jordan Lee","10295","Finance|AP Clerk","Derek Chan",{groups:ROLES["Finance|AP Clerk"].concat("APP-Finance-Reports")});
  K("rachel.adams","Rachel Adams","10249","Sales|Account Executive","Kevin Nguyen");
  K("bob.turner","Bob Turner","10312","Operations|Dispatcher","Carla Jensen",{groups:ROLES["Operations|Dispatcher"].concat("APP-SAP-AP-Entry","APP-Finance-Reports")});
  K("sam.okafor","Sam Okafor","10271","Sales|Account Executive","Kevin Nguyen",{last:0});
  K("maria.lopez","Maria Lopez","10401","Finance|AP Clerk","Derek Chan",{enabled:false,groups:[],last:null,mfa:false,preHire:true});
  K("ethan.moore","Ethan Moore","10402","Operations|Dispatcher","Carla Jensen",{enabled:false,groups:[],last:null,mfa:false,preHire:true});

  // Filler staff (deterministic)
  let seed=20261005; const rnd=()=>{seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296;};
  const F=["Adrian","Beatriz","Caleb","Diana","Elijah","Fatima","Gabriel","Hannah","Isaac","Jasmine","Kenji","Leah","Mateo","Naomi","Owen","Priya","Quinn","Rosa","Simon","Tara","Umar","Vanessa","Wesley","Ximena","Yusuf","Zoe","Andre","Bianca","Colin","Daniela","Felix","Grace","Hector","Iris","Julian","Kayla","Luis","Mei","Nathan","Olivia"];
  const L=["Bishop","Castillo","Dawson","Espinoza","Fischer","Gutierrez","Hughes","Ibarra","Jacobs","Kaur","Lindqvist","Mendoza","Nakamura","Ortiz","Pham","Quintero","Reyes","Sullivan","Tran","Underwood","Vargas","Whitaker","Yamamoto","Zamora","Delgado"];
  const plan=[["Operations|Warehouse Associate",40,"Marcus Bell"],["Operations|Dispatcher",18,"Carla Jensen"],["Sales|Account Executive",20,null],["Finance|AP Clerk",6,"Derek Chan"],["HR|HR Generalist",5,"Angela Ruiz"],["IT|Service Desk Tech",5,"Victor Alvarez"],["Operations|Ops Contractor",6,"Carla Jensen (sponsor)"]];
  let i=0, emp=10410;
  plan.forEach(([rk,n,mgr])=>{ for(let k=0;k<n;k++){
    const fn=F[i%F.length], ln=L[(i*7+3)%L.length]; i++;
    let id=(fn+"."+ln).toLowerCase(); if(U[id]) id+=i;
    const x={last:Math.floor(rnd()*30)};
    if(rk.endsWith("Contractor")){x.type="Contractor";x.expiry=20+Math.floor(rnd()*60);}
    K(id,fn+" "+ln,rk.endsWith("Contractor")?"C-"+(2100+k):String(emp++),rk,mgr||(k%2?"Linda Park":"Kevin Nguyen"),x);
  }});
  return U;
}

export const HR_FEED = [
  {type:"Hire",who:"Maria Lopez",detail:"AP Clerk, Finance. Manager: Derek Chan. Start date: today.",when:0},
  {type:"Hire",who:"Ethan Moore",detail:"Dispatcher, Operations. Manager: Carla Jensen. Start date: today.",when:0},
  {type:"Rehire",who:"Sofia Ramirez",detail:"Rehired as HR Generalist, HR. Manager: Angela Ruiz. Previously Account Executive, Sales (left Aug 2025).",when:0},
  {type:"Transfer",who:"Tanya Wright",detail:"From Account Executive, Sales to Dispatcher, Operations. New manager: Carla Jensen. Effective today.",when:0},
  {type:"Termination",who:"Robert Hayes",detail:"Involuntary. Effective today, 12:00 PM.",when:0},
  {type:"Leave of absence",who:"Rachel Adams",detail:"Leave begins today. Expected return: Jan 4, 2027.",when:0},
  {type:"Contract end",who:"Dev Patel",detail:"Contract end date on file: "+fmtDay(2)+". Sponsor: Carla Jensen.",when:-1},
  {type:"Termination",who:"Brian Walsh",detail:"Voluntary resignation. Last day: "+fmtDay(-14)+".",when:-14}
];
