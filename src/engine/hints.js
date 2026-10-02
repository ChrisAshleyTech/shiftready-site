// Tiered hints, skill tags and tutor categories for every ticket.
// Tier 1 nudge (-10%), tier 2 policy clause (-25%), tier 3 exact steps (-50%, marks the
// ticket Assisted). Exact steps are written against each ticket's grading function, so
// following them earns full marks. A `steps` function reads live state when revealed.
// The hints themselves belong to the active company's ticket set (live bindings).
import { HINTS as PC_HINTS, CONSEQ_LINKS as PC_LINKS } from "../packs/pacific-crest/hints.js";

// Skills scored on the home page and the readiness report. Each ticket feeds one skill.
export const IAM_SKILLS = [
  {key:"verify", label:"Identity verification", blurb:"Checking callers against the directory before touching credentials."},
  {key:"jml", label:"Joiners, movers & leavers", blurb:"Provisioning, transfers, leave and offboarding from the role matrix."},
  {key:"access", label:"Least privilege & SoD", blurb:"Granting only what policy allows, whoever approves."},
  {key:"incident", label:"Incident containment", blurb:"Revoke, rotate, reset and escalate when an account is at risk."},
  {key:"hygiene", label:"Account hygiene", blurb:"Inactive accounts, service accounts and contractor expiry."},
];
// The PAM path scores privileged access skills instead.
export const PAM_SKILLS = [
  {key:"jit", label:"Just-in-time elevation", blurb:"Activating privileged roles only for an approved reason, for the shortest window."},
  {key:"standing", label:"Eligibility & standing access", blurb:"Knowing who may hold admin rights, and removing the ones nobody should hold permanently."},
  {key:"vault", label:"Credential vaulting & rotation", blurb:"Rotating exposed, shared and departed credentials without breaking production."},
  {key:"emergency", label:"Break-glass & third-party access", blurb:"Emergency and vendor access that is opened deliberately and closed completely."},
  {key:"monitor", label:"Session monitoring & response", blurb:"Reviewing privileged sessions and containing admin accounts that are at risk."},
];
export const skillsFor = p => (p === "pam" ? PAM_SKILLS : IAM_SKILLS);

export let HINTS, CONSEQ_LINKS, SKILLS = IAM_SKILLS;
export function setHints(hints, links, skills = IAM_SKILLS){ HINTS = hints; CONSEQ_LINKS = links; SKILLS = skills; }
setHints(PC_HINTS, PC_LINKS);
export const hintSteps = id => { const s = HINTS[id].steps; return typeof s === "function" ? s() : s; };

