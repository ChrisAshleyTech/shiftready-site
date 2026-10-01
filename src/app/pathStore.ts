// The learner's path: which parts of the week they work. Read before the engine loads saved
// progress, because each path keeps its own progress at each company.
export type PathId = "iam" | "iam-grc" | "grc";
export const PATH_IDS: readonly PathId[] = ["iam", "iam-grc", "grc"];
export const isPath = (x: unknown): x is PathId => PATH_IDS.includes(x as PathId);

const STORE = "rolevara-path";
// Pacific Crest's saved progress from before paths existed. Its owner has already been working
// IAM + GRC (the shifts plus the audit desk), so they skip the first-visit picker.
const LEGACY = "pcl-iam-sim-v1";

function read(): PathId | null {
  try {
    const v = localStorage.getItem(STORE);
    if (isPath(v)) return v;
    if (localStorage.getItem(LEGACY) !== null) { localStorage.setItem(STORE, "iam-grc"); return "iam-grc"; }
  } catch { /* storage blocked */ }
  return null;
}

let chosen: PathId | null = read();
// Until the learner picks, the app behaves as IAM + GRC (everything visible).
export const path = (): PathId => chosen ?? "iam-grc";
export const pathChosen = () => chosen !== null;
export function setPath(p: PathId) {
  chosen = p;
  try { localStorage.setItem(STORE, p); } catch { /* the choice lasts for this visit */ }
}
// IAM + GRC keeps each company's original key, so progress from before paths carries over.
export const stateKey = (base: string, p: PathId = path()) => (p === "iam-grc" ? base : `${base}:${p}`);
