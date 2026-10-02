// The active company's ticket set. Picking a company swaps its tickets, follow-ups, replies, hints
// and GRC desk into the engine's live bindings, so every importer sees them at once (like
// company.js). SET also carries what the app needs around them: the playbook, Jordan Reyes'
// shift, the shift audit's populations, framework topics and the GRC desk's framing.
import { setTickets } from "./tickets.js";
import { setFollowUps } from "./followups.js";
import { setHints } from "./hints.js";
import { setGrc } from "./grc.js";
import { set as PACIFIC_CREST } from "../packs/pacific-crest/set.js";

export let SET;
export function setTicketData(s){
  SET = s;
  setTickets(s.T); setFollowUps(s.CONSEQ, s.STANDING, s.CONSEQ_LINKS, s.REPLIES); setHints(s.HINTS, s.CONSEQ_LINKS); setGrc(s.G);
}
setTicketData(PACIFIC_CREST);
