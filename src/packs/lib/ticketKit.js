// Builds an industry company's ticket set from its story. Every company works the same week as
// Pacific Crest: twenty Monday tickets, two standing Thursday tickets and thirteen ways Monday can
// come back on Thursday. The kit owns the mechanics (grading, hints, the playbook, Jordan Reyes'
// mistakes, the week audit's populations and framework topics), so a company only writes who is
// involved and what happened. Grading mirrors Pacific Crest's tickets check for check.
import { S, U, has, C, roleCheck, firstIdx, verifiedBefore, approvalBefore, esc, sodConflicts, monEsc } from "../../engine/store.js";
import { act, tact } from "../../engine/state.js";
import { TK } from "../../engine/tickets.js";

// The Monday slots, in queue order, and their ticket type and default priority.
const MON = [
  ["joiner", "Request", 2], ["callerPw", "Incident", 3], ["callerLock", "Incident", 3], ["callerMfa", "Incident", 2],
  ["leaver", "Request", 1], ["mover", "Request", 3], ["sodReq", "Request", 3], ["request", "Request", 4],
  ["exec", "Incident", 1], ["contractor", "Request", 2], ["sweep", "Task", 3], ["recon", "Incident", 1],
  ["priv", "Request", 3], ["rehire", "Request", 2], ["shared", "Request", 4], ["review", "Request", 3],
  ["loa", "Request", 3], ["copy", "Request", 2], ["auditQ", "Question", 2], ["compromise", "Incident", 1],
];
// Thursday's consequences, in the order they're checked, and the Monday slot each comes from.
const CON = [
  ["stale", "sweep", "Incident"], ["svc", "sweep", "Incident"], ["leaver", "leaver", "Incident"], ["recon", "recon", "Incident"],
  ["sodReq", "sodReq", "Incident"], ["copy", "copy", "Request"], ["priv", "priv", "Incident"], ["exec", "exec", "Incident"],
  ["contractor", "contractor", "Incident"], ["compromise", "compromise", "Incident"], ["callerPw", "callerPw", "Incident"],
  ["review", "review", "Request"], ["mover", "mover", "Request"],
];
// Skill and tutor category for each slot (as Pacific Crest's equivalent tickets).
const MON_HINT = {
  joiner: ["jml", "joiner"], callerPw: ["verify", "caller"], callerLock: ["verify", "caller"], callerMfa: ["verify", "caller"],
  leaver: ["jml", "leaver"], mover: ["jml", "mover"], sodReq: ["access", "sod"], request: ["access", "request"],
  exec: ["verify", "caller"], contractor: ["hygiene", "contractor"], sweep: ["hygiene", "sweep"], recon: ["incident", "leaver"],
  priv: ["access", "priv"], rehire: ["jml", "rehire"], shared: ["access", "shared"], review: ["access", "review"],
  loa: ["jml", "loa"], copy: ["access", "joiner"], auditQ: ["access", "audit"], compromise: ["incident", "compromise"],
  adminReq: ["access", "request"], loaReturn: ["jml", "loa"],
};
const CON_HINT = {
  stale: ["incident", "compromise"], svc: ["hygiene", "service"], leaver: ["jml", "leaver"], recon: ["incident", "leaver"],
  sodReq: ["access", "sod"], copy: ["access", "joiner"], priv: ["incident", "priv"], exec: ["incident", "compromise"],
  contractor: ["hygiene", "contractor"], compromise: ["incident", "compromise"], callerPw: ["incident", "compromise"],
  review: ["access", "review"], mover: ["jml", "mover"],
};
// Framework topics (see app/frameworks.ts).
const MON_TOPICS = {
  joiner: ["jml"], callerPw: ["verify"], callerLock: ["verify"], callerMfa: ["verify", "incident"], leaver: ["leaver"],
  mover: ["jml"], sodReq: ["sod", "request"], request: ["request"], exec: ["verify", "incident"], contractor: ["contractor"],
  sweep: ["inactive", "service"], recon: ["leaver", "incident"], priv: ["privileged"], rehire: ["jml"], shared: ["shared"],
  review: ["review"], loa: ["leave"], copy: ["jml"], auditQ: ["sod", "evidence"], compromise: ["incident"],
  adminReq: ["privileged", "request"], loaReturn: ["jml"],
};
const CON_TOPICS = {
  stale: ["inactive", "incident"], svc: ["service"], leaver: ["leaver", "incident"], recon: ["leaver", "incident"],
  sodReq: ["sod", "incident"], copy: ["jml"], priv: ["privileged", "incident"], exec: ["verify", "incident"],
  contractor: ["contractor"], compromise: ["incident"], callerPw: ["verify", "incident"], review: ["review"], mover: ["jml"],
};

const g = x => `<span class="mono">${x}</span>`;
const list = arr => arr.map(g).join(", ");
const SEC = "Security team", OWNER = "Account owner";
const setGroups = (uid, want) => { U(uid).groups.slice().forEach(x => { if (!want.includes(x)) act("rmgrp", uid, x); }); want.forEach(x => act("addgrp", uid, x)); };
const jobLabel = rk => rk.replace("|", " / ");
const titleOf = rk => rk.split("|")[1];
const first = name => name.split(" ")[0];
const plain = s => s.replace(/ \((owner|sponsor)\)$/, "");

/**
 * spec: { id, ROLES, SOD, buildUsers, mon: {slot: story}, thu: {adminReq, loaReturn}, conseq: {key: story},
 *         audit: { manager: {name, title} }, grc: { G, ctx, intro, levels } }
 * A story has the ticket's id, title, from, channel, opened, body (HTML) and lesson, plus the
 * slot's people and groups. Optional: pri, nudge (overrides the default nudge), approval.
 */
