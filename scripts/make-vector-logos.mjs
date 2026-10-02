// Traces Christopher's logo artwork (brand-source/) into SVG so the logos stay sharp at any size and
// on any screen. Each colour is traced on its own (navy, teal) from the original pixels, so the shapes
// are his artwork, not a redraw. Dark-theme twins swap navy for white.
//   node scripts/make-vector-logos.mjs   -> public/brand/*.svg and public/favicon.svg
// The PNG logos from make-brand-assets.mjs stay for the social image, badges and old links.
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { Potrace } = require("potrace");
const Jimp = require("jimp");

const NAVY = "#0B2B5F", TEAL = "#00ADA8", WHITE = "#FFFFFF";
const UP = 2; // trace at 2x the source size for smoother curves

// Splits the artwork into navy and teal masks (ink on white), after erasing the tagline region.
async function masks(file, erase) {
  const img = await Jimp.read(new URL(`../brand-source/${file}`, import.meta.url).pathname);
  img.resize(img.bitmap.width * UP, img.bitmap.height * UP, Jimp.RESIZE_BICUBIC);
  const { width: w, height: h, data } = img.bitmap;
  const navy = new Jimp(w, h, 0xffffffff), teal = new Jimp(w, h, 0xffffffff);
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    // Transparent pixels count as the white background.
    const i = (y * w + x) * 4, al = data[i + 3] / 255, bg = v => Math.round(v * al + 255 * (1 - al));
    const r = bg(data[i]), g = bg(data[i + 1]), b = bg(data[i + 2]);
    if (erase && x >= erase[0] * UP && y >= erase[1] * UP) continue;
    const ink = (255 - Math.min(r, g, b)) / 245;
    if (ink < 0.5) continue;
    const isTeal = g - r > 50 && g > b - 30;
    (isTeal ? teal : navy).setPixelColor(0x000000ff, x, y);
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  return { navy, teal, box: [x0, y0, x1 - x0 + 1, y1 - y0 + 1] };
}

const trace = jimg => new Promise(async (res, rej) => {
  const p = new Potrace({ turdSize: 8, optTolerance: 0.2, alphaMax: 1, threshold: 128 });
  const buf = await jimg.getBufferAsync(Jimp.MIME_PNG);
  p.loadImage(buf, err => err ? rej(err) : res(p.getPathTag("#000").match(/ d="([^"]+)"/)[1]));
});

async function build(file, erase, outs) {
  const { navy, teal, box } = await masks(file, erase);
  const [nd, td] = [await trace(navy), await trace(teal)];
  const pad = 2; // a hairline margin so antialiased edges are never clipped
  const vb = [box[0] - pad, box[1] - pad, box[2] + 2 * pad, box[3] + 2 * pad];
  for (const [path, main, title] of outs) {
    writeFileSync(path, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(" ")}" role="img" aria-label="${title}">` +
      `<path fill="${main}" fill-rule="evenodd" d="${nd}"/><path fill="${TEAL}" fill-rule="evenodd" d="${td}"/></svg>\n`);
  }
  console.log(file, "->", outs.map(o => o[0]).join(", "));
}

// Tagline cut-off points (source pixels) match make-brand-assets.mjs.
await build("rolevara-logo-tagline.png", [620, 476], [["public/brand/rolevara-logo.svg", NAVY, "Rolevara"], ["public/brand/rolevara-logo-dark.svg", WHITE, "Rolevara"]]);
await build("rolevarasim-logo-tagline.png", [590, 448], [["public/brand/rolevarasim-logo.svg", NAVY, "RolevaraSim"], ["public/brand/rolevarasim-logo-dark.svg", WHITE, "RolevaraSim"]]);
await build("rolevara-mark.png", null, [["public/brand/rolevara-mark.svg", NAVY, "Rolevara"], ["public/brand/rolevara-mark-dark.svg", WHITE, "Rolevara"], ["public/favicon.svg", NAVY, "Rolevara"]]);
