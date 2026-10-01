// Makes a private tester link to the lab guides. The secret is read from the environment and never
// printed or stored; set the same value as LAB_ACCESS_SECRET in the Vercel project.
//
//   node scripts/make-lab-link.mjs --new-secret
//       Prints a new random secret to paste into Vercel (Settings > Environment Variables).
//   LAB_ACCESS_SECRET=... node scripts/make-lab-link.mjs --to "tester@example.com" [--days 30] [--base https://rolevara.com]
//       Prints a link that works until it expires. Rotating the secret revokes every link.
//
// TODO(labs-auth): delete this script once lab access moves to Supabase Auth (api/_lib/labAccess.js).
import { randomBytes } from "node:crypto";
import { parseArgs } from "node:util";
import { labSecret, signToken } from "../api/_lib/labAccess.js";

const { values: a } = parseArgs({ options: { "new-secret": { type: "boolean" }, to: { type: "string" }, days: { type: "string", default: "30" }, base: { type: "string", default: "https://rolevara.com" } } });

if (a["new-secret"]) {
  console.log(randomBytes(32).toString("base64url"));
} else {
  const key = labSecret();
  if (!key) throw new Error("Set LAB_ACCESS_SECRET (32 characters or more) to the value in Vercel first.");
  if (!a.to) throw new Error('Name the tester: --to "tester@example.com"');
  const days = Number(a.days);
  if (!(days > 0 && days <= 365)) throw new Error("--days must be between 1 and 365.");
  const exp = Math.floor(Date.now() / 1000) + Math.round(days * 86400);
  console.log(`${a.base.replace(/\/$/, "")}/labs/access?key=${signToken({ sub: a.to, exp }, key)}`);
  console.log(`Expires ${new Date(exp * 1000).toISOString().slice(0, 10)}.`);
}
