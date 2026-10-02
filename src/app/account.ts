// Free account: a learner signs up (name and email) before the simulator opens. There is no server
// login yet, so the sign-up is remembered in this browser: a first-party cookie holds the sign-up
// time (it survives "Reset progress", which clears local storage) and the details stay in local storage.
// TODO(accounts): real sign-in with server-side accounts, needed before paid tiers.
import { FORM_ENDPOINT } from "@/marketing/config";
import { PRICES } from "@/marketing/plans";

export type Account = { name: string; email: string; role: string; at: string };

const COOKIE = "rolevara-member";
const STORE = "rolevara-account";

function cookie(): string | null {
  try { return document.cookie.split("; ").find(c => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1) || null; } catch { return null; }
}

export const signedUp = () => cookie() != null;

/** When this browser signed up (ms), or null if unknown. */
export function signedUpAt(): number | null {
  const t = Number(cookie());
  return t > 1e12 ? t : null;
}

const DAY = 864e5;
/** The trial starts at sign-up. Show plan options from this day on. */
export const TRIAL_DAYS = PRICES.pro.trialDays;
export const TRIAL_NOTICE_DAY = 10;

/** Whole days left in the free trial (0 when it has ended), or null if the sign-up date is unknown. */
export function trialDaysLeft(now = Date.now()): number | null {
  const at = signedUpAt();
  if (at == null) return null;
  return Math.max(0, TRIAL_DAYS - Math.floor((now - at) / DAY));
}

export function account(): Account | null {
  try { return JSON.parse(localStorage.getItem(STORE) ?? "null"); } catch { return null; }
}

/** Sends the sign-up to the form endpoint (when set) and remembers it in this browser. */
export async function signUp(a: Omit<Account, "at">): Promise<void> {
  if (FORM_ENDPOINT) {
    const r = await fetch(FORM_ENDPOINT, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ ...a, source: "simulator sign-up", _gotcha: "" }) });
    if (!r.ok) throw new Error("sign-up failed");
  }
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE}=${Date.now()}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
  try { localStorage.setItem(STORE, JSON.stringify({ ...a, at: new Date().toISOString() })); } catch { /* storage blocked */ }
}

export function signOut() {
  document.cookie = `${COOKIE}=; Max-Age=0; Path=/`;
  try { localStorage.removeItem(STORE); } catch { /* storage blocked */ }
  location.reload();
}
