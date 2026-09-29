// Adds canonical, Open Graph, Twitter card and icon tags to every HTML page at build time, using
// each page's own <title> and meta description as the single source of truth.
import type { Plugin } from "vite";

export const SITE_URL = (process.env.SITE_URL || "https://shiftready-site.vercel.app").replace(/\/$/, "");
const OG_IMAGE = "/og/shiftready-og.png";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export function seo(): Plugin {
  return {
    name: "shiftready-seo",
    transformIndexHtml(html, ctx) {
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
      return html.replace("</head>", tags.join("\n") + "\n</head>");
    },
  };
}
