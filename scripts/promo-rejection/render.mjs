// Renders comp.html frame by frame (30 fps, 2160x3840 by default) into out/frames/. Run from the repo root after record.mjs.
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { chromium } from "playwright";
const D = new URL("./", import.meta.url).pathname, FPS = 30, DUR = Number(process.env.DUR ?? 28.6);
const only = process.env.AT ? process.env.AT.split(",").map(Number) : null;
const OUT = D + (only ? "out/stills/" : "out/frames/");
rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true });
const b = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args: ["--allow-file-access-from-files"] } : { channel: "chrome" });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: Number(process.env.DPR ?? 2) }); // 2 -> 2160x3840
await p.goto("file://" + D + "comp.html");
await p.evaluate(f => { REC = f; return document.fonts.ready; }, JSON.parse(readFileSync(D + "out/rec/frames.json", "utf8")));
await p.evaluate(() => Promise.all([...document.images].filter(i => i.src).map(i => i.decode())));
const times = only ?? Array.from({ length: Math.round(DUR * FPS) }, (_, i) => i / FPS);
for (const [i, t] of times.entries()) {
  await p.evaluate(t => render(t), t);
  await p.screenshot({ path: OUT + (only ? `t${t}.png` : `f${String(i).padStart(5, "0")}.jpg`), ...(only ? {} : { type: "jpeg", quality: 95 }) });
  if (i % 100 === 0) console.log(i, t.toFixed(2));
}
await b.close();
