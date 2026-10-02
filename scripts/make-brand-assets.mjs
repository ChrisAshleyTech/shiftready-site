// Builds Rolevara brand assets from Christopher's logo artwork in brand-source/ (the door R mark,
// the Rolevara and RolevaraSim lockups, and the navy-square mark), using Playwright for the canvas work:
//   public/brand/rolevara-logo{,-dark}.png       website logo (door R + Rolevara), tagline removed
//   public/brand/rolevarasim-logo{,-dark}.png    simulator logo (door R + RolevaraSim), tagline removed
//   public/brand/rolevara-logo-tagline.png       full website logo with the tagline, for downloads
//   public/brand/rolevara-mark{,-dark}.png       door R mark alone
//   public/favicon-32.png (-> favicon.ico with ffmpeg), public/apple-touch-icon.png,
//   public/icon-192.png, public/icon-512.png, public/icon-maskable-512.png,
//   public/og/rolevara-og.png (1200x630 social preview, navy-square mark),
//   public/badges/rolevara-level-{beginner,intermediate,pro}.png (1200x627 LinkedIn images).
// The artwork has a white background: it is keyed to transparency, cropped to the ink, and for the
// dark theme the navy is turned white (teal stays). "-dark" files are for dark backgrounds.
// Run after the demo poster is current: node scripts/make-brand-assets.mjs (uses the installed Chrome,
// or the browser at CHROME_PATH). The capsule mirrors LevelBadge.tsx.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const NAVY = "#0B2B5F", TEAL = "#00ADA8", RIM = "#2A4A80", LIGHT_TEAL = "#2DD4CF";
const TAGLINE = "Experience the role. Master the work.";
const src = f => "data:image/png;base64," + readFileSync(new URL(`../brand-source/${f}`, import.meta.url)).toString("base64");
const font = p => readFileSync(new URL(`../node_modules/${p}`, import.meta.url)).toString("base64");
const figtree = font("@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2");
const sans = font("@fontsource-variable/inter/files/inter-latin-wght-normal.woff2");
const poster = readFileSync(new URL("../public/video/demo-poster.jpg", import.meta.url)).toString("base64");
const FONTS = `@font-face{font-family:F;src:url(data:font/woff2;base64,${figtree}) format("woff2");font-weight:100 900}
@font-face{font-family:S;src:url(data:font/woff2;base64,${sans}) format("woff2");font-weight:200 900}`;

const b = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" });
const page = await b.newPage();

// Keys the white background out of a piece of artwork and returns a cropped PNG data URL.
// erase: [x, y] in source pixels; everything right of x and below y is cleared (removes the tagline
// line beside the mark). dark: navy becomes white. pad: transparent margin as a share of the size.
const cut = (file, { erase, dark = false, pad = 0, height } = {}) => page.evaluate(async ({ url, erase, dark, pad, height }) => {
  const img = new Image(); img.src = url; await img.decode();
  const c = new OffscreenCanvas(img.width, img.height), x = c.getContext("2d");
  x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height), p = d.data;
  let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
  for (let i = 0; i < p.length; i += 4) {
    const px = (i / 4) % c.width, py = Math.floor(i / 4 / c.width);
    // The ink is navy or teal on white, so the darkest channel says how much ink is in a pixel.
    const m = Math.min(p[i], p[i + 1], p[i + 2]);
    let a = m > 238 ? 0 : Math.min(1, (255 - m) / 245) * (p[i + 3] / 255);
    if (erase && px >= erase[0] && py >= erase[1]) a = 0;
    if (a > 0) {
      const un = v => Math.max(0, Math.min(255, Math.round((v - 255 * (1 - a)) / a)));
      let r = un(p[i]), g = un(p[i + 1]), bl = un(p[i + 2]);
      if (dark && bl - g > 25) r = g = bl = 255; // navy, not teal
      p[i] = r; p[i + 1] = g; p[i + 2] = bl;
      if (a > 0.08) { x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py); }
    }
    p[i + 3] = Math.round(a * 255);
  }
  x.putImageData(d, 0, 0);
  const w = x1 - x0 + 1, h = y1 - y0 + 1, m = Math.round(Math.max(w, h) * pad);
  const k = height ? height / (h + 2 * m) : 1, o = new OffscreenCanvas(Math.round((w + 2 * m) * k), Math.round((h + 2 * m) * k));
  const ox = o.getContext("2d"); ox.imageSmoothingQuality = "high";
  ox.drawImage(c, x0, y0, w, h, m * k, m * k, w * k, h * k);
  const blob = await o.convertToBlob({ type: "image/png" });
  return await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); });
}, { url: src(file), erase, dark, pad, height });

const save = (dataUrl, path) => writeFileSync(path, Buffer.from(dataUrl.split(",")[1], "base64"));
const shot = async (html, w, h, path, { transparent = false, bg = NAVY } = {}) => {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.setContent(`<style>${FONTS}*{margin:0;box-sizing:border-box}body{width:${w}px;height:${h}px;overflow:hidden;background:${transparent ? "transparent" : bg}}img{display:block}</style>${html}`);
  await p.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode())); });
  await p.screenshot({ path, omitBackground: transparent }); await p.close();
};
for (const d of ["public/og", "public/brand", "public/badges"]) mkdirSync(d, { recursive: true });

