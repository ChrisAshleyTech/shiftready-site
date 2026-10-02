// Builds a company's PAM shift from its story. The PAM path works the same live queue as the IAM
// paths, as the company's privileged access analyst: twelve assigned tickets, two standing tickets
// that arrive partway through, and nine follow-ups that bad work causes later in the shift.
//
// On this path the company has moved its admin roles into a PAM vault. The vaulted roles leave the
// access matrix: people in eligible jobs activate them just in time, against an approved change or
// incident, for a limited window. Break-glass accounts are the only standing holders. The kit owns
// the mechanics (grading, hints, replies, the playbook, the runbook and the directory changes), so a
// company only writes who is involved and what happened.
import { S, U, has, C, verifiedBefore, approvalBefore, esc, escalatedOn } from "../../engine/store.js";
import { act, tact } from "../../engine/state.js";
import { TK } from "../../engine/tickets.js";
import { PAM_SKILLS } from "../../engine/hints.js";

// The assigned slots, in queue order, with their ticket type and default priority.
const MON = [
  ["jit", "Request", 2], ["breakGlass", "Incident", 1], ["notEligible", "Request", 3], ["rotate", "Request", 2],
  ["standing", "Task", 3], ["adminLeaver", "Request", 1], ["vendor", "Request", 2], ["noChange", "Request", 3],
  ["session", "Question", 2], ["compromised", "Incident", 1], ["shared", "Request", 4], ["auditQ", "Question", 3],
];
// Standing tickets: the break-glass close-out and the end of the vendor's session.
const THU = ["bgClose", "vendorEnd"];
// Follow-ups, in the order they're checked: [key, source slot, type].
const CON = [
  ["standingJit", "jit", "Incident"], ["notEligible", "notEligible", "Incident"], ["svcDown", "rotate", "Incident"], ["svcLeak", "rotate", "Incident"],
  ["leaver", "adminLeaver", "Incident"], ["noChange", "noChange", "Incident"], ["compromised", "compromised", "Incident"],
  ["bgOpen", "bgClose", "Incident"], ["vendorOpen", "vendorEnd", "Incident"],
];
// Skill and tutor category for each ticket.
const HINT_OF = {
  jit: ["jit", "jit"], breakGlass: ["emergency", "breakglass"], notEligible: ["standing", "eligible"], rotate: ["vault", "vault"],
  standing: ["standing", "standing"], adminLeaver: ["vault", "leaver"], vendor: ["emergency", "vendor"], noChange: ["jit", "jit"],
  session: ["monitor", "session"], compromised: ["monitor", "compromise"], shared: ["vault", "shared"], auditQ: ["standing", "audit"],
  bgClose: ["emergency", "breakglass"], vendorEnd: ["emergency", "vendor"],
  c_standingJit: ["jit", "jit"], c_notEligible: ["monitor", "compromise"], c_svcDown: ["vault", "service"], c_svcLeak: ["vault", "vault"],
  c_leaver: ["vault", "leaver"], c_noChange: ["monitor", "compromise"], c_compromised: ["monitor", "compromise"],
  c_bgOpen: ["emergency", "breakglass"], c_vendorOpen: ["emergency", "vendor"],
};
// Framework topics (see app/frameworks.ts).
const TOPICS = {
  jit: ["jit", "request"], breakGlass: ["breakglass", "verify"], notEligible: ["privileged", "request"], rotate: ["vault", "service"],
  standing: ["privileged", "review"], adminLeaver: ["leaver", "vault"], vendor: ["contractor", "jit"], noChange: ["jit", "privileged"],
  session: ["session", "evidence"], compromised: ["incident", "privileged"], shared: ["shared", "vault"], auditQ: ["privileged", "evidence"],
  bgClose: ["breakglass", "vault"], vendorEnd: ["contractor", "jit"],
  c_standingJit: ["jit", "privileged"], c_notEligible: ["privileged", "incident"], c_svcDown: ["service"], c_svcLeak: ["vault", "incident"],
  c_leaver: ["leaver", "vault", "incident"], c_noChange: ["jit", "incident"], c_compromised: ["incident", "privileged"],
  c_bgOpen: ["breakglass", "vault"], c_vendorOpen: ["contractor", "incident"],
};

const g = x => `<span class="mono">${x}</span>`;
const list = arr => arr.map(g).join(", ");
const SEC = "Security team", OWNER = "Account owner";
const first = name => name.split(" ")[0];
const plain = s => String(s || "").replace(/ \((owner|sponsor)\)$/, "");
const hrs = n => `${n} ${n === 1 ? "hour" : "hours"}`;
const lastIdx = f => { for (let i = S.log.length - 1; i >= 0; i--) if (f(S.log[i])) return i; return -1; };
// Held as a just-in-time activation of no more than `max` hours (never as a standing member).
export const jitOk = (uid, grp, max) => { const u = U(uid); return u.groups.includes(grp) && !!(u.jit && u.jit[grp]) && u.jit[grp] <= max; };
// The credential was rotated after the last time one of `acts` touched the account.
const rotatedAfter = (uid, acts) => lastIdx(e => e.a === "rotate" && e.target === uid) > lastIdx(e => acts.includes(e.a) && e.target === uid);

/**
 * spec: {
 *   id, vault: the vault product's name in the story ("the PAM vault"), maxHours (default 4),
 *   eligible: { "Dept|Title": [vaulted groups] }, also: extra vaulted groups nobody is eligible for,
 *   roles: extra access-matrix rows for the PAM shift, cast: extra directory entries (Core tuples),
 *   hr: extra HR feed rows, cite: { policyKey: [{label, href}] } for the PAM runbook,
 *   mon: { slot: story }, thu: { bgClose, vendorEnd }, conseq: { key: { id, from, channel, opened, lesson? } },
 * }
 * A story has the ticket's id, from, channel, opened and lesson, plus the slot's people and groups.
 * Optional: title, body (HTML), pri, nudge, approval.
 */
