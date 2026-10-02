// Tester access to the lab guides: a signed token in a private link (/labs/access?key=...) that
// Christopher emails to testers. The link sets an HttpOnly cookie; the lab scripts are served only
// to requests that carry a valid one. The signing secret lives in the LAB_ACCESS_SECRET environment
// variable (Vercel project settings), never in this repository.
//
// TODO(labs-auth): replace tester links with Supabase Auth plus a paid-tier check (Pro + Labs).
//   1. Sign-in with Supabase Auth. A Stripe webhook (checkout completed, subscription updated or
//      deleted, payment failed) writes each user's plan and status to a `subscriptions` table.
//   2. lab-session and lab-file look the plan up on every request: only an active or trialing
//      Pro + Labs subscription gets files, so cancelling or a failed payment cuts access at once.
//   3. Move lab-files/ (scripts and guide.json) into Supabase Storage (private bucket), handed out
//      as signed URLs that expire in minutes, so nothing lives in this public repository.
//   4. Remove LAB_ACCESS_SECRET, LAB_REVOKED, this file's token code and scripts/make-lab-link.mjs.
import { createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE = "rv_lab_access";
const MAX_AGE = 30 * 24 * 3600; // a cookie lasts at most 30 days, even for a longer-lived link

/** The signing secret, or null when it is missing or too short (all access is then refused). */
export function labSecret(env = process.env) {
  const s = env.LAB_ACCESS_SECRET;
  return typeof s === "string" && s.length >= 32 ? s : null;
}

const mac = (body, key) => createHmac("sha256", key).update(body).digest();

/** Signs {v, sub, exp}: sub names the tester, exp is a Unix time in seconds. */
export function signToken({ sub, exp }, key) {
  const body = Buffer.from(JSON.stringify({ v: 1, sub, exp })).toString("base64url");
  return `${body}.${mac(body, key).toString("base64url")}`;
}

/** The token's payload when it is well formed, correctly signed and unexpired; otherwise null. */
export function verifyToken(token, key, now = Date.now()) {
  if (!key || typeof token !== "string" || token.length > 1024) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const want = mac(body, key), got = Buffer.from(sig, "base64url");
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  let p;
  try { p = JSON.parse(Buffer.from(body, "base64url").toString("utf8")); } catch { return null; }
  if (p?.v !== 1 || typeof p.sub !== "string" || typeof p.exp !== "number" || p.exp * 1000 <= now) return null;
  return p;
}

export function readCookie(header, name = COOKIE) {
  for (const part of (header || "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

/** Testers whose links are withdrawn early: LAB_REVOKED is a comma-separated list of the names used with --to. */
export const revoked = (sub, env = process.env) => (env.LAB_REVOKED || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean).includes(sub.toLowerCase());

/** The tester's access from the request's cookie, or null. Checked on every request, so expiry and revocation apply at once. */
export function accessFrom(request, env = process.env) {
  const p = verifyToken(readCookie(request.headers.get("cookie")), labSecret(env));
  return p && !revoked(p.sub, env) ? p : null;
}

export const cookieFor = (token, exp, now = Date.now()) =>
  `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.max(0, Math.min(MAX_AGE, Math.floor(exp - now / 1000)))}`;
