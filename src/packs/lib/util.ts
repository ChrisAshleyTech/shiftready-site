// Shared helpers for generating company packs. Everything is seeded, so a pack builds exactly
// the same data on every device and in every test run.

// mulberry32: small, fast, good enough for fictional data.
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export type Rng = ReturnType<typeof rng>;
export const pick = <T,>(r: Rng, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];
export const int = (r: Rng, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));

// Dates are plain "YYYY-MM-DD" strings in UTC, so they sort and compare as text.
export const iso = (d: Date) => d.toISOString().slice(0, 10);
export const ymd = (y: number, m: number, d: number) => iso(new Date(Date.UTC(y, m, d)));
export const addDays = (s: string, n: number) => { const d = new Date(s + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
export const monthOf = (s: string) => s.slice(0, 7);
export const monthEnd = (month: string) => { const [y, m] = month.split("-").map(Number); return ymd(y, m, 0); };

// Local-date formatter for a pack's shift day, matching Pacific Crest's fmtDay.
export function makeFmtDay(base: Date) {
  return (off: number) => { const d = new Date(base); d.setDate(d.getDate() + off); return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); };
}
// The same offset as an ISO date, for HR and finance records.
export const dayIso = (base: Date, off: number) => ymd(base.getFullYear(), base.getMonth(), base.getDate() + off);
