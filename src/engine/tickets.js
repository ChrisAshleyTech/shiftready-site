// The active company's assigned tickets (live bindings, like company.js). Pacific Crest's are the
// default; picking another company swaps in its ticket set (see ticketSet.js).
import { T as PACIFIC_CREST } from "../packs/pacific-crest/tickets.js";

export let T, TK;
export function setTickets(list){ T = list; TK = Object.fromEntries(T.map(t=>[t.id,t])); }
setTickets(PACIFIC_CREST);
