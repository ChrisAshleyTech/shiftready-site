// Records the landing-page product demo from the real app with Playwright.
//   1. npm run build && npx vite preview --port 4173   (in another terminal)
//   2. node scripts/record-demo.mjs                      -> scripts/.demo/raw.webm
//   3. sh scripts/encode-demo.sh                         -> public/video/demo.{mp4,webm} + posters
// The Monday state is seeded with the real engine: 19 tickets closed (one realistic miss: a stale
// account left enabled), the fake-CFO ticket left open so it can be worked on camera.
import { mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { chromium } from "playwright";

globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
const E = new URL("../src/engine/", import.meta.url).href;
const store = await import(E + "store.js");
const st = await import(E + "state.js");
const { T, TK } = await import(E + "tickets.js");
const { ROLES } = await import(E + "company.js");
const U = id => store.S.users[id];
const setGroups = (uid, want) => { U(uid).groups.slice().forEach(g => { if (!want.includes(g)) st.act("rmgrp", uid, g); }); want.forEach(g => st.act("addgrp", uid, g)); };

// Monday, worked correctly except the inactive-account sweep (greg.foster left enabled).
const PLAY = {
  REQ0018841: () => { st.act("enable", "maria.lopez"); setGroups("maria.lopez", ROLES["Finance|AP Clerk"]); },
  INC0041207: id => { st.tact("verify", id); st.act("pwreset", "james.carter"); },
  INC0041209: id => { st.tact("verify", id); st.act("unlock", "aisha.brown"); },
  INC0041212: id => { st.tact("verify", id); st.act("mfareset", "kevin.nguyen"); st.act("revoke", "kevin.nguyen"); },
  REQ0018850: () => { st.act("disable", "robert.hayes"); st.act("revoke", "robert.hayes"); setGroups("robert.hayes", []); },
  REQ0018852: () => { st.act("job", "tanya.wright", "Operations|Dispatcher"); setGroups("tanya.wright", ROLES["Operations|Dispatcher"]); },
  REQ0018855: () => "reject",
  REQ0018858: id => { st.tact("approval", id); st.act("addgrp", "omar.hassan", "APP-Salesforce-Reports"); },
  REQ0018861: id => { st.tact("approval", id); st.act("expiry", "dev.patel", "90"); },
  TSK0007712: id => { ["nina.shah", "paul.kim"].forEach(u => st.act("disable", u)); st.tact("escalate", id, "Account owner"); },
  INC0041231: id => { st.act("disable", "brian.walsh"); st.act("revoke", "brian.walsh"); setGroups("brian.walsh", []); st.tact("escalate", id, "Security team"); },
  REQ0018866: () => "reject",
  REQ0018870: () => { st.act("enable", "sofia.ramirez"); st.act("pwreset", "sofia.ramirez"); st.act("job", "sofia.ramirez", "HR|HR Generalist"); setGroups("sofia.ramirez", ROLES["HR|HR Generalist"]); },
  REQ0018873: () => "reject",
  REQ0018876: () => { st.act("rmgrp", "jordan.lee", "APP-Finance-Reports"); },
  REQ0018879: () => { st.act("disable", "rachel.adams"); },
  REQ0018881: () => { st.act("enable", "ethan.moore"); setGroups("ethan.moore", ROLES["Operations|Dispatcher"]); },
  REQ0018884: () => ["resolve", "derek.chan"],
  INC0041240: id => { ["revoke", "pwreset", "mfareset"].forEach(a => st.act(a, "sam.okafor")); st.tact("escalate", id, "Security team"); },
};
store.setState(st.fresh());
for (const t of T) {
  if (t.id === "INC0041220") continue;
  st.tact("start", t.id);
  let r = PLAY[t.id](t.id) || "resolve"; if (!Array.isArray(r)) r = [r];
  st.closeTicket(t.id, r[0], { note: "", answer: TK[t.id].question ? r[1] : undefined });
}
store.S.active = null;
const STATE = JSON.stringify(store.S);

const out = new URL("./.demo/", import.meta.url);
rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
const W = 1280, H = 800;
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: out.pathname.replace(/^\/([A-Z]:)/, "$1"), size: { width: W, height: H } } });
await ctx.addInitScript(s => {
  if (!sessionStorage.getItem("seeded")) { localStorage.clear(); localStorage.setItem("pcl-iam-sim-v1", s); sessionStorage.setItem("seeded", "1"); }
  // Visible cursor for the recording (Playwright videos don't capture the system pointer).
  addEventListener("DOMContentLoaded", () => {
    const c = document.createElement("div");
    c.style.cssText = "position:fixed;z-index:2147483647;left:0;top:0;width:22px;height:22px;margin:-4px 0 0 -4px;pointer-events:none;transition:transform .12s";
    c.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 2l16 10-7 1.6L9.6 21z" fill="#0f172a" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.body.appendChild(c);
    addEventListener("mousemove", e => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }, true);
    addEventListener("mousedown", () => { c.style.transform = "scale(.8)"; }, true);
    addEventListener("mouseup", () => { c.style.transform = ""; }, true);
  });
}, STATE);
const page = await ctx.newPage();
const pause = ms => page.waitForTimeout(ms);
async function click(loc, wait = 700) {
  const el = loc.first(); await el.scrollIntoViewIfNeeded(); const b = await el.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 28 }); await pause(250);
  await el.click(); await pause(wait);
}

await page.goto("http://localhost:4173/app/#/queue"); await pause(1800);
await click(page.getByRole("link", { name: /CFO locked out/ }), 1400);
await click(page.getByRole("button", { name: "Start work" }), 900);
await click(page.getByRole("tab", { name: /Hints/ }));
await click(page.getByRole("button", { name: /Show nudge/ }));
await click(page.locator("#hint-yes"), 2600);
await click(page.getByRole("tab", { name: "Details" }), 1000);
await page.getByText("Caller-provided identity details").scrollIntoViewIfNeeded(); await pause(1800);
await click(page.getByRole("button", { name: "Escalate" }), 900);
await click(page.locator("#note-INC0041220"), 300);
await page.keyboard.type("Caller's employee ID (10020) doesn't match the directory (10002). Escalated as suspected social engineering.", { delay: 14 });
await pause(500);
await click(page.getByRole("button", { name: "Reject" }), 700);
await page.locator("#grade-h").scrollIntoViewIfNeeded(); await pause(3200);
await page.evaluate(() => scrollTo({ top: 0, behavior: "smooth" })); await pause(900);
await click(page.getByRole("button", { name: "Start Thursday" }), 2200);
await click(page.getByRole("link", { name: /Dormant account signed in/ }), 1200);
await page.getByText("Caused by your Monday shift").scrollIntoViewIfNeeded();
await page.mouse.move(1180, 760, { steps: 20 }); await pause(3600); // park the cursor off the content

await ctx.close(); await browser.close();
const f = readdirSync(out).find(n => n.endsWith(".webm"));
renameSync(new URL(f, out), new URL("raw.webm", out));
console.log("recorded scripts/.demo/raw.webm");
