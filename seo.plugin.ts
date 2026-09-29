// Build-time SEO: adds canonical, Open Graph, Twitter card and icon tags to every HTML page (using
// each page's own <title> and meta description as the single source of truth), and emits
// sitemap.xml and robots.txt with the same SITE_URL.
import type { Plugin } from "vite";

export const SITE_URL = (process.env.SITE_URL || "https://shiftready-site.vercel.app").replace(/\/$/, "");
const OG_IMAGE = "/og/shiftready-og.png";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

// Public, indexable pages for sitemap.xml. /report/ (learners' shared reports) is excluded and noindex.
export const SITEMAP = ["/", "/tracks/", "/industries/", "/labs/", "/pricing/", "/resources/", "/app/", "/privacy/", "/terms/"];

export function seo(): Plugin {
  return {
    name: "shiftready-seo",
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10);
      const urls = SITEMAP.map(p => `  <url><loc>${SITE_URL}${p}</loc><lastmod>${today}</lastmod></url>`).join("\n");
      this.emitFile({
        type: "asset", fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      });
      this.emitFile({
        type: "asset", fileName: "robots.txt",
        source: `User-agent: *\nAllow: /\nDisallow: /report/\nDisallow: /sim.html\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
      });
    },
    // Runs after Vite injects the bundle tags, so the stylesheet can be moved ahead of the
    // module preloads: on a slow connection it is the only render-blocking request.
    transformIndexHtml: { order: "post", handler(html, ctx) {
      const path = ctx.path.replace(/index\.html$/, "");
      const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "ShiftReady";
      const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "";
      const url = SITE_URL + path;
      const img = SITE_URL + OG_IMAGE;
      const tags = [
        `<link rel="canonical" href="${url}">`,
        `<meta property="og:type" content="website">`,
        `<meta property="og:site_name" content="ShiftReady">`,
        `<meta property="og:title" content="${esc(title)}">`,
        `<meta property="og:description" content="${esc(desc)}">`,
        `<meta property="og:url" content="${url}">`,
        `<meta property="og:image" content="${img}">`,
        `<meta property="og:image:width" content="1200">`,
        `<meta property="og:image:height" content="630">`,
        `<meta property="og:image:alt" content="ShiftReady: identity and access skills, built on real operations work. A screenshot of the ticket queue.">`,
        `<meta name="twitter:card" content="summary_large_image">`,
        `<meta name="twitter:title" content="${esc(title)}">`,
        `<meta name="twitter:description" content="${esc(desc)}">`,
        `<meta name="twitter:image" content="${img}">`,
        `<link rel="icon" href="/favicon.ico" sizes="32x32">`,
        `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`,
        `<link rel="manifest" href="/site.webmanifest">`,
      ];
      const css = html.match(/<link rel="stylesheet"[^>]*>\n?/g) ?? [];
      for (const l of css) html = html.replace(l, "");
      // Preload the two text fonts, which are otherwise found only after the stylesheet is parsed.
      const fonts = Object.keys(ctx.bundle ?? {}).filter(f => /(figtree|source-sans-3)-latin-wght-normal-.*\.woff2$/.test(f));
      const preload = fonts.map(f => `<link rel="preload" href="/${f}" as="font" type="font/woff2" crossorigin>\n`).join("");
      html = html.replace(/<script type="module"/, css.join("") + preload + '<script type="module"');
      return html.replace("</head>", tags.join("\n") + "\n</head>");
    } },
  };
}