export function buildTicketSet(spec) {
  const { ROLES, SOD } = spec, P = spec.buildUsers(), M = spec.mon, Th = spec.thu, K = spec.conseq;
  const role = rk => ROLES[rk];
  const name = uid => P[uid].name;
  const rkOf = uid => `${P[uid].dept}|${P[uid].title}`;
  const caller = uid => ({ empId: P[uid].empId, mgr: P[uid].mgr });
  const base = (s, type, pri, users, close, extra = {}) => ({ id: s.id, type, pri: s.pri ?? pri, title: s.title, from: s.from, channel: s.channel,
    opened: s.opened, users, close, ...(s.approval ? { approval: s.approval } : {}), ...extra, body: s.body, lesson: s.lesson });
  const sodWhy = (a, b) => (SOD.find(([x, y]) => (x === a && y === b) || (x === b && y === a)) || [])[2] || "The combination is an SoD conflict.";
  const verifySteps = uid => [
    "Select <b>Start work</b> on the ticket.",
    `Open ${name(uid)}'s account and compare the caller's details with the directory: employee ID ${g(P[uid].empId)} and manager ${P[uid].mgr}. Both match.`,
    "Back on the ticket, select <b>Mark identity verified</b>. It has to be logged <i>before</i> any account change.",
  ];

  // ---------------- Monday ----------------
  const mk = {
    joiner: s => base(s, "Request", 2, [s.uid], "resolve", { grade: () => [C(U(s.uid).enabled, "Account enabled", 2), roleCheck(s.uid, s.rk, 4), C(!sodConflicts(s.uid).length, "No SoD conflict created", 2)] }),
    callerPw: s => base(s, "Incident", 3, [s.uid], "resolve", { caller: caller(s.uid),
      grade: () => [C(verifiedBefore(s.id, ["pwreset"], s.uid), "Identity verified before the reset", 3), C(U(s.uid).pwReset, "Password reset issued", 3), C(!U(s.uid).mfaReset, "MFA left alone (not part of the issue)", 1)] }),
    callerLock: s => base(s, "Incident", 3, [s.uid], "resolve", { caller: caller(s.uid),
      grade: () => [C(verifiedBefore(s.id, ["unlock", "pwreset"], s.uid), "Identity verified before changing the account", 2), C(!U(s.uid).locked, "Account unlocked", 3), C(!U(s.uid).pwReset, `Password not reset (${first(name(s.uid))} knows it)`, 2)] }),
    callerMfa: s => base(s, "Incident", 2, [s.uid], "resolve", { caller: caller(s.uid),
      grade: () => [C(verifiedBefore(s.id, ["mfareset"], s.uid), "Identity verified before the MFA reset", 3), C(U(s.uid).mfaReset, "MFA methods reset", 3), C(U(s.uid).revoked, "Sessions revoked (lost device may still be signed in)", 2)] }),
    leaver: s => base(s, "Request", 1, [s.uid], "resolve", {
      grade: () => [C(!U(s.uid).enabled, "Account disabled", 3), C(U(s.uid).revoked, "Sessions revoked", 2), C(U(s.uid).groups.length === 0, "All group memberships removed", 3, U(s.uid).groups.length ? "Still in: " + U(s.uid).groups.join(", ") : "")] }),
    mover: s => base(s, "Request", 3, [s.uid], "resolve", {
      grade: () => { const [d, t] = s.toRk.split("|"); return [C(U(s.uid).dept === d && U(s.uid).title === t, `Job info updated to ${d} / ${t}`, 2), roleCheck(s.uid, s.toRk, 4), C(U(s.uid).enabled, "Account still enabled", 1)]; } }),
    sodReq: s => base(s, "Request", 3, [s.uid], "reject", { grade: () => [C(!has(s.uid, s.group), "SoD-conflicting access not granted", 5)] }),
    request: s => base(s, "Request", 4, [s.uid], "resolve", {
      grade: () => [C(approvalBefore(s.id, e => e.a === "addgrp" && e.target === s.uid), "Manager approval obtained before granting", 3), C(has(s.uid, s.group), `${s.group} granted`, 3), C(U(s.uid).groups.length === role(rkOf(s.uid)).length + 1, "Nothing else added", 1)] }),
    exec: s => base(s, "Incident", 1, [s.uid], "reject", { caller: { empId: s.saidEmpId, mgr: P[s.uid].mgr },
      grade: ts => [C(firstIdx(e => e.ticket === s.id && e.a === "verify") < 0, "Identity not marked verified (employee ID doesn't match)", 2), C(!U(s.uid).mfaReset && !U(s.uid).pwReset, "No MFA or password change made", 4), C(esc(ts, SEC), "Escalated to the Security team", 3)] }),
    contractor: s => base(s, "Request", 2, [s.uid], "resolve", {
      grade: () => [C(approvalBefore(s.id, e => e.a === "expiry" && e.target === s.uid), "Sponsor approval obtained before extending", 3), C(U(s.uid).expiry !== null && U(s.uid).expiry > 2 && U(s.uid).expiry <= 90, "Expiry extended, within the 90-day cap", 3, "Current: " + (U(s.uid).expiry === null ? "no expiry" : U(s.uid).expiry + " days")), C(U(s.uid).enabled, "Account still enabled", 1)] }),
    sweep: s => base(s, "Task", 3, [], "resolve", {
      grade: ts => [...s.dormant.map(([u, d]) => C(!U(u).enabled, `${u} disabled (${d} days)`, 2)), C(U(s.under[0]).enabled, `${s.under[0]} left enabled (${s.under[1]} days, under threshold)`, 2), C(U(s.svc).enabled, `${s.svc} not disabled (service accounts go to the owner)`, 2), C(esc(ts, OWNER), "Stale service account escalated to its owner", 1)] }),
    recon: s => base(s, "Incident", 1, [s.uid], "resolve", {
      grade: ts => [C(!U(s.uid).enabled, "Account disabled", 3), C(U(s.uid).revoked, "Sessions revoked", 3), C(esc(ts, SEC), `Escalated to Security (signed in ${s.signedIn}, after termination)`, 3), C(U(s.uid).groups.length === 0, "Access removed", 1)] }),
    priv: s => base(s, "Request", 3, [s.uid], "reject", { grade: () => [C(!has(s.uid, s.group), `${s.group} not granted`, 5)] }),
    rehire: s => base(s, "Request", 2, [s.uid], "resolve", {
      grade: () => { const [d, t] = s.rk.split("|"); return [C(U(s.uid).enabled, "Account enabled", 2), C(U(s.uid).dept === d && U(s.uid).title === t, `Job info updated to ${d} / ${t}`, 1), roleCheck(s.uid, s.rk, 4), C(U(s.uid).pwReset, `New password issued (old one is ${s.pwAge} old)`, 2)]; } }),
    shared: s => base(s, "Request", 4, [s.uid], "reject", { grade: () => [C(true, "No shared account created", 4)] }),
    review: s => base(s, "Request", 3, [s.uid], "resolve", { grade: () => [C(!has(s.uid, s.group), `${s.group} removed`, 4), roleCheck(s.uid, rkOf(s.uid), 2)] }),
    loa: s => base(s, "Request", 3, [s.uid], "resolve", {
      grade: () => [C(!U(s.uid).enabled, "Account disabled for the leave", 3), C(U(s.uid).groups.length === role(rkOf(s.uid)).length, "Group memberships kept for the return", 3)] }),
    copy: s => base(s, "Request", 2, [s.uid, s.peer], "resolve", {
      grade: () => [C(U(s.uid).enabled, "Account enabled", 2), roleCheck(s.uid, s.rk, 4), C(!s.extras.some(x => has(s.uid, x)), `${first(name(s.peer))}'s leftover access not copied`, 2)] }),
    auditQ: s => base(s, "Question", 2, [], "resolve", { question: true,
      grade: ts => {
        const want = Object.values(S.users).filter(u => u.enabled && u.groups.includes(s.groups[0]) && u.groups.includes(s.groups[1])).map(u => u.id).sort();
        const a = (ts.answer || "").toLowerCase();
        const got = Object.values(S.users).filter(u => a.includes(u.id) || a.includes(u.name.toLowerCase())).map(u => u.id).sort();
        const ok = want.length ? want.join() === got.join() : (a.trim() === "none" && !got.length);
        return [C(ok, "Answer matches the directory", 5, ok ? "" : "Correct answer: " + (want.join(", ") || "none"))];
      } }),
    compromise: s => base(s, "Incident", 1, [s.uid], "resolve", {
      grade: ts => [C(U(s.uid).revoked, "Sessions revoked", 3), C(U(s.uid).pwReset, "Password reset", 2), C(U(s.uid).mfaReset, "MFA reset and re-registration required", 2), C(esc(ts, SEC), "Escalated to the Security team", 3)] }),
  };
  const T = MON.map(([slot]) => mk[slot](M[slot]));

  // ---------------- Thursday: standing tickets ----------------
  const BASE_THU = [
    base(Th.adminReq, "Request", 3, [Th.adminReq.uid], "reject", { grade: () => [C(!has(Th.adminReq.uid, Th.adminReq.group), "Non-requestable admin access not granted", 4)] }),
    base(Th.loaReturn, "Request", 3, [M.loa.uid], "resolve", { grade: () => [C(U(M.loa.uid).enabled, "Account enabled", 2), roleCheck(M.loa.uid, rkOf(M.loa.uid), 4)] }),
  ];

  // ---------------- Thursday: consequences ----------------
  const fromOnly = role(M.mover.fromRk).filter(x => !role(M.mover.toRk).includes(x));
  const svcOwner = plain(P[M.sweep.svc].mgr);
  const cause = {
    stale: `Inactive accounts over 90 days were left enabled (${M.sweep.id}).`,
    svc: `The ${M.sweep.svc} service account was disabled instead of being sent to its owner (${M.sweep.id}).`,
    leaver: `${name(M.leaver.uid)} wasn't fully offboarded (${M.leaver.id}): account still enabled or sessions still live.`,
    recon: `${name(M.recon.uid)}, who left on ${M.recon.left}, was still enabled after the reconciliation ticket (${M.recon.id}).`,
    sodReq: `${name(M.sodReq.uid)} was granted ${M.sodReq.group} on top of ${M.sodReq.holds}, creating an SoD conflict (${M.sodReq.id}).`,
    copy: `${name(M.copy.uid)}'s access was copied from ${name(M.copy.peer)}, including ${first(name(M.copy.peer))}'s leftover access (${M.copy.id}).`,
    priv: `${name(M.priv.uid)} was given standing ${M.priv.group} (${M.priv.id}).`,
    exec: `The fake caller got an MFA or password change on ${name(M.exec.uid)}'s account (${M.exec.id}).`,
    contractor: `${name(M.contractor.uid)}'s contractor account wasn't extended (${M.contractor.id}).`,
    compromise: `${name(M.compromise.uid)}'s compromised account wasn't fully contained and escalated (${M.compromise.id}).`,
    callerPw: `${name(M.callerPw.uid)}'s password was reset without recorded identity verification (${M.callerPw.id}).`,
    review: `The access review revocation for ${name(M.review.uid)} wasn't carried out (${M.review.id}).`,
    mover: `${name(M.mover.uid)} kept the old ${titleOf(M.mover.fromRk)} access after the move (${M.mover.id}).`,
  };
  const when = {
    stale: () => M.sweep.dormant.map(([u]) => u).find(u => U(u).enabled),
    svc: () => !U(M.sweep.svc).enabled && M.sweep.svc,
    leaver: () => (U(M.leaver.uid).enabled || !U(M.leaver.uid).revoked) && M.leaver.uid,
    recon: () => U(M.recon.uid).enabled && M.recon.uid,
    sodReq: () => has(M.sodReq.uid, M.sodReq.group) && M.sodReq.uid,
    copy: () => M.copy.extras.some(x => has(M.copy.uid, x)) && M.copy.uid,
    priv: () => has(M.priv.uid, M.priv.group) && M.priv.uid,
    exec: () => (U(M.exec.uid).mfaReset || U(M.exec.uid).pwReset) && M.exec.uid,
    contractor: () => (U(M.contractor.uid).expiry === null || U(M.contractor.uid).expiry <= 2) && M.contractor.uid,
    compromise: () => { const u = U(M.compromise.uid); return !(u.revoked && u.pwReset && u.mfaReset && monEsc(M.compromise.id, SEC)) && M.compromise.uid; },
    callerPw: () => U(M.callerPw.uid).pwReset && !verifiedBefore(M.callerPw.id, ["pwreset"], M.callerPw.uid) && M.callerPw.uid,
    review: () => has(M.review.uid, M.review.group) && M.review.uid,
    mover: () => fromOnly.some(x => has(M.mover.uid, x)) && M.mover.uid,
  };
  const apply = {
    stale: tg => { Object.assign(U(tg), { last: 0, revoked: false, mfaReset: false, mfa: true }); },
    leaver: () => { U(M.leaver.uid).revoked = false; },
    recon: () => { Object.assign(U(M.recon.uid), { last: 0, revoked: false }); },
    priv: () => { U(M.priv.uid).revoked = false; },
    exec: () => { Object.assign(U(M.exec.uid), { revoked: false, mfaReset: false, pwReset: false, mfa: true }); },
    contractor: () => { Object.assign(U(M.contractor.uid), { enabled: false, expiry: null }); },
    compromise: () => { Object.assign(U(M.compromise.uid), { revoked: false, pwReset: false, mfaReset: false, mfa: true }); },
    callerPw: () => { Object.assign(U(M.callerPw.uid), { revoked: false, pwReset: false }); },
  };
  const contain = (uid, pts = [3, 2, 2, 3]) => ts => [C(!U(uid).enabled, "Account disabled", pts[0]), C(U(uid).revoked, "Sessions revoked", pts[1]), C(U(uid).groups.length === 0, "All access removed", pts[2]), C(esc(ts, SEC), "Escalated to the Security team", pts[3])];
  const grade = {
    stale: tg => ts => [C(!U(tg).enabled, "Account disabled", 3), C(U(tg).revoked, "Sessions revoked", 2), C(U(tg).mfaReset, "Attacker's MFA method removed (MFA reset)", 2), C(esc(ts, SEC), "Escalated to the Security team", 3)],
    svc: () => ts => [C(U(M.sweep.svc).enabled, `${M.sweep.svc} re-enabled so ${K.svc.restores} can run`, 3), C(esc(ts, OWNER), `Escalated to the account owner (${svcOwner})`, 2)],
    leaver: () => contain(M.leaver.uid),
    recon: () => contain(M.recon.uid, [3, 2, 1, 3]),
    sodReq: () => ts => [C(!has(M.sodReq.uid, M.sodReq.group), `${M.sodReq.group} removed`, 4), C(has(M.sodReq.uid, M.sodReq.holds), `${first(name(M.sodReq.uid))}'s normal ${M.sodReq.holds} access kept`, 1), C(esc(ts, SEC), "Escalated to Security as possible fraud", 3)],
    copy: () => () => [roleCheck(M.copy.uid, M.copy.rk, 4), C(!M.copy.extras.some(x => has(M.copy.peer, x)), `${name(M.copy.peer)}'s leftover access removed`, 2)],
    priv: () => ts => [C(!has(M.priv.uid, M.priv.group), `${M.priv.group} removed`, 4), C(U(M.priv.uid).revoked, `${first(name(M.priv.uid))}'s sessions revoked`, 2), C(esc(ts, SEC), "Escalated to the Security team", 3)],
    exec: () => ts => [C(U(M.exec.uid).revoked, "Sessions revoked", 3), C(U(M.exec.uid).mfaReset, "Attacker's MFA method removed", 2), C(U(M.exec.uid).pwReset, "Password reset", 2), C(esc(ts, SEC), "Escalated to the Security team", 3)],
    contractor: () => () => [C(U(M.contractor.uid).enabled, "Account re-enabled", 2), C(approvalBefore(K.contractor.id, e => e.a === "expiry" && e.target === M.contractor.uid), "Sponsor approval on this ticket before extending", 2), C(U(M.contractor.uid).expiry !== null && U(M.contractor.uid).expiry > 0 && U(M.contractor.uid).expiry <= 90, "Expiry set within the 90-day cap", 3)],
    compromise: () => ts => [C(U(M.compromise.uid).revoked, "Sessions revoked", 3), C(U(M.compromise.uid).pwReset, "Password reset", 2), C(U(M.compromise.uid).mfaReset, "MFA reset", 2), C(esc(ts, SEC), "Escalated to the Security team", 3)],
    callerPw: () => ts => [C(U(M.callerPw.uid).revoked, "Sessions revoked", 3), C(U(M.callerPw.uid).pwReset, "Password reset again", 2), C(esc(ts, SEC), "Escalated to the Security team", 3)],
    review: () => () => [C(!has(M.review.uid, M.review.group), `${M.review.group} removed`, 4)],
    mover: () => () => [roleCheck(M.mover.uid, M.mover.toRk, 4)],
  };
  const users = {
    stale: tg => [tg], svc: () => [M.sweep.svc], leaver: () => [M.leaver.uid], recon: () => [M.recon.uid], sodReq: () => [M.sodReq.uid],
    copy: () => [M.copy.uid, M.copy.peer], priv: () => [M.priv.uid, ...(K.priv.alsoUsers || [])], exec: () => [M.exec.uid],
    contractor: () => [M.contractor.uid], compromise: () => [M.compromise.uid], callerPw: () => [M.callerPw.uid],
    review: () => [M.review.uid], mover: () => [M.mover.uid],
  };
  const CONSEQ = CON.map(([key, , type]) => {
    const k = K[key];
    return { key, when: when[key], cause: cause[key], prevented: k.prevented, apply: apply[key] || (() => {}),
      make: tg => ({ id: k.id, type, pri: k.pri ?? (key === "copy" || key === "review" || key === "mover" || key === "contractor" ? 2 : 1),
        title: typeof k.title === "function" ? k.title(U(tg).name) : k.title, from: k.from, channel: k.channel, opened: k.opened,
        users: users[key](tg), close: "resolve", ...(k.approval ? { approval: k.approval } : {}),
        body: typeof k.body === "function" ? k.body(U(tg).name) : k.body, lesson: k.lesson, grade: grade[key](tg) }) };
  });

  // ---------------- Hints ----------------
  const H = (slot, skillKind, clause, steps, nudge) => ({ skill: skillKind[0], kind: skillKind[1], nudge, clause, steps });
  const mustRole = rk => list(role(rk));
  const ws = (s, def) => s.nudge ?? def;
  const HINTS = {};
  const addMon = (slot, clause, steps, nudge) => { const s = M[slot] ?? Th[slot]; HINTS[s.id] = H(slot, MON_HINT[slot], clause, steps, ws(s, nudge)); };
  const resolve = "Resolve the ticket.";
  // Monday
  { const s = M.joiner; addMon("joiner", { keys: ["joiners", "sod"], matrix: [s.rk] },
      ["Start work on the ticket.", `Open ${name(s.uid)} in the Directory and select <b>Enable</b>.`, `Add exactly these groups: ${mustRole(s.rk)}. Nothing else.`, "Resolve the ticket with a short note."],
      `The account already exists. Two things need to change on it: whether it can sign in, and what it can reach. Where do you find exactly what a ${titleOf(s.rk)} gets?`); }
  { const s = M.callerPw; addMon("callerPw", { keys: ["verify"] },
      [...verifySteps(s.uid), `In the Directory, select <b>Reset password</b> on ${s.uid}. Leave MFA alone.`, resolve],
      `Anyone can phone the desk and say they're ${first(name(s.uid))}. What do you check before you touch the password, and what isn't part of this request?`); }
  { const s = M.callerLock; addMon("callerLock", { keys: ["verify"] },
      [...verifySteps(s.uid), `In the Directory, select <b>Unlock</b> on ${s.uid}. Don't reset the password.`, resolve],
      "The caller says they know their password. Is this a forgotten password or something else? Pick the smallest change that fixes it, after you know who's calling."); }
  { const s = M.callerMfa; addMon("callerMfa", { keys: ["verify", "compromised"], note: "Only the session and MFA parts of the compromised-account rule apply here. The password wasn't exposed." },
      [...verifySteps(s.uid), `In the Directory, select <b>Reset MFA</b> on ${s.uid}.`, "Select <b>Revoke sessions</b> so the lost phone is signed out.", resolve],
      "The lost phone is still out there with an authenticator on it. Besides re-registering MFA, what might that phone still be signed in to?"); }
  { const s = M.leaver; addMon("leaver", { keys: ["leavers"] },
      () => ["Start work on the ticket.", `Open ${name(s.uid)} and select <b>Disable</b>.`, "Select <b>Revoke sessions</b>.", `Remove every group membership: ${list(U(s.uid).groups.length ? U(s.uid).groups : P[s.uid].groups)}.`, resolve],
      "Offboarding has more than one part. Blocking new sign-ins is only the first. What about sessions already open, and the access itself?"); }
  { const s = M.mover, [d, t] = s.toRk.split("|"), toOnly = role(s.toRk).filter(x => !role(s.fromRk).includes(x)), keep = role(s.toRk).filter(x => role(s.fromRk).includes(x));
    addMon("mover", { keys: ["movers"], matrix: [s.fromRk, s.toRk] },
      ["Start work on the ticket.", `Open ${name(s.uid)}. Under Job info choose ${g(`${d} / ${t}`)} and select <b>Update job info</b>.`, `Remove ${list(fromOnly)}.`, `Add ${list(toOnly)}.${keep.length ? ` Keep ${list(keep)}.` : ""}`, resolve],
      `Adding the new role's access is the easy half. What should ${first(name(s.uid))} lose on leaving the ${titleOf(s.fromRk)} role?`); }
  { const s = M.sodReq; addMon("sodReq", { keys: ["sod", "requestable"], sod: true },
      [`Start work on the ticket. Don't add any groups to ${first(name(s.uid))}.`, `${first(name(s.uid))} already holds ${g(s.holds)}. Adding ${g(s.group)}: ${sodWhy(s.holds, s.group).replace(/^./, c => c.toLowerCase())} Approval can't override that.`, `<b>Reject</b> the ticket. In the note, ${s.alt}`],
      "The manager approved it. Before you grant it, look at what the requester already has and check it against every rule, not just the approval rule."); }
  { const s = M.request; addMon("request", { keys: ["requestable"] },
      ["Start work on the ticket.", `Select <b>Request manager approval</b> and read ${s.approver}'s reply. The approval has to be logged before the change.`, `Open ${name(s.uid)} and add ${g(s.group)} only.`, resolve],
      "This group is on the requestable list, so it can be granted outside the role. What has to be on the ticket before you grant it?"); }
  { const s = M.exec; addMon("exec", { keys: ["verify", "compromised"], note: "Nothing is compromised yet. What applies here is the verification rule and its instruction to escalate suspected social engineering." },
      [`Start work. Open ${name(s.uid)}: the employee ID is ${g(P[s.uid].empId)}, but the caller gave ${g(s.saidEmpId)}. Verification fails.`, "Don't mark identity verified. Don't reset MFA or the password.", "Escalate to the <b>Security team</b> as suspected social engineering.", "<b>Reject</b> the ticket and note the mismatched employee ID."],
      "Urgency, authority and a new device all at once. Slow down and compare every detail the caller gave with the directory record."); }
  { const s = M.contractor; addMon("contractor", { keys: ["contractors"] },
      ["Start work on the ticket.", `Select <b>Request manager approval</b>. ${plain(P[s.uid].mgr)} replies as sponsor.`, `Open ${name(s.uid)} and set Account expiry to ${g("90")} days (the cap).`, "Keep the account enabled. Resolve the ticket."],
      "Contractor extensions have two conditions: who has to agree, and how long an extension can run."); }
  { const s = M.sweep; addMon("sweep", { keys: ["inactive"] },
      ["Start work on the ticket.", `Disable ${s.dormant.map(([u, d]) => `${g(u)} (${d} days)`).join(", ")}.`, `Leave ${g(s.under[0])} alone: ${s.under[1]} days is under the threshold.`, `Don't disable ${g(s.svc)}. It's a service account. Escalate the ticket to the <b>Account owner</b> instead.`, resolve],
      "Sort the Directory by last sign-in. Where exactly is the line, and are all the accounts near it people?"); }
  { const s = M.recon; addMon("recon", { keys: ["leavers", "compromised"], note: "Post-termination sign-ins make this a security incident, so Security needs to know." },
      () => ["Start work on the ticket.", `Open ${name(s.uid)}: left ${s.left}, last sign-in ${s.signedIn}. Select <b>Disable</b>, then <b>Revoke sessions</b>.`, `Remove all groups: ${list(U(s.uid).groups.length ? U(s.uid).groups : P[s.uid].groups)}.`, "Escalate to the <b>Security team</b> (signed in after leaving).", resolve],
      `Check the HR feed for ${first(name(s.uid))}'s last day, then the last sign-in. Is this just cleanup, or did something happen after they left?`); }
  { const s = M.priv; addMon("priv", { keys: ["priv"] },
      [`Start work on the ticket. Don't add ${g(s.group)} to anyone.`, `<b>Reject</b> the ticket. In the note, ${s.route}`],
      `${first(name(s.uid))} says it's been cleared informally. Does the route matter as much as the approval for this kind of role?`); }
  { const s = M.rehire, have = P[s.uid].groups, want = role(s.rk), [d, t] = s.rk.split("|");
    const rm = have.filter(x => !want.includes(x)), add = want.filter(x => !have.includes(x)), keep = want.filter(x => have.includes(x));
    addMon("rehire", { keys: ["rehires"], matrix: [s.rk] },
      ["Start work on the ticket.", `Open ${name(s.uid)} and select <b>Enable</b>, then <b>Reset password</b>.`, `Under Job info choose ${g(`${d} / ${t}`)} and select <b>Update job info</b>.`,
        [rm.length ? `Remove ${list(rm)}.` : "", add.length ? `Add ${list(add)}.` : "", keep.length ? `Keep ${list(keep)}.` : ""].filter(Boolean).join(" "), resolve],
      `${first(name(s.uid))}'s old account has come back with old access and a ${s.pwAge}-old password. What does a rehire need beyond switching the account on?`); }
  { const s = M.shared; addMon("shared", { keys: ["shared"] },
      ["Start work on the ticket. Don't create or change any account.", `<b>Reject</b> the ticket. In the note, ${s.alt}`],
      "The problem behind the request is real. If a whole team uses one login, who did each action?"); }
  { const s = M.review; addMon("review", { keys: [], matrix: [rkOf(s.uid)], note: "Access reviews: the reviewer's Revoke decision is the approval. Remove exactly the entitlement marked, and leave everything that was certified." },
      ["Start work on the ticket.", `Open ${name(s.uid)} and remove ${g(s.group)}.`, "Leave the other groups as they are. Resolve the ticket."],
      "The reviewer already decided. Your job is to carry out exactly what they marked, no more and no less."); }
  { const s = M.loa; addMon("loa", { keys: ["loa"] },
      ["Start work on the ticket.", `Open ${name(s.uid)} and select <b>Disable</b>.`, "Don't remove any groups. Resolve the ticket."],
      `${first(name(s.uid))} is coming back. How do you stop the account being used meanwhile without making the return painful?`); }
  { const s = M.copy; addMon("copy", { keys: ["joiners"], matrix: [s.rk] },
      ["Start work on the ticket.", `Open ${name(s.uid)} and select <b>Enable</b>.`, `Add exactly the ${titleOf(s.rk)} groups: ${mustRole(s.rk)}.`, `Don't copy ${first(name(s.peer))}'s ${list(s.extras)}.`, `Resolve the ticket. In the note, flag ${first(name(s.peer))}'s extra access for review.`],
      `Before copying anyone, compare ${name(s.peer)}'s groups with the ${titleOf(s.rk)} row in the matrix. Is everything there part of the role?`); }
  { const s = M.auditQ; addMon("auditQ", { keys: ["sod"], sod: true, note: "Audit requests: answer from the current directory, completely. Fixing any conflicts is a separate, approved change." },
      () => { const want = Object.values(S.users).filter(u => u.enabled && u.groups.includes(s.groups[0]) && u.groups.includes(s.groups[1])).map(u => u.id).sort();
        return ["Start work on the ticket.", `In the Directory, check each enabled account for both ${g(s.groups[0])} and ${g(s.groups[1])}.`,
          `As of now, the directory shows: ${want.length ? list(want) : "<b>none</b>"}. If you change anyone's access before closing, check again.`,
          `Type ${want.length ? want.map(g).join(", ") : g("none")} in the answer box and <b>Resolve</b>.`]; },
      "Audit evidence comes from the system, not from memory. Two groups and a status: enabled, and holding both."); }
  { const s = M.compromise; addMon("compromise", { keys: ["compromised"] },
      ["Start work on the ticket.", `Open ${name(s.uid)}. Select <b>Revoke sessions</b>, <b>Reset password</b> and <b>Reset MFA</b>.`, "Escalate to the <b>Security team</b>.", resolve],
      "The attacker already has a session. List everything they could still hold: a session, a password, an MFA method. Then think about who else needs to know."); }
  // Thursday standing tickets
  { const s = Th.adminReq; addMon("adminReq", { keys: ["requestable"], matrix: [rkOf(s.uid)] },
      [`Start work on the ticket. Don't add ${g(s.group)}: it isn't requestable, and it isn't part of the ${P[s.uid].title} role.`, `<b>Reject</b> the ticket. ${s.alt}`],
      "The manager approved it. Check whether this group is one that can be requested at all."); }
  { const s = Th.loaReturn, uid = M.loa.uid, rk = rkOf(uid); addMon("loaReturn", { keys: ["loa"], matrix: [rk] },
      () => { const have = U(uid).groups, want = role(rk), miss = want.filter(x => !have.includes(x)), extra = have.filter(x => !want.includes(x));
        return ["Start work on the ticket.", `Open ${name(uid)} and select <b>Enable</b>.`, miss.length ? `Add the missing ${titleOf(rk)} groups: ${list(miss)}.` : `The ${titleOf(rk)} groups are all still there. Nothing to add.`, ...(extra.length ? [`Remove ${list(extra)}.`] : []), resolve]; },
      "How the leave was handled on Monday decides how much work this is. Compare what the account has now with the role."); }
  // Thursday consequences
  const addCon = (key, clause, steps, nudge) => { const k = K[key]; HINTS[k.id] = H(key, CON_HINT[key], clause, steps, k.nudge ?? nudge); };
  addCon("stale", { keys: ["compromised", "inactive"] },
    () => { const tg = TK[K.stale.id] ? TK[K.stale.id].users[0] : null, n = tg ? U(tg).name : "the account";
      return ["Start work on the ticket.", `Open ${n}. Select <b>Disable</b>, <b>Revoke sessions</b> and <b>Reset MFA</b> (removes the attacker's method).`, "Escalate to the <b>Security team</b>.", "Resolve the ticket. Then re-run the inactive-account sweep for any others you missed."]; },
    "An attacker is in and has added their own MFA method. What do you need to take away from them, and who takes it from there?");
  addCon("svc", { keys: ["inactive"] },
    ["Start work on the ticket.", `Open ${g(M.sweep.svc)} and select <b>Enable</b>.`, `Escalate to the <b>Account owner</b> (${svcOwner}).`, resolve],
    "Production is down because of an account change. What restores service fastest, and whose decision is the account's future?");
  addCon("leaver", { keys: ["leavers", "compromised"], note: "Access after termination makes this a security incident as well as an offboarding gap." },
    () => ["Start work on the ticket.", `Open ${name(M.leaver.uid)}. Select <b>Disable</b> (if still enabled) and <b>Revoke sessions</b>.`, `Remove any remaining groups${U(M.leaver.uid).groups.length ? ": " + list(U(M.leaver.uid).groups) : ""}.`, "Escalate to the <b>Security team</b>.", resolve],
    "This offboarding was left half done on Monday. Finish every part of it, and remember the activity after the termination.");
  addCon("recon", { keys: ["leavers", "compromised"] },
    () => ["Start work on the ticket.", `Open ${name(M.recon.uid)}. Select <b>Disable</b> and <b>Revoke sessions</b>.`, `Remove all groups${U(M.recon.uid).groups.length ? ": " + list(U(M.recon.uid).groups) : ""}.`, "Escalate to the <b>Security team</b>.", resolve],
    "Now it's a data-loss incident. Contain the account completely, then think about who needs to be involved.");
  addCon("sodReq", { keys: ["sod"], sod: true, matrix: [rkOf(M.sodReq.uid)] },
    ["Start work on the ticket.", `Open ${name(M.sodReq.uid)} and remove ${g(M.sodReq.group)}. Keep ${g(M.sodReq.holds)}.`, "Escalate to the <b>Security team</b> as possible fraud.", resolve],
    "Take away exactly the access that created the conflict, and keep what the job needs. This could be fraud, so who needs to know?");
  addCon("copy", { keys: ["joiners"], matrix: [M.copy.rk] },
    () => { const want = role(M.copy.rk), e = U(M.copy.uid).groups, ex = e.filter(x => !want.includes(x)), miss = want.filter(x => !e.includes(x));
      return ["Start work on the ticket.", `Open ${name(M.copy.uid)}.${ex.length ? " Remove " + list(ex) + "." : ""}${miss.length ? " Add " + list(miss) + "." : ""} The groups should match the ${titleOf(M.copy.rk)} role exactly.`,
        `Open ${name(M.copy.peer)} and remove ${list(M.copy.extras.filter(x => has(M.copy.peer, x))) || "the leftover access"}.`, resolve]; },
    "Two people need fixing: the new hire, and the person they were copied from.");
  addCon("priv", { keys: ["priv", "compromised"] },
    ["Start work on the ticket.", `Open ${name(M.priv.uid)} and remove ${g(M.priv.group)}.`, `Select <b>Revoke sessions</b> on ${first(name(M.priv.uid))}'s account.`, "Escalate to the <b>Security team</b>.", resolve],
    "Standing admin rights just turned one phished account into a breach. Remove the rights, contain the account, then hand it on.");
  addCon("exec", { keys: ["compromised"] },
    ["Start work on the ticket.", `Open ${name(M.exec.uid)}. Select <b>Revoke sessions</b>, <b>Reset MFA</b> and <b>Reset password</b>.`, "Escalate to the <b>Security team</b>.", resolve],
    "The attacker controls the MFA method. Work through everything they could still hold, then bring in the right people fast.");
  addCon("contractor", { keys: ["contractors"] },
    ["Start work on the ticket.", "Select <b>Request manager approval</b> on this ticket first.", `Open ${name(M.contractor.uid)}, select <b>Enable</b>, and set Account expiry to ${g("90")} days.`, resolve],
    "Same rules as Monday's request, with the account already expired. What has to be logged on <i>this</i> ticket before you change the expiry?");
  addCon("compromise", { keys: ["compromised"] },
    ["Start work on the ticket.", `Open ${name(M.compromise.uid)}. Select <b>Revoke sessions</b>, <b>Reset password</b> and <b>Reset MFA</b>.`, "Escalate to the <b>Security team</b>.", resolve],
    "Monday's containment was incomplete, and the attacker came back. This time, do every step.");
  addCon("callerPw", { keys: ["compromised", "verify"] },
    ["Start work on the ticket.", `Open ${name(M.callerPw.uid)}. Select <b>Revoke sessions</b> and <b>Reset password</b>.`, "Escalate to the <b>Security team</b>.", resolve],
    `Someone is in ${first(name(M.callerPw.uid))}'s account with a password the desk gave them. Kick them out, change what they know, and report it.`);
  addCon("review", { keys: [], note: "Access reviews: the reviewer's Revoke decision is the approval. Remove exactly the entitlement marked." },
    ["Start work on the ticket.", `Open ${name(M.review.uid)} and remove ${g(M.review.group)}.`, resolve],
    "This is the revocation that didn't happen on Monday.");
  addCon("mover", { keys: ["movers"], matrix: [M.mover.toRk] },
    () => { const want = role(M.mover.toRk), have = U(M.mover.uid).groups, ex = have.filter(x => !want.includes(x)), miss = want.filter(x => !have.includes(x));
      return ["Start work on the ticket.", `Open ${name(M.mover.uid)}.${ex.length ? " Remove " + list(ex) + "." : ""}${miss.length ? " Add " + list(miss) + "." : ""} The groups should match the ${titleOf(M.mover.toRk)} role exactly.`, resolve]; },
    "The new access is there. What's still there from the old role?");

  const CONSEQ_LINKS = Object.fromEntries(CON.map(([key, slot]) => [key, { mon: M[slot].id, thu: K[key].id }]));

  // ---------------- Playbook: doing exactly what the exact-steps hints say ----------------
  const playbook = {
    [M.joiner.id]: () => { act("enable", M.joiner.uid); setGroups(M.joiner.uid, role(M.joiner.rk)); return "resolve"; },
    [M.callerPw.id]: id => { tact("verify", id); act("pwreset", M.callerPw.uid); return "resolve"; },
    [M.callerLock.id]: id => { tact("verify", id); act("unlock", M.callerLock.uid); return "resolve"; },
    [M.callerMfa.id]: id => { tact("verify", id); act("mfareset", M.callerMfa.uid); act("revoke", M.callerMfa.uid); return "resolve"; },
    [M.leaver.id]: () => { act("disable", M.leaver.uid); act("revoke", M.leaver.uid); setGroups(M.leaver.uid, []); return "resolve"; },
    [M.mover.id]: () => { act("job", M.mover.uid, M.mover.toRk); setGroups(M.mover.uid, role(M.mover.toRk)); return "resolve"; },
    [M.sodReq.id]: () => "reject",
    [M.request.id]: id => { tact("approval", id); act("addgrp", M.request.uid, M.request.group); return "resolve"; },
    [M.exec.id]: id => { tact("escalate", id, SEC); return "reject"; },
    [M.contractor.id]: id => { tact("approval", id); act("expiry", M.contractor.uid, "90"); return "resolve"; },
    [M.sweep.id]: id => { M.sweep.dormant.forEach(([u]) => act("disable", u)); tact("escalate", id, OWNER); return "resolve"; },
    [M.recon.id]: id => { act("disable", M.recon.uid); act("revoke", M.recon.uid); setGroups(M.recon.uid, []); tact("escalate", id, SEC); return "resolve"; },
    [M.priv.id]: () => "reject",
    [M.rehire.id]: () => { act("enable", M.rehire.uid); act("pwreset", M.rehire.uid); act("job", M.rehire.uid, M.rehire.rk); setGroups(M.rehire.uid, role(M.rehire.rk)); return "resolve"; },
    [M.shared.id]: () => "reject",
    [M.review.id]: () => { act("rmgrp", M.review.uid, M.review.group); return "resolve"; },
    [M.loa.id]: () => { act("disable", M.loa.uid); return "resolve"; },
    [M.copy.id]: () => { act("enable", M.copy.uid); setGroups(M.copy.uid, role(M.copy.rk)); return "resolve"; },
    [M.auditQ.id]: () => { const [a, b] = M.auditQ.groups; return ["resolve", Object.values(S.users).filter(u => u.enabled && u.groups.includes(a) && u.groups.includes(b)).map(u => u.id).join(", ") || "none"]; },
    [M.compromise.id]: id => { ["revoke", "pwreset", "mfareset"].forEach(a => act(a, M.compromise.uid)); tact("escalate", id, SEC); return "resolve"; },
    [Th.adminReq.id]: () => "reject",
    [Th.loaReturn.id]: () => { act("enable", M.loa.uid); setGroups(M.loa.uid, role(rkOf(M.loa.uid))); return "resolve"; },
    [K.stale.id]: id => { const tg = TK[id].users[0]; ["disable", "revoke", "mfareset"].forEach(a => act(a, tg)); tact("escalate", id, SEC); return "resolve"; },
    [K.svc.id]: id => { act("enable", M.sweep.svc); tact("escalate", id, OWNER); return "resolve"; },
    [K.leaver.id]: id => { act("disable", M.leaver.uid); act("revoke", M.leaver.uid); setGroups(M.leaver.uid, []); tact("escalate", id, SEC); return "resolve"; },
    [K.recon.id]: id => { act("disable", M.recon.uid); act("revoke", M.recon.uid); setGroups(M.recon.uid, []); tact("escalate", id, SEC); return "resolve"; },
    [K.sodReq.id]: id => { act("rmgrp", M.sodReq.uid, M.sodReq.group); tact("escalate", id, SEC); return "resolve"; },
    [K.copy.id]: () => { setGroups(M.copy.uid, role(M.copy.rk)); M.copy.extras.forEach(x => act("rmgrp", M.copy.peer, x)); return "resolve"; },
    [K.priv.id]: id => { act("rmgrp", M.priv.uid, M.priv.group); act("revoke", M.priv.uid); tact("escalate", id, SEC); return "resolve"; },
    [K.exec.id]: id => { ["revoke", "mfareset", "pwreset"].forEach(a => act(a, M.exec.uid)); tact("escalate", id, SEC); return "resolve"; },
    [K.contractor.id]: id => { tact("approval", id); act("enable", M.contractor.uid); act("expiry", M.contractor.uid, "90"); return "resolve"; },
    [K.compromise.id]: id => { ["revoke", "pwreset", "mfareset"].forEach(a => act(a, M.compromise.uid)); tact("escalate", id, SEC); return "resolve"; },
    [K.callerPw.id]: id => { act("revoke", M.callerPw.uid); act("pwreset", M.callerPw.uid); tact("escalate", id, SEC); return "resolve"; },
    [K.review.id]: () => { act("rmgrp", M.review.uid, M.review.group); return "resolve"; },
    [K.mover.id]: () => { setGroups(M.mover.uid, role(M.mover.toRk)); return "resolve"; },
  };

  // ---------------- Jordan Reyes' week ----------------
  const notes = {
    [M.joiner.id]: `Enabled and provisioned from the ${titleOf(M.joiner.rk)} role.`,
    [M.callerPw.id]: "Caller verified. Temp password issued.",
    [M.callerLock.id]: "Verified emp ID and manager. Unlocked only.",
    [M.callerMfa.id]: "MFA reset for new phone, sessions revoked. Caller verified.",
    [M.leaver.id]: "Offboarded per leaver policy.",
    [M.mover.id]: `Job info and ${titleOf(M.mover.toRk)} access done.`,
    [M.sodReq.id]: `Rejected: ${M.sodReq.group} conflicts with ${M.sodReq.holds} (SoD).`,
    [M.request.id]: `Manager approved. Granted ${M.request.group} only.`,
    [M.exec.id]: "Employee ID didn't match. No changes, sent to Security.",
    [M.contractor.id]: "Sponsor approved, extended 90 days.",
    [M.sweep.id]: `Disabled ${M.sweep.dormant.length} accounts over 90 days. ${M.sweep.svc} sent to its owner.`,
    [M.recon.id]: "Disabled, revoked, access removed. Security notified of the sign-in.",
    [M.priv.id]: `Rejected: ${M.priv.group} isn't granted by ticket.`,
    [M.rehire.id]: `Rehire: enabled, new password, ${titleOf(M.rehire.rk)} role.`,
    [M.shared.id]: "Rejected: shared accounts aren't allowed.",
    [M.review.id]: "Removed per the access review.",
    [M.loa.id]: "Disabled for leave, groups kept.",
    [M.copy.id]: `Provisioned from the ${titleOf(M.copy.rk)} role, not from ${first(name(M.copy.peer))}'s access.`,
    [M.auditQ.id]: "List pulled from the directory.",
    [M.compromise.id]: "Contained and escalated.",
    [Th.adminReq.id]: Th.adminReq.jordanNote ?? "Manager approved.",
    [Th.loaReturn.id]: "Welcome back. Enabled, groups confirmed.",
    [K.leaver.id]: "Disabled now. Security has the activity.",
    [K.callerPw.id]: "Contained. Security engaged.",
    [K.mover.id]: `Removed leftover ${titleOf(M.mover.fromRk)} access.`,
  };
  const jordan = {
    notes,
    plays: {
      // Reset the password first, marked the caller verified afterwards.
      [M.callerPw.id]: id => { act("pwreset", M.callerPw.uid); tact("verify", id); return "resolve"; },
      // Cleared MFA before verifying the caller.
      [M.callerMfa.id]: id => { act("mfareset", M.callerMfa.uid); tact("verify", id); act("revoke", M.callerMfa.uid); return "resolve"; },
      // Revoked sessions and removed access, but never disabled the account.
      [M.leaver.id]: () => { act("revoke", M.leaver.uid); setGroups(M.leaver.uid, []); return "resolve"; },
      // Added the new role but left the old role's access in place.
      [M.mover.id]: () => { act("job", M.mover.uid, M.mover.toRk); role(M.mover.toRk).forEach(x => act("addgrp", M.mover.uid, x)); return "resolve"; },
      // Thursday: granted access that isn't requestable because the manager approved.
      [Th.adminReq.id]: id => { tact("approval", id); act("addgrp", Th.adminReq.uid, Th.adminReq.group); return "resolve"; },
    },
    // Mid-morning, the person behind the shared-login request asks at the desk for a password
    // reset. Jordan does it without a ticket.
    unticketed: { after: M.request.id, act: ["pwreset", M.shared.uid] },
    MISTAKES: {
      [M.callerPw.id]: "Password reset before the caller was verified",
      [M.callerMfa.id]: "MFA cleared before the caller was verified",
      [M.leaver.id]: "Leaver's account left enabled",
      [M.mover.id]: "Mover kept the old role's access",
      [Th.adminReq.id]: "Non-requestable admin access granted on approval",
      unticketed: `Password reset for ${name(M.shared.uid)} with no ticket`,
    },
  };

  // ---------------- The week audit ----------------
  const audit = {
    manager: spec.audit.manager,
    callers: [M.callerPw.id, M.callerLock.id, M.callerMfa.id, M.exec.id],
    jml: [[M.joiner.id, M.joiner.uid, M.joiner.rk], [M.mover.id, M.mover.uid, M.mover.toRk], [M.rehire.id, M.rehire.uid, M.rehire.rk],
      [M.copy.id, M.copy.uid, M.copy.rk], [Th.loaReturn.id, M.loa.uid, rkOf(M.loa.uid)]],
    leavers: [[M.leaver.id, M.leaver.uid], [M.recon.id, M.recon.uid]],
    requests: [[M.sodReq.id, M.sodReq.uid, M.sodReq.group], [M.request.id, M.request.uid, M.request.group],
      [M.priv.id, M.priv.uid, M.priv.group], [M.shared.id, M.shared.uid, null], [Th.adminReq.id, Th.adminReq.uid, Th.adminReq.group]],
    sampling: {
      "APD-03": [[M.callerPw.id, true], [M.leaver.id, false], [M.callerLock.id, true], [M.compromise.id, false], [M.callerMfa.id, true], [M.joiner.id, false], [M.exec.id, true]],
      "APD-02": [[M.leaver.id, true], [M.loa.id, false], [M.mover.id, false], [M.recon.id, true]],
    },
    effects: {
      "APD-03": [["callerPw", K.callerPw.effect], ["exec", K.exec.effect]],
      "APD-02": [["leaver", K.leaver.effect], ["recon", K.recon.effect]],
      "ACC-01": [["sodReq", K.sodReq.effect], ["priv", K.priv.effect]],
      "APD-01": [["mover", K.mover.effect], ["copy", K.copy.effect]],
    },
  };

  const topics = {
    ...Object.fromEntries([...MON.map(([slot]) => [M[slot].id, MON_TOPICS[slot]]), [Th.adminReq.id, MON_TOPICS.adminReq], [Th.loaReturn.id, MON_TOPICS.loaReturn]]),
    ...Object.fromEntries(CON.map(([key]) => [K[key].id, CON_TOPICS[key]])),
  };

  return { id: spec.id, T, CONSEQ, BASE_THU, HINTS, CONSEQ_LINKS, G: spec.grc.G, playbook, jordan, audit, topics,
    grc: { ctx: spec.grc.ctx, intro: spec.grc.intro, levels: spec.grc.levels },
    // The story the set was built from, for tests.
    story: { mon: M, thu: Th, conseq: K } };
}
