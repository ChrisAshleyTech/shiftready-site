// The active company's runbook policies (live bindings; see company.js).
import * as PacificCrest from "../packs/pacific-crest/policy.js";

export let POLICIES, POLICY;
export function setPolicyData(p){ ({ POLICIES, POLICY } = p); }
setPolicyData(PacificCrest);