export function buildPam(spec, company, policy) {
  const M = spec.mon, Th = spec.thu, K = spec.conseq, MAX = spec.maxHours ?? 4, VAULT = spec.vault ?? "the PAM vault";
  const ELIGIBLE = spec.eligible;
  const VAULTED = [...new Set([...Object.values(ELIGIBLE).flat(), ...(spec.also || [])])].sort();
  const strip = gs => gs.filter(x => !VAULTED.includes(x));

  // ---------------- The company on this path ----------------
  const ROLES = Object.fromEntries([...Object.entries(company.ROLES), ...Object.entries(spec.roles || {})].map(([k, v]) => [k, strip(v)]));
  const buildUsers = () => {
    const D = company.buildUsers();
    for (const u of Object.values(D)) u.groups = strip(u.groups);
    for (const [id, name, empId, rk, mgr, x = {}] of spec.cast) {
      if (D[id]) throw new Error(`PAM cast ${id} is already in the ${spec.id} directory`);
      const [dept, title] = rk ? rk.split("|") : [x.dept, x.title];
      D[id] = Object.assign({ id, name, empId, dept, title, mgr, type: "Employee", enabled: true, locked: false, mfa: true,
        groups: rk ? ROLES[rk].slice() : [], last: 0, expiry: null, revoked: false, pwReset: false, mfaReset: false, preHire: false }, x);
    }
    return D;
  };
  const P = buildUsers();
  const BREAK_GLASS = Object.values(P).filter(u => u.type === "Break-glass").map(u => u.id);
  const pamCompany = { ...company, ROLES, buildUsers, HR_FEED: [...(spec.hr || []), ...company.HR_FEED],
    ALL_GROUPS: [...new Set([...company.ALL_GROUPS, ...VAULTED, ...Object.values(ROLES).flat(), ...Object.values(P).flatMap(u => u.groups)])].sort(),
    PAM: { vaulted: VAULTED, eligible: ELIGIBLE, breakGlass: BREAK_GLASS, maxHours: MAX } };

  const name = uid => P[uid].name;
  const caller = uid => ({ empId: P[uid].empId, mgr: P[uid].mgr });
  const rkOf = uid => `${P[uid].dept}|${P[uid].title}`;
  const eligibleFor = uid => ELIGIBLE[rkOf(uid)] || [];
  const base = (s, type, pri, users, close, extra = {}) => ({ id: s.id, type, pri: s.pri ?? pri, title: s.title, from: s.from, channel: s.channel,
    opened: s.opened, users, close, ...(s.approval ? { approval: s.approval } : {}), ...extra, body: s.body, lesson: s.lesson });

  // ---------------- The PAM runbook ----------------
  const bg = BREAK_GLASS.map(g).join(" and ");
  const cite = k => (spec.cite && spec.cite[k]) || undefined;
  const PAM_POLICIES = [
    { key: "pam-jit", title: "Just-in-time elevation", html: `The privileged roles ${list(VAULTED)} live in ${VAULT}. Nobody holds them permanently. Activate one only for someone eligible for it, only against an approved change or incident recorded on the ticket, and only for the approved window, never more than ${hrs(MAX)}. Use <b>Activate just in time</b>; adding the group directly makes it permanent.`, cite: cite("pam-jit") },
    { key: "pam-eligible", title: "Eligibility and standing access", html: `Eligibility comes from the job: see <i>Eligible privileged roles</i> below. Anyone outside those jobs isn't eligible, whatever their manager approves. Any standing (permanent) membership of a vaulted role is an exception to remove, except the break-glass accounts ${bg}.`, cite: cite("pam-eligible") },
    { key: "pam-breakglass", title: "Break-glass accounts", html: `${bg} hold standing emergency admin rights, stay disabled, and their credentials are sealed in ${VAULT}. Enable one only when the incident commander declares an emergency in which normal admin sign-in is impossible, after verifying the caller, and tell Security at once. When the emergency is over: disable the account, rotate its credential and revoke its sessions.`, cite: cite("pam-breakglass") },
    { key: "pam-vault", title: "Credential rotation", html: `Service and break-glass credentials are held in ${VAULT}, which rotates them. Rotate a credential at once when it has been exposed, when someone who checked it out leaves, and after break-glass use. Rotating changes the password, not the account: never disable a service account to contain an exposed credential, and tell Security about the exposure.`, cite: cite("pam-vault") },
    { key: "pam-session", title: "Privileged session monitoring", html: `Every privileged session is recorded. Commands have to stay within the approved change or incident the session was opened for. Report any session that goes outside it to Security with the session ID.`, cite: cite("pam-session") },
    { key: "pam-vendor", title: "Third-party access", html: `Vendor accounts stay disabled between sessions. For an approved support session: get the sponsor's approval on the ticket, enable the account, and activate the role just in time for the session only. When the session ends, disable the account, remove the role and revoke its sessions.`, cite: cite("pam-vendor") },
    { key: "pam-shared", title: "No shared admin credentials", html: `Admins check credentials out of ${VAULT} under their own identity. Admin passwords are never shared in chat, email or on paper, and no shared admin logins are created.`, cite: cite("pam-shared") },
  ].map(p => (p.cite ? p : { key: p.key, title: p.title, html: p.html }));
  const KEEP = ["verify", "leavers", "compromised", "contractors"];
  const POLICIES = [...PAM_POLICIES, ...policy.POLICIES.filter(p => KEEP.includes(p.key))];
  const pamPolicy = { POLICIES, POLICY: Object.fromEntries(POLICIES.map(p => [p.key, p])) };

  // ---------------- Assigned tickets ----------------
  const sessTable = rows => `<div class="overflow-x-auto"><table class="w-full text-left text-xs"><caption class="sr-only">Privileged sessions</caption><thead><tr><th class="py-1 pr-3">Session</th><th class="py-1 pr-3">Admin</th><th class="py-1 pr-3">Opened for</th><th class="py-1 pr-3">Target</th><th class="py-1">Recorded commands</th></tr></thead><tbody>${rows.map(([sid, uid, why, target, cmds]) => `<tr class="border-t align-top"><td class="py-1.5 pr-3 font-mono">${sid}</td><td class="py-1.5 pr-3">${name(uid)}</td><td class="py-1.5 pr-3">${why}</td><td class="py-1.5 pr-3">${target}</td><td class="py-1.5">${cmds}</td></tr>`).join("")}</tbody></table></div>`;
  const sessIds = () => M.session.rows.filter(r => r[5]).map(r => r[0]).sort();
  const sessGot = ans => [...new Set((String(ans || "").toUpperCase().match(/[A-Z]+-\d+/g) || []))].sort();
  const auditWant = () => Object.values(S.users).filter(u => u.enabled && u.groups.includes(M.auditQ.group)).map(u => u.id).sort();

  const mk = {
    jit: s => base({ title: `Elevation for ${s.change}: ${s.group}`, approval: `${s.approver} (change manager): "${s.change} is approved for today, ${hrs(s.hours)} window starting now."`,
      body: `<p>${name(s.uid)} needs ${g(s.group)} to ${s.what} under change ${g(s.change)}. The approved window is ${hrs(s.hours)}.</p><p>Please activate it so the work can start.</p>`, ...s },
      "Request", 2, [s.uid], "resolve", { grade: () => [
        C(approvalBefore(s.id, e => (e.a === "jit" || e.a === "addgrp") && e.target === s.uid), "Change approval recorded before the activation", 3),
        C(has(s.uid, s.group) && !!(U(s.uid).jit || {})[s.group], `${s.group} activated just in time, not added permanently`, 3),
        C(jitOk(s.uid, s.group, s.hours), `Window no longer than the approved ${hrs(s.hours)}`, 2, (U(s.uid).jit || {})[s.group] ? `Activated for ${hrs(U(s.uid).jit[s.group])}` : ""),
        C(U(s.uid).groups.length === P[s.uid].groups.length + 1, "Nothing else added", 1)] }),
    breakGlass: s => base({ title: `Emergency: break-glass access for ${s.outage}`, ...s }, "Incident", 1, [s.bg, s.uid], "resolve", { caller: caller(s.uid),
      grade: ts => [C(verifiedBefore(s.id, ["enable"], s.bg), "Caller verified before the break-glass account was enabled", 3), C(U(s.bg).enabled, `${s.bg} enabled for the emergency`, 3), C(esc(ts, SEC), "Security told about the break-glass use", 2)] }),
    notEligible: s => base({ approval: `${plain(P[s.uid].mgr)}: "Approved. ${first(name(s.uid))} needs it today."`, ...s }, "Request", 3, [s.uid], "reject",
      { grade: () => [C(!has(s.uid, s.group), `${s.group} not granted (a ${P[s.uid].title} isn't eligible)`, 5)] }),
    rotate: s => base(s, "Request", 2, [s.svc], "resolve", {
      grade: ts => [C(U(s.svc).rotated, `${s.svc} credential rotated`, 4), C(U(s.svc).enabled, `${s.svc} left enabled (production depends on it)`, 2), C(esc(ts, SEC), "Exposure reported to the Security team", 2)] }),
    standing: s => base(s, "Task", 3, [...s.holders.map(([u]) => u), s.bg], "resolve", {
      grade: () => [...s.holders.map(([u, grp]) => C(!has(u, grp), `${u}: standing ${grp} removed`, 2)),
        C(has(s.bg, s.bgGroup), `${s.bg} kept (break-glass accounts are the documented exception)`, 2),
        C(s.holders.every(([u]) => U(u).enabled), "Admins' own accounts left enabled", 1)] }),
    adminLeaver: s => base(s, "Request", 1, [s.uid, s.svc], "resolve", {
      grade: () => [C(!U(s.uid).enabled, "Account disabled", 2), C(U(s.uid).revoked, "Sessions revoked", 2), C(U(s.uid).groups.length === 0, "All access removed", 2, U(s.uid).groups.length ? "Still in: " + U(s.uid).groups.join(", ") : ""),
        C(U(s.svc).rotated, `${s.svc} credential rotated (${first(name(s.uid))} checked it out)`, 3)] }),
    vendor: s => base({ approval: `${plain(P[s.uid].mgr)} (sponsor): "Approved for today's support session, ${hrs(s.hours)}."`, ...s }, "Request", 2, [s.uid], "resolve", {
      grade: () => [C(approvalBefore(s.id, e => (e.a === "jit" || e.a === "addgrp") && e.target === s.uid), "Sponsor approval recorded before the activation", 3), C(U(s.uid).enabled, "Vendor account enabled for the session", 1),
        C(jitOk(s.uid, s.group, s.hours), `${s.group} activated just in time, for the ${hrs(s.hours)} session at most`, 3, (U(s.uid).jit || {})[s.group] ? `Activated for ${hrs(U(s.uid).jit[s.group])}` : has(s.uid, s.group) ? "Added permanently" : "")] }),
    noChange: s => base({ approval: `${plain(P[s.uid].mgr)}: "Fine by me."`, ...s }, "Request", 3, [s.uid], "reject",
      { grade: () => [C(!has(s.uid, s.group), `${s.group} not activated (no approved change, and longer than ${hrs(MAX)})`, 5)] }),
    session: s => base({ ...s, body: `${s.intro}${sessTable(s.rows)}` }, "Question", 2, [], "resolve", { question: true,
      answerLabel: "Session IDs for Security", answerHelp: "Session IDs separated by commas, or \"none\".",
      grade: ts => { const want = sessIds(), got = sessGot(ts.answer), ok = want.join() === got.join();
        return [C(ok, "Sessions outside their change identified", 4, ok ? "" : "Correct answer: " + want.join(", ")), C(esc(ts, SEC), "Sent to the Security team", 2)]; } }),
    compromised: s => base(s, "Incident", 1, [s.uid], "resolve", {
      grade: ts => [C(U(s.uid).revoked, "Sessions revoked", 3), C(U(s.uid).pwReset, "Password reset", 2), C(U(s.uid).mfaReset, "MFA reset", 2), C(!has(s.uid, s.group), `${s.group} removed`, 2), C(esc(ts, SEC), "Escalated to the Security team", 3)] }),
    shared: s => base(s, "Request", 4, [s.uid], "reject", { grade: () => [C(!S.log.some(e => e.ticket === s.id && e.target), "No shared login created or password handed out", 4)] }),
    auditQ: s => base(s, "Question", 3, [], "resolve", { question: true,
      grade: ts => { const want = auditWant(), a = (ts.answer || "").toLowerCase();
        const got = Object.values(S.users).filter(u => a.includes(u.id) || a.includes(u.name.toLowerCase())).map(u => u.id).sort();
        const ok = want.length ? want.join() === got.join() : (a.trim() === "none" && !got.length);
        return [C(ok, "Answer matches the directory", 5, ok ? "" : "Correct answer: " + (want.join(", ") || "none"))]; } }),
  };
  const T = MON.map(([slot]) => mk[slot](M[slot]));
  const STANDING = [
    base({ title: `Emergency over: close out ${M.breakGlass.bg}`, ...Th.bgClose }, "Task", 2, [M.breakGlass.bg], "resolve", {
      grade: () => [C(!U(M.breakGlass.bg).enabled, `${M.breakGlass.bg} disabled`, 3), C(rotatedAfter(M.breakGlass.bg, ["enable"]), "Credential rotated after the emergency use", 3), C(U(M.breakGlass.bg).revoked, "Sessions revoked", 2)] }),
    base({ title: `Vendor session finished: ${name(M.vendor.uid)}`, ...Th.vendorEnd }, "Task", 2, [M.vendor.uid], "resolve", {
      grade: () => [C(!U(M.vendor.uid).enabled, "Vendor account disabled", 3), C(!has(M.vendor.uid, M.vendor.group), `${M.vendor.group} removed`, 2), C(U(M.vendor.uid).revoked, "Sessions revoked", 2)] }),
  ];

  // ---------------- Follow-ups ----------------
  const J = M.jit, NE = M.notEligible, NC = M.noChange, RO = M.rotate, AL = M.adminLeaver, CO = M.compromised, BG = M.breakGlass.bg, VE = M.vendor;
  const contained = u => !(U(CO.uid).revoked && U(CO.uid).pwReset && U(CO.uid).mfaReset && !has(CO.uid, CO.group) && escalatedOn(CO.id, SEC)) && u;
  const F = {
    standingJit: { when: () => has(J.uid, J.group) && !jitOk(J.uid, J.group, J.hours) && J.uid, users: [J.uid],
      cause: `${name(J.uid)} got ${J.group} permanently or for longer than the ${hrs(J.hours)} window (${J.id}).`,
      prevented: `${name(J.uid)}'s ${J.group} was activated just in time for the change window only.`,
      title: `PAM alert: ${J.group} still active for ${name(J.uid)}`,
      body: `<p>${VAULT[0].toUpperCase() + VAULT.slice(1)} flagged ${name(J.uid)} (${g(J.uid)}) as holding ${g(J.group)} outside a just-in-time window. Change ${g(J.change)} closed hours ago.</p><p>Remove the role. ${first(name(J.uid))} can activate it again for the next approved change.</p>`,
      lesson: "A privileged role that outlives its change is standing access, whatever the ticket said. Activate for the window, and nothing longer.",
      grade: () => () => [C(!has(J.uid, J.group), `${J.group} removed`, 4)] },
    notEligible: { when: () => has(NE.uid, NE.group) && NE.uid, users: [NE.uid], apply: () => { U(NE.uid).revoked = false; },
      cause: `${name(NE.uid)}, a ${P[NE.uid].title}, was given ${NE.group} (${NE.id}).`,
      prevented: `${name(NE.uid)} wasn't given ${NE.group}.`,
      title: `Admin action by a non-admin: ${name(NE.uid)}`,
      body: `<p>The security monitoring team saw ${g(NE.uid)} use ${g(NE.group)} to change other people's accounts. ${first(name(NE.uid))} isn't in a job that is eligible for the role.</p><p>Take the role away, end the sessions it was used in, and hand this to Security.</p>`,
      lesson: "Eligibility comes from the job, not from an approval. A manager can't approve someone into an admin role their job doesn't include.",
      grade: () => ts => [C(!has(NE.uid, NE.group), `${NE.group} removed`, 4), C(U(NE.uid).revoked, "Sessions revoked", 2), C(esc(ts, SEC), "Escalated to the Security team", 3)] },
    svcDown: { when: () => !U(RO.svc).enabled && RO.svc, users: [RO.svc],
      cause: `${RO.svc} was disabled instead of having its credential rotated (${RO.id}).`, prevented: `${RO.svc} stayed enabled while its credential was rotated.`,
      title: `Outage: ${RO.down} stopped`, body: `<p>${RO.down} has stopped. The logs show a sign-in failure: ${g(RO.svc)} is disabled.</p><p>Get it running again and let the account's owner, ${plain(P[RO.svc].mgr)}, know what happened.</p>`,
      lesson: "Rotating a credential contains an exposure without breaking production. Disabling a service account takes down whatever depends on it.",
      grade: () => ts => [C(U(RO.svc).enabled, `${RO.svc} re-enabled`, 3), C(esc(ts, OWNER), `Escalated to the account owner (${plain(P[RO.svc].mgr)})`, 2)] },
    svcLeak: { when: () => !U(RO.svc).rotated && RO.svc, users: [RO.svc], apply: () => { U(RO.svc).revoked = false; },
      cause: `The exposed ${RO.svc} credential wasn't rotated (${RO.id}).`, prevented: `The exposed ${RO.svc} credential was rotated before anyone could use it.`,
      title: `${RO.svc} signed in from an unknown host`, body: `<p>${g(RO.svc)} just signed in from a host that isn't one of its servers, using the password that was exposed this morning.</p><p>Shut the stranger out without taking production down, and get Security on it.</p>`,
      lesson: "An exposed credential is a live key until it's rotated. Rotate it, end its sessions, and report it.",
      grade: () => ts => [C(U(RO.svc).rotated, "Credential rotated", 3), C(U(RO.svc).revoked, "Sessions revoked", 2), C(U(RO.svc).enabled, "Account left enabled", 1), C(esc(ts, SEC), "Escalated to the Security team", 3)] },
    leaver: { when: () => (U(AL.uid).enabled || !U(AL.uid).revoked || U(AL.uid).groups.length || !U(AL.svc).rotated) && AL.uid, users: [AL.uid, AL.svc],
      apply: () => { U(AL.uid).revoked = false; },
      cause: `${name(AL.uid)}'s admin offboarding was incomplete, or ${AL.svc}'s credential wasn't rotated (${AL.id}).`,
      prevented: `${name(AL.uid)} was fully offboarded and ${AL.svc} rotated.`,
      title: `Activity after termination: ${name(AL.uid)}`, body: `<p>Security sees activity tied to ${name(AL.uid)} after the termination: either the account itself or ${g(AL.svc)}, whose password ${first(name(AL.uid))} checked out last week.</p><p>Finish the offboarding, rotate the credential, and escalate.</p>`,
      lesson: "When an admin leaves, everything they knew leaves with them only if it's rotated. Disable, revoke, remove, and rotate what they checked out.",
      grade: () => ts => [C(!U(AL.uid).enabled, "Account disabled", 2), C(U(AL.uid).revoked, "Sessions revoked", 2), C(U(AL.uid).groups.length === 0, "All access removed", 2), C(U(AL.svc).rotated, `${AL.svc} rotated`, 2), C(esc(ts, SEC), "Escalated to the Security team", 3)] },
    noChange: { when: () => has(NC.uid, NC.group) && NC.uid, users: [NC.uid], apply: () => { U(NC.uid).revoked = false; },
      cause: `${name(NC.uid)} got ${NC.group} with no approved change (${NC.id}).`, prevented: `${NC.group} wasn't activated without an approved change.`,
      title: `Unapproved change on ${NC.target}`, body: `<p>${NC.target} was changed overnight with no change record. The privileged session belongs to ${g(NC.uid)}, using ${g(NC.group)}.</p><p>Take the role away, end the session, and hand it to Security to review what was changed.</p>`,
      lesson: "Eligible isn't the same as approved. Admin rights are activated for an approved change or incident, for a short window, and nothing else.",
      grade: () => ts => [C(!has(NC.uid, NC.group), `${NC.group} removed`, 4), C(U(NC.uid).revoked, "Sessions revoked", 2), C(esc(ts, SEC), "Escalated to the Security team", 3)] },
    compromised: { when: () => contained(CO.uid), users: [CO.uid], apply: () => { Object.assign(U(CO.uid), { revoked: false, pwReset: false, mfaReset: false, mfa: true }); },
      cause: `${name(CO.uid)}'s compromised admin account wasn't fully contained and escalated (${CO.id}).`, prevented: `${name(CO.uid)}'s admin account was contained and escalated.`,
      title: `The attacker is back in ${name(CO.uid)}'s account`, body: `<p>New sign-ins on ${g(CO.uid)} from the same infrastructure as this morning's alert. Something they held is still working.</p><p>Contain the account completely this time.</p>`,
      lesson: "A compromised admin account is contained when every way back is closed: sessions, password, MFA and the privileged role itself. Then Security takes it.",
      grade: () => ts => [C(U(CO.uid).revoked, "Sessions revoked", 3), C(U(CO.uid).pwReset, "Password reset", 2), C(U(CO.uid).mfaReset, "MFA reset", 2), C(!has(CO.uid, CO.group), `${CO.group} removed`, 2), C(esc(ts, SEC), "Escalated to the Security team", 3)] },
    bgOpen: { when: () => (U(BG).enabled || !rotatedAfter(BG, ["enable"]) || !U(BG).revoked) && BG, users: [BG], apply: () => { U(BG).revoked = false; },
      cause: `${BG} wasn't fully closed out after the emergency (${Th.bgClose.id}).`, prevented: `${BG} was disabled, rotated and signed out after the emergency.`,
      title: `${BG} used after the emergency`, body: `<p>${g(BG)} signed in again this afternoon, hours after the outage was declared over. The break-glass procedure says it should be sealed.</p><p>Seal it properly and escalate.</p>`,
      lesson: "Break-glass access is only safe if it's closed as deliberately as it was opened: disabled, rotated and signed out, every time.",
      grade: () => ts => [C(!U(BG).enabled, "Account disabled", 3), C(rotatedAfter(BG, ["enable"]), "Credential rotated", 3), C(U(BG).revoked, "Sessions revoked", 2), C(esc(ts, SEC), "Escalated to the Security team", 2)] },
    vendorOpen: { when: () => (U(VE.uid).enabled || has(VE.uid, VE.group)) && VE.uid, users: [VE.uid], apply: () => { U(VE.uid).revoked = false; },
      cause: `${name(VE.uid)}'s vendor access was left open after the session (${Th.vendorEnd.id}).`, prevented: `${name(VE.uid)}'s vendor access was closed when the session ended.`,
      title: `Vendor account active overnight: ${name(VE.uid)}`, body: `<p>${g(VE.uid)} connected again overnight, outside any approved session.</p><p>Close the access and escalate.</p>`,
      lesson: "Third-party access is opened for a session and closed when it ends. An enabled vendor account with admin rights is an open door into your network.",
      grade: () => ts => [C(!U(VE.uid).enabled, "Vendor account disabled", 3), C(!has(VE.uid, VE.group), `${VE.group} removed`, 2), C(U(VE.uid).revoked, "Sessions revoked", 2), C(esc(ts, SEC), "Escalated to the Security team", 3)] },
  };
  const srcOf = slot => (M[slot] || Th[slot]).id;
  const CONSEQ = CON.map(([key, , type]) => {
    const f = F[key], k = K[key];
    return { key, when: f.when, cause: f.cause, prevented: f.prevented, apply: f.apply || (() => {}),
      make: () => ({ id: k.id, type, pri: k.pri ?? 1, title: k.title ?? f.title, from: k.from, channel: k.channel, opened: k.opened, users: f.users, close: "resolve",
        body: k.body ?? f.body, lesson: k.lesson ?? f.lesson, grade: f.grade() }) };
  });
  const CONSEQ_LINKS = Object.fromEntries(CON.map(([key, slot]) => [key, { src: srcOf(slot), id: K[key].id }]));

  // ---------------- Requester replies ----------------
  const REPLIES = {
    [J.id]: () => has(J.uid, J.group) ? null : { from: J.from, text: `I still can't start ${J.change}. ${J.group} isn't active on my account.` },
    [M.breakGlass.id]: () => U(BG).enabled ? null : { from: M.breakGlass.from, text: `${BG} still says it's disabled. We're still locked out of the admin consoles.` },
    [VE.id]: () => U(VE.uid).enabled && has(VE.uid, VE.group) ? null : { from: plain(P[VE.uid].mgr), text: `${first(name(VE.uid))} still can't get in for the support session. Can you check the account and the role?` },
    [M.session.id]: ts => sessIds().join() === sessGot(ts.answer).join() ? null : { from: M.session.from, text: "Your list doesn't match what the recordings show. Please check each session against its change again." },
    [M.auditQ.id]: ts => TK[M.auditQ.id].grade(ts)[0].pass ? null : { from: M.auditQ.from, text: "Your list doesn't match what we pulled from the directory. Please check it again and resend." },
  };

  // ---------------- Hints ----------------
  const H = (key, clause, steps, nudge) => ({ skill: HINT_OF[key][0], kind: HINT_OF[key][1], nudge, clause, steps });
  const HINTS = {};
  const resolve = "Resolve the ticket.";
  const add = (slot, clause, steps, nudge) => { const s = M[slot] ?? Th[slot]; HINTS[s.id] = H(slot, clause, steps, s.nudge ?? nudge); };
  const jitStep = (uid, grp, h) => `Open ${name(uid)}. Under <b>Privileged access</b>, pick ${g(grp)}, set ${g(String(h))} hours and select <b>Activate just in time</b>.`;
  add("jit", { keys: ["pam-jit", "pam-eligible"] },
    ["Start work on the ticket.", "Select <b>Request manager approval</b> and read the change manager's reply. It has to be logged before the activation.", jitStep(J.uid, J.group, J.hours), resolve],
    `${first(name(J.uid))} is eligible, and the change is real. What has to be on the ticket first, and how long should the role last?`);
  { const s = M.breakGlass; add("breakGlass", { keys: ["pam-breakglass", "verify"] },
    ["Start work on the ticket.", `Open ${name(s.uid)} and compare the caller's details with the directory: employee ID ${g(P[s.uid].empId)} and manager ${P[s.uid].mgr}. Both match.`,
      "Back on the ticket, select <b>Mark identity verified</b>.", `Open ${g(s.bg)} and select <b>Enable</b>.`, "Escalate the ticket to the <b>Security team</b>.", resolve],
    "Emergency access is the most powerful account you have. Who is asking, how do you know, and who has to know the moment it's used?"); }
  add("notEligible", { keys: ["pam-eligible", "pam-jit"] },
    [`Start work on the ticket. Don't add ${g(NE.group)} to ${first(name(NE.uid))}.`, `<b>Reject</b> the ticket. In the note, ${NE.alt}`],
    `The manager approved it. Check the eligible roles table: does a ${P[NE.uid].title} appear there at all?`);
  add("rotate", { keys: ["pam-vault"] },
    ["Start work on the ticket.", `Open ${g(RO.svc)} and select <b>Rotate credential</b>. Don't disable it.`, "Escalate the ticket to the <b>Security team</b> to look into the exposure.", resolve],
    "The account runs production. What makes the exposed password useless without stopping the jobs that depend on it?");
  { const s = M.standing; add("standing", { keys: ["pam-eligible", "pam-breakglass"] },
    ["Start work on the ticket.", ...s.holders.map(([u, grp]) => `Open ${name(u)} and remove ${g(grp)}.`), `Leave ${g(s.bg)} alone: break-glass accounts are the documented exception.`, resolve],
    "Every name on the report holds a vaulted role permanently. Is there any account that's allowed to?"); }
  add("adminLeaver", { keys: ["leavers", "pam-vault"] },
    () => ["Start work on the ticket.", `Open ${name(AL.uid)}. Select <b>Disable</b>, then <b>Revoke sessions</b>.`, `Remove every group: ${list(U(AL.uid).groups.length ? U(AL.uid).groups : P[AL.uid].groups)}.`, `Open ${g(AL.svc)} and select <b>Rotate credential</b>.`, resolve],
    `Offboarding an admin has one more part than offboarding anyone else. What does ${first(name(AL.uid))} know that still works after the account is gone?`);
  add("vendor", { keys: ["pam-vendor", "pam-jit"] },
    ["Start work on the ticket.", "Select <b>Request manager approval</b>. The sponsor replies on the ticket.", `Open ${name(VE.uid)} and select <b>Enable</b>.`, jitStep(VE.uid, VE.group, VE.hours), resolve],
    "Vendor access has three parts: who agrees, whether the account can sign in, and how long the admin rights last.");
  add("noChange", { keys: ["pam-jit"] },
    [`Start work on the ticket. Don't activate ${g(NC.group)}.`, `<b>Reject</b> the ticket. In the note, ${NC.alt}`],
    `${first(name(NC.uid))} is eligible for the role. Is eligibility the only condition?`);
  add("session", { keys: ["pam-session"] },
    ["Start work on the ticket.", `Compare each session's commands with the change or incident it was opened for. These went outside it: ${list(sessIds())}.`, `Type ${sessIds().map(g).join(", ")} in the answer box.`, "Escalate the ticket to the <b>Security team</b>.", resolve],
    "Read each session against its reason. A legitimate session can still do something it wasn't opened for.");
  add("compromised", { keys: ["compromised", "pam-jit"] },
    ["Start work on the ticket.", `Open ${name(CO.uid)}. Select <b>Revoke sessions</b>, <b>Reset password</b> and <b>Reset MFA</b>.`, `Remove ${g(CO.group)}.`, "Escalate to the <b>Security team</b>.", resolve],
    "It's an admin account, so the attacker may hold more than a session. List everything that still works for them, including the role.");
  add("shared", { keys: ["pam-shared", "pam-vault"] },
    ["Start work on the ticket. Don't change any account or hand out a password.", `<b>Reject</b> the ticket. In the note, ${M.shared.alt}`],
    "The night shift's problem is real. If several people use one admin password, who did each change, and how do you take the password back from one of them?");
  add("auditQ", { keys: ["pam-eligible"] },
    () => { const w = auditWant(); return ["Start work on the ticket.", `In the Directory, check every enabled account for ${g(M.auditQ.group)}, including just-in-time activations still running.`,
      `As of now, the directory shows: ${w.length ? list(w) : "<b>none</b>"}. If you change anyone's access before closing, check again.`, `Type ${w.length ? w.map(g).join(", ") : g("none")} in the answer box and <b>Resolve</b>.`]; },
    "Audit evidence comes from the system as it is now. An enabled account holding the role, by any route, is on the list.");
  add("bgClose", { keys: ["pam-breakglass", "pam-vault"] },
    ["Start work on the ticket.", `Open ${g(BG)}. Select <b>Disable</b>, <b>Rotate credential</b> and <b>Revoke sessions</b>.`, resolve],
    "The emergency is over. Put the account back exactly as it was before, sealed, with a password nobody has seen.");
  add("vendorEnd", { keys: ["pam-vendor"] },
    ["Start work on the ticket.", `Open ${name(VE.uid)}. Select <b>Disable</b> and <b>Revoke sessions</b>.`, `Remove ${g(VE.group)}.`, resolve],
    "Undo everything the session needed, in a way that stops it working tonight.");
  const addCon = (key, clause, steps, nudge) => { HINTS[K[key].id] = H("c_" + key, clause, steps, K[key].nudge ?? nudge); };
  addCon("standingJit", { keys: ["pam-jit"] }, ["Start work on the ticket.", `Open ${name(J.uid)} and remove ${g(J.group)}.`, resolve], "The change is over. Should anyone still hold the role?");
  addCon("notEligible", { keys: ["pam-eligible", "compromised"] }, ["Start work on the ticket.", `Open ${name(NE.uid)}. Remove ${g(NE.group)} and select <b>Revoke sessions</b>.`, "Escalate to the <b>Security team</b>.", resolve], "Take the role away, end what it was used in, and hand it on.");
  addCon("svcDown", { keys: ["pam-vault"] }, ["Start work on the ticket.", `Open ${g(RO.svc)} and select <b>Enable</b>.`, `Escalate to the <b>Account owner</b> (${plain(P[RO.svc].mgr)}).`, resolve], "Production is down because of an account change. What restores it fastest, and who owns the account?");
  addCon("svcLeak", { keys: ["pam-vault", "compromised"] }, ["Start work on the ticket.", `Open ${g(RO.svc)}. Select <b>Rotate credential</b> and <b>Revoke sessions</b>. Keep it enabled.`, "Escalate to the <b>Security team</b>.", resolve], "Someone has the password and is using it. Make it useless and end what they have open, without stopping production.");
  addCon("leaver", { keys: ["leavers", "pam-vault"] }, () => ["Start work on the ticket.", `Open ${name(AL.uid)}. Select <b>Disable</b> (if still enabled) and <b>Revoke sessions</b>.`, `Remove any remaining groups${U(AL.uid).groups.length ? ": " + list(U(AL.uid).groups) : ""}.`, `Open ${g(AL.svc)} and select <b>Rotate credential</b>.`, "Escalate to the <b>Security team</b>.", resolve], "Finish every part of the offboarding, including what the admin knew.");
  addCon("noChange", { keys: ["pam-jit", "compromised"] }, ["Start work on the ticket.", `Open ${name(NC.uid)}. Remove ${g(NC.group)} and select <b>Revoke sessions</b>.`, "Escalate to the <b>Security team</b>.", resolve], "Remove the access that made the unapproved change possible, and get the change reviewed.");
  addCon("compromised", { keys: ["compromised", "pam-jit"] }, ["Start work on the ticket.", `Open ${name(CO.uid)}. Select <b>Revoke sessions</b>, <b>Reset password</b> and <b>Reset MFA</b>, and remove ${g(CO.group)} if it's still there.`, "Escalate to the <b>Security team</b>.", resolve], "The first containment left a way back in. This time, close all of them.");
  addCon("bgOpen", { keys: ["pam-breakglass"] }, ["Start work on the ticket.", `Open ${g(BG)}. Select <b>Disable</b> (if still enabled), <b>Rotate credential</b> and <b>Revoke sessions</b>.`, "Escalate to the <b>Security team</b>.", resolve], "Seal the emergency account the way the procedure says, then report its use.");
  addCon("vendorOpen", { keys: ["pam-vendor"] }, ["Start work on the ticket.", `Open ${name(VE.uid)}. Select <b>Disable</b> and <b>Revoke sessions</b>, and remove ${g(VE.group)}.`, "Escalate to the <b>Security team</b>.", resolve], "Close everything the session opened, then report the overnight access.");

  // ---------------- Playbook: doing exactly what the exact-steps hints say ----------------
  const jit = (uid, grp, h) => act("jit", uid, `${grp}|${h}`);
  const rmAll = uid => U(uid).groups.slice().forEach(x => act("rmgrp", uid, x));
  const playbook = {
    [J.id]: id => { tact("approval", id); jit(J.uid, J.group, J.hours); return "resolve"; },
    [M.breakGlass.id]: id => { tact("verify", id); act("enable", BG); tact("escalate", id, SEC); return "resolve"; },
    [NE.id]: () => "reject",
    [RO.id]: id => { act("rotate", RO.svc); tact("escalate", id, SEC); return "resolve"; },
    [M.standing.id]: () => { M.standing.holders.forEach(([u, grp]) => act("rmgrp", u, grp)); return "resolve"; },
    [AL.id]: () => { act("disable", AL.uid); act("revoke", AL.uid); rmAll(AL.uid); act("rotate", AL.svc); return "resolve"; },
    [VE.id]: id => { tact("approval", id); act("enable", VE.uid); jit(VE.uid, VE.group, VE.hours); return "resolve"; },
    [NC.id]: () => "reject",
    [M.session.id]: id => { tact("escalate", id, SEC); return ["resolve", sessIds().join(", ")]; },
    [CO.id]: id => { ["revoke", "pwreset", "mfareset"].forEach(a => act(a, CO.uid)); act("rmgrp", CO.uid, CO.group); tact("escalate", id, SEC); return "resolve"; },
    [M.shared.id]: () => "reject",
    [M.auditQ.id]: () => ["resolve", auditWant().join(", ") || "none"],
    [Th.bgClose.id]: () => { act("disable", BG); act("rotate", BG); act("revoke", BG); return "resolve"; },
    [Th.vendorEnd.id]: () => { act("disable", VE.uid); act("revoke", VE.uid); act("rmgrp", VE.uid, VE.group); return "resolve"; },
    [K.standingJit.id]: () => { act("rmgrp", J.uid, J.group); return "resolve"; },
    [K.notEligible.id]: id => { act("rmgrp", NE.uid, NE.group); act("revoke", NE.uid); tact("escalate", id, SEC); return "resolve"; },
    [K.svcDown.id]: id => { act("enable", RO.svc); tact("escalate", id, OWNER); return "resolve"; },
    [K.svcLeak.id]: id => { act("rotate", RO.svc); act("revoke", RO.svc); tact("escalate", id, SEC); return "resolve"; },
    [K.leaver.id]: id => { act("disable", AL.uid); act("revoke", AL.uid); rmAll(AL.uid); act("rotate", AL.svc); tact("escalate", id, SEC); return "resolve"; },
    [K.noChange.id]: id => { act("rmgrp", NC.uid, NC.group); act("revoke", NC.uid); tact("escalate", id, SEC); return "resolve"; },
    [K.compromised.id]: id => { ["revoke", "pwreset", "mfareset"].forEach(a => act(a, CO.uid)); act("rmgrp", CO.uid, CO.group); tact("escalate", id, SEC); return "resolve"; },
    [K.bgOpen.id]: id => { act("disable", BG); act("rotate", BG); act("revoke", BG); tact("escalate", id, SEC); return "resolve"; },
    [K.vendorOpen.id]: id => { act("disable", VE.uid); act("revoke", VE.uid); act("rmgrp", VE.uid, VE.group); tact("escalate", id, SEC); return "resolve"; },
  };

  const topics = {
    ...Object.fromEntries([...MON.map(([slot]) => slot), ...THU].map(slot => [(M[slot] || Th[slot]).id, TOPICS[slot]])),
    ...Object.fromEntries(CON.map(([key]) => [K[key].id, TOPICS["c_" + key]])),
  };

  const tickets = { id: `${spec.id}-pam`, T, CONSEQ, STANDING, REPLIES, HINTS, CONSEQ_LINKS, G: [], SKILLS: PAM_SKILLS, playbook, topics,
    // GRC-only pieces don't apply on this path.
    jordan: null, audit: null, grc: { ctx: "", intro: "", levels: { title: "", items: [], note: "" } },
    story: { mon: M, thu: Th, conseq: K } };
  return { tickets, company: pamCompany, policy: pamPolicy };
}
