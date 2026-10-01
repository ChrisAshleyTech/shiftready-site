// Requester replies. When a ticket is closed but the fix didn't take, the person who notices
// writes back and the ticket reopens (see followups.js). Each builder returns a function that
// gives the reply, or null once the problem is fixed. Replies describe what the person sees,
// not which group or setting is wrong: working that out is still the analyst's job.
import { U, has } from "./store.js";

const first = uid => U(uid).name.split(" ")[0];
const plain = s => String(s || "").replace(/ \((owner|sponsor)\)$/, "");
const and = xs => xs.length < 2 ? xs.join("") : xs.slice(0, -1).join(", ") + " and " + xs[xs.length - 1];

// A starter (joiner, rehire, return from leave): their manager notices.
export const starter = (uid, want, from) => () => {
  const u = U(uid), by = plain(from || u.mgr);
  if (!u.enabled) return { from: by, text: `${first(uid)} still can't sign in. The sign-in page says the account is disabled.` };
  if (want.some(g => !u.groups.includes(g))) return { from: by, text: `${first(uid)} can sign in now, but can't get into some of the systems the job needs. Can you check the access against the role?` };
  return null;
};
// Callers: the person who rang the desk.
export const pwReset = (uid, from) => () => U(uid).pwReset ? null : { from, text: "I still can't sign in. Did the password reset go through?" };
export const unlock = (uid, from) => () => U(uid).locked ? { from, text: "It still says my account is locked." } : null;
export const mfa = (uid, from) => () => U(uid).mfaReset ? null : { from, text: "The authenticator on my new phone still won't register. It says a method is already set up." };
// An access request: the requester still doesn't have it.
export const granted = (uid, group, from) => () => has(uid, group) ? null : { from, text: `I still don't have ${group}. Was it added?` };
// An auditor's question: the answer has to match the directory.
export const answer = (correct, from) => ts => correct(ts) ? null : { from, text: "Your list doesn't match what we pulled from the directory. Please check it again and resend." };
// A contractor extension: the sponsor sees the account still lapsing.
export const extended = (uid, from) => () => {
  const u = U(uid);
  if (!u.enabled) return { from, text: `${first(uid)} still can't sign in. The account is still disabled.` };
  if (u.expiry === null || u.expiry <= 2 || u.expiry > 90) return { from, text: `${first(uid)}'s account still doesn't show the extension. Can you check the end date?` };
  return null;
};
// Access that should be gone: whoever spotted it checks again.
export const removed = (uid, groups, from, what) => () =>
  groups.some(g => has(uid, g)) ? { from, text: `We checked again: ${U(uid).name} still has ${what}.` } : null;
// A compromised or leaver account: Security checks containment.
// need: any of "disabled", "revoked", "pwReset", "mfaReset", "noGroups", plus [uid, group] pairs to be removed.
export const contained = (uid, need, from = "Security team") => () => {
  const u = U(uid), left = [];
  if (need.includes("disabled") && u.enabled) left.push("the account is still enabled");
  if (need.includes("revoked") && !u.revoked) left.push("it still has active sessions");
  if (need.includes("pwReset") && !u.pwReset) left.push("the password hasn't been changed");
  if (need.includes("mfaReset") && !u.mfaReset) left.push("the attacker's MFA method is still registered");
  if (need.includes("noGroups") && u.groups.length) left.push("it still has group memberships");
  need.filter(Array.isArray).forEach(([id, g]) => { if (has(id, g)) left.push(`${id} still has ${g}`); });
  if (!left.length) return null;
  const s = and(left);
  return { from, text: `We checked ${uid} again and it isn't contained: ${s}. Reopening until it is.` };
};
// A service account that was switched off: the monitoring alert fires again.
export const restored = (uid, from, what) => () => U(uid).enabled ? null : { from, text: `${what} failed again: logon failure, account disabled (${uid}).` };
