// Renders each line of narration.txt as on-screen text (out/title-1.png ...): transparent 1280x720, lower
// third, Figtree, soft shadow. Used by the music-only cut. Uses the installed Chrome, or CHROME_PATH.
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const figtree = readFileSync("node_modules/@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2").toString("base64");
const lines = readFileSync("scripts/intro-video/narration.txt", "utf8").split("\n").map(l => l.trim()).filter(Boolean);
const b = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
for (const [i, line] of lines.entries()) {
  await p.setContent(`<style>@font-face{font-family:F;src:url(data:font/woff2;base64,${figtree}) format("woff2");font-weight:100 900}
  *{margin:0}body{width:1280px;height:720px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:84px;box-sizing:border-box;background:transparent}
  p{max-width:1000px;text-align:center;font:650 44px/1.2 F;letter-spacing:-.01em;color:#fff;text-shadow:0 2px 24px rgba(0,0,0,.65),0 1px 3px rgba(0,0,0,.6)}</style><p>${line}</p>`);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: `scripts/intro-video/out/title-${i + 1}.png`, omitBackground: true });
}
await b.close();
console.log(`${lines.length} titles written`);
