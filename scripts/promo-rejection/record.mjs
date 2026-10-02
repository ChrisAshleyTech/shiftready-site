// Records the simulator for the rejection-email promo (9:16) with a CDP screencast at 1.5x, so the edit
// can zoom in and stay sharp. Run with `npx vite preview --port 4173` up:
//   CHROME_PATH=/opt/pw-browsers/chromium node scripts/promo-rejection/record.mjs   -> out/rec/*.jpg + frames.txt
// Monday is seeded with the real engine (19 tickets done, the fake-CFO ticket left open to work on camera).
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
const E = new URL("../../src/engine/", import.meta.url).href;
const store = await import(E + "store.js");
const st = await import(E + "state.js");
const { T, TK } = await import(E + "tickets.js");
const { ROLES } = await import(E + "company.js");
const U = id => store.S.users[id];
const setGroups = (uid, want) => { U(uid).groups.slice().forEach(g => { if (!want.includes(g)) st.act("rmgrp", uid, g); }); want.forEach(g => st.act("addgrp", uid, g)); };
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

const D = new URL("./out/rec/", import.meta.url).pathname;
rmSync(D, { recursive: true, force: true }); mkdirSync(D, { recursive: true });
const W = 1080, H = 1350;
const args = ["--force-device-scale-factor=1.5"]; // without it the screencast comes back at 1x
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args } : { channel: "chrome", args });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1.5 });
await ctx.addCookies([{ name: "rolevara-member", value: String(Date.now() - 2 * 864e5), url: "http://localhost:4173" }]);
await ctx.addInitScript(s => {
  if (!sessionStorage.getItem("seeded")) {
    localStorage.clear(); localStorage.setItem("pcl-iam-sim-v1", s); localStorage.setItem("rolevara-path", "iam-grc");
    localStorage.setItem("rolevara-account", JSON.stringify({ name: "Alex Rivera", email: "alex@example.com", role: "IAM analyst", at: new Date().toISOString() }));
    localStorage.setItem("rolevara-report-name", "Alex Rivera");
    sessionStorage.setItem("seeded", "1");
  }
  addEventListener("DOMContentLoaded", () => {
    const c = document.createElement("div");
    c.style.cssText = "position:fixed;z-index:2147483647;left:-50px;top:0;width:34px;height:34px;margin:-5px 0 0 -5px;pointer-events:none;transition:transform .12s";
    c.innerHTML = '<svg viewBox="0 0 24 24" width="34" height="34"><path d="M4 2l16 10-7 1.6L9.6 21z" fill="#0f172a" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.body.appendChild(c);
    addEventListener("mousemove", e => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }, true);
    addEventListener("mousedown", () => { c.style.transform = "scale(.8)"; }, true);
    addEventListener("mouseup", () => { c.style.transform = ""; }, true);
  });
}, STATE);
const page = await ctx.newPage();
const pause = ms => page.waitForTimeout(ms);
await page.goto("http://localhost:4173/app/#/queue"); await pause(1500);

// Screencast: every frame with its timestamp; marks name the beats so the edit can cut on them.
const cdp = await ctx.newCDPSession(page);
const frames = [], marks = {}; let t0 = null, n = 0;
cdp.on("Page.screencastFrame", async f => {
  const t = f.metadata.timestamp; if (t0 == null) t0 = t;
  const name = `f${String(++n).padStart(5, "0")}.jpg`;
  writeFileSync(D + name, Buffer.from(f.data, "base64")); frames.push([name, t - t0]);
  await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
});
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 85, everyNthFrame: 1, maxWidth: W * 1.5, maxHeight: H * 1.5 });
const mark = k => { marks[k] = t0 == null ? 0 : Date.now() / 1000 - t0; };
async function click(loc, wait = 700) {
  const el = loc.first(); await el.scrollIntoViewIfNeeded(); const b = await el.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 22 }); await pause(200);
  await el.click(); await pause(wait);
}
await page.mouse.move(700, 600); await pause(900);
mark("queue");
await click(page.getByRole("link", { name: /CFO locked out/ }), 1100);
mark("ticket");
await click(page.getByRole("button", { name: "Start work" }), 700);
await page.getByText("Caller-provided identity details").scrollIntoViewIfNeeded(); await pause(400);
mark("details");
await page.mouse.move(600, 700, { steps: 15 }); await pause(1600);
await click(page.getByRole("button", { name: "Escalate" }), 600);
mark("note");
await click(page.locator("#note-INC0041220"), 200);
await page.keyboard.type("Employee ID doesn't match the directory. Possible social engineering. Escalated.", { delay: 12 });
await pause(300);
mark("reject");
await click(page.getByRole("button", { name: "Reject" }), 700);
await page.locator("#grade-h").scrollIntoViewIfNeeded(); await pause(300);
mark("grade");
await page.mouse.move(1060, 1330, { steps: 10 }); await pause(2400);
await click(page.getByRole("link", { name: "Readiness report" }), 300);
await page.mouse.move(1060, 1330, { steps: 8 });
mark("report");
await pause(1800);
for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 110); await pause(180); }
await pause(1600);
const href = await page.locator("#rp-open").getAttribute("href");
await page.goto(href); await page.waitForLoadState("networkidle"); await pause(300);
mark("share");
await pause(2000);
for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 120); await pause(160); }
await pause(2000);
mark("end");
await cdp.send("Page.stopScreencast");
await ctx.close(); await browser.close();
writeFileSync(D + "frames.json", JSON.stringify({ frames, marks }));
console.log(frames.length, "frames", JSON.stringify(marks));
