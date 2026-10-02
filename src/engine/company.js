// The active company pack. Engine modules and pages import company data from here. The exports
// are live bindings (like S in store.js), so setCompanyData() updates every importer at once.
// Each pack's data lives in src/packs/<id>/company.js.
import * as PacificCrest from "../packs/pacific-crest/company.js";

export let ROLES, REQUESTABLE, SOD, ALL_GROUPS, BASE, fmtDay, buildUsers, HR_FEED;
export function setCompanyData(c){ ({ ROLES, REQUESTABLE, SOD, ALL_GROUPS, BASE, fmtDay, buildUsers, HR_FEED } = c); }
setCompanyData(PacificCrest);
