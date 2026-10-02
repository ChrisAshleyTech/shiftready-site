// The active company pack. Engine modules and pages import company data from here. The exports
// are live bindings (like S in store.js), so setCompanyData() updates every importer at once.
// Each pack's data lives in src/packs/<id>/company.js.
import * as PacificCrest from "../packs/pacific-crest/company.js";

// PAM is set on the PAM path only: the vaulted (privileged) groups, who is eligible for each, and
// the break-glass accounts.
export let ROLES, REQUESTABLE, SOD, ALL_GROUPS, BASE, fmtDay, buildUsers, HR_FEED, PAM;
export function setCompanyData(c){ ({ ROLES, REQUESTABLE, SOD, ALL_GROUPS, BASE, fmtDay, buildUsers, HR_FEED } = c); PAM = c.PAM || null; }
setCompanyData(PacificCrest);
