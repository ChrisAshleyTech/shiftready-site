// Runbook policies shown on the Policy page and quoted by the "policy clause" hint tier.
import { REQUESTABLE } from "./company.js";

const g = x => `<span class="mono">${x}</span>`;

export const POLICIES = [
  {key:"verify", title:"Identity verification", html:"Before any password, MFA or unlock action for a caller, confirm their employee ID <i>and</i> manager match the directory. If either doesn't match, don't proceed. Escalate suspected social engineering to Security."},
  {key:"joiners", title:"Joiners", html:"Enable the pre-hire account and grant exactly the birthright groups for the role. Never copy another user's access."},
  {key:"movers", title:"Movers", html:"Update job info, remove the old role's groups, grant the new role's groups."},
  {key:"leavers", title:"Leavers", html:"Disable, revoke sessions, and remove all group memberships."},
  {key:"loa", title:"Leave of absence", html:"Disable the account. Keep group memberships for the return."},
  {key:"rehires", title:"Rehires", html:"Enable, reset the password, remove prior-role access, grant the new role's groups."},
  {key:"requestable", title:"Requestable access", html:`${REQUESTABLE.map(g).join(" and ")} may be granted outside the role with documented manager approval.`},
  {key:"sod", title:"Separation of duties", html:"Never grant access that creates an SoD conflict below, regardless of approval."},
  {key:"priv", title:"Privileged roles", html:"ROLE-Global-Admin is never assigned by ticket. Privileged access uses PIM just-in-time activation with CAB approval."},
  {key:"inactive", title:"Inactive accounts", html:"Disable user accounts with no sign-in for more than 90 days. Pre-hires are excluded. Service accounts are never disabled by the desk; escalate them to the account owner."},
  {key:"contractors", title:"Contractors", html:"Accounts must have an expiry date. Extensions require sponsor approval and are capped at 90 days."},
  {key:"shared", title:"Shared accounts", html:"Prohibited. Every person gets a unique ID."},
  {key:"compromised", title:"Compromised accounts", html:"Revoke sessions, reset the password, reset MFA, and escalate to Security."},
];
export const POLICY = Object.fromEntries(POLICIES.map(p => [p.key, p]));