// ---------- Logos ----------
// Where the tagline starts in each lockup (source pixels): right of the mark, below the wordmark.
// Web logos are saved 144px tall: sharp at up to 48px on a 3x screen.
const site = { file: "rolevara-logo-tagline.png", erase: [620, 476], height: 144 };
const sim = { file: "rolevarasim-logo-tagline.png", erase: [590, 448], height: 144 };
save(await cut(site.file, site), "public/brand/rolevara-logo.png");
save(await cut(site.file, { ...site, dark: true }), "public/brand/rolevara-logo-dark.png");
save(await cut(site.file), "public/brand/rolevara-logo-tagline.png"); // full size, for downloads
save(await cut(sim.file, sim), "public/brand/rolevarasim-logo.png");
save(await cut(sim.file, { ...sim, dark: true }), "public/brand/rolevarasim-logo-dark.png");
const mark = await cut("rolevara-mark.png");
save(await cut("rolevara-mark.png", { height: 144 }), "public/brand/rolevara-mark.png");
save(await cut("rolevara-mark.png", { height: 144, dark: true }), "public/brand/rolevara-mark-dark.png");

// ---------- Icons ----------
const sq = (url, size, pad = 0.04) => `<div style="width:${size}px;height:${size}px;display:grid;place-items:center;padding:${Math.round(size * pad)}px"><img src="${url}" style="max-width:100%;max-height:100%"></div>`;
const fav = await cut("rolevara-mark.png", { pad: 0.02 });
await shot(sq(fav, 64, 0), 64, 64, "public/favicon-64.png", { transparent: true });
// public/favicon.svg is the vector mark from make-vector-logos.mjs.
await shot(sq(fav, 32, 0), 32, 32, "public/favicon-32.png", { transparent: true });
await shot(sq(mark, 192), 192, 192, "public/icon-192.png", { transparent: true });
await shot(sq(mark, 512), 512, 512, "public/icon-512.png", { transparent: true });
// The OS rounds these, so they fill the square: the white-background and navy-square artwork as supplied.
await shot(`<img src="${src("rolevara-mark.png")}" style="width:180px;height:180px">`, 180, 180, "public/apple-touch-icon.png");
// The maskable icon keeps the R inside the central safe zone.
await shot(`<img src="${src("rolevara-mark-navy.png")}" style="width:410px;height:410px;margin:51px">`, 512, 512, "public/icon-maskable-512.png");

// ---------- Social preview: the navy-square mark, the name and the tagline beside the app ----------
await shot(`<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 8% 0%,rgba(0,173,168,.25) 0,transparent 55%),radial-gradient(ellipse at 100% 100%,rgba(45,212,207,.16) 0,transparent 50%)"></div>
<div style="position:absolute;left:72px;top:64px;width:600px;color:#fff">
  <div style="display:flex;align-items:center;gap:18px"><img src="${src("rolevara-mark-navy.png")}" style="width:76px;height:76px;border-radius:14px;box-shadow:0 0 0 1px ${RIM}"><span style="font:800 50px/1 F;letter-spacing:-.02em">Rolevara</span></div>
  <div style="margin-top:56px;font:800 60px/1.05 F;letter-spacing:-.025em">${TAGLINE}</div>
  <div style="margin-top:26px;font:500 25px/1.4 S;color:#C3D2EA">Identity and access skills, built on real operations work and graded on outcome and process.</div>
</div>
<div style="position:absolute;right:-110px;top:96px;width:600px;border-radius:18px;overflow:hidden;box-shadow:0 30px 70px -20px rgba(0,173,168,.4);border:1px solid ${RIM}">
  <img src="data:image/jpeg;base64,${poster}" style="width:100%">
</div>`, 1200, 630, "public/og/rolevara-og.png");

// ---------- LinkedIn level images ----------
const capsule = (level, h) => {
  const id = `c${level}`, lit = ["beginner", "intermediate", "pro"].indexOf(level) + 1;
  const dots = [44, 28, 12].map((cy, i) => i < lit
    ? `<circle cx="12" cy="${cy}" r="8.5" fill="url(#${id})"/><circle cx="12" cy="${cy}" r="4.6" fill="${TEAL}"/><circle cx="10.8" cy="${cy - 1.2}" r="1.4" fill="#E6FFFD" opacity=".85"/>`
    : `<circle cx="12" cy="${cy}" r="4.6" fill="${RIM}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 56" height="${h}" width="${(h * 24) / 56}"><defs><radialGradient id="${id}"><stop offset="0" stop-color="${TEAL}" stop-opacity=".7"/><stop offset="1" stop-color="${TEAL}" stop-opacity="0"/></radialGradient></defs><rect x=".75" y=".75" width="22.5" height="54.5" rx="11.25" fill="${NAVY}" stroke="${RIM}" stroke-width="1.5"/>${dots}</svg>`;
};
const siteDark = await cut(site.file, { ...site, dark: true });
const LABEL = { beginner: "Beginner", intermediate: "Intermediate", pro: "Pro" };
for (const level of ["beginner", "intermediate", "pro"]) {
  await shot(`<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 22% 50%,rgba(0,173,168,.25) 0,transparent 45%)"></div>
<div style="position:absolute;left:150px;top:83px">${capsule(level, 460)}</div>
<div style="position:absolute;left:430px;top:104px;width:700px;color:#fff">
  <img src="${siteDark}" style="height:52px">
  <div style="margin-top:52px;font:700 22px F;letter-spacing:.14em;text-transform:uppercase;color:${LIGHT_TEAL}">Level</div>
  <div style="margin-top:6px;font:800 104px/1 F;letter-spacing:-.03em">${LABEL[level]}</div>
  <div style="margin-top:26px;font:500 26px/1.4 S;color:#C3D2EA">Identity and access skills, proven on realistic operations work.</div>
  <div style="margin-top:34px;font:600 22px S;color:#fff">${TAGLINE} <span style="color:${LIGHT_TEAL}">rolevara.com</span></div>
</div>`, 1200, 627, `public/badges/rolevara-level-${level}.png`);
}
await b.close();
console.log("brand assets written");
