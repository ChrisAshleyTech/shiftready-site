// Free account: a learner signs up (name and email) before the simulator opens. There is no server
// login yet, so the sign-up is remembered in this browser: a first-party cookie marks it done (it
// survives "Reset progress", which clears local storage) and the details stay in local storage.
// TODO(accounts): real sign-in with server-side accounts, needed before paid tiers.
import { FORM_ENDPOINT } from "@/marketing/config";

export type Account = { name: string; email: string; role: string; at: string };

const COOKIE = "rolevara-member";
const STORE = "rolevara-account";

export function signedUp(): boolean {
  try { return document.cookie.split("; ").some(c => c === `${COOKIE}=1`); } catch { return false; }
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
  document.cookie = `${COOKIE}=1; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
  try { localStorage.setItem(STORE, JSON.stringify({ ...a, at: new Date().toISOString() })); } catch { /* storage blocked */ }
}

export function signOut() {
  document.cookie = `${COOKIE}=; Max-Age=0; Path=/`;
  try { localStorage.removeItem(STORE); } catch { /* storage blocked */ }
  location.reload();
}
