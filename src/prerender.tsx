// Server-render entry for pre-rendering the marketing pages at build time (scripts/prerender.mjs).
import { StrictMode, type ComponentType } from "react";
import { renderToString } from "react-dom/server";
import Landing from "./landing/Page";
import Pricing from "./pricing/Page";
import Tracks from "./tracks/Page";
import Industries from "./industries/Page";
import Labs from "./labs/Page";
import Resources from "./resources/Page";
import Privacy from "./privacy/Page";
import Terms from "./terms/Page";
import NotFound from "./notfound/Page";

// Built HTML file -> page component.
export const PAGES: Record<string, ComponentType> = {
  "index.html": Landing, "pricing/index.html": Pricing, "tracks/index.html": Tracks, "industries/index.html": Industries,
  "labs/index.html": Labs, "resources/index.html": Resources, "privacy/index.html": Privacy, "terms/index.html": Terms, "404.html": NotFound,
};
export const render = (file: string) => { const P = PAGES[file]; return renderToString(<StrictMode><P /></StrictMode>); };
