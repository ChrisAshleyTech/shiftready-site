// Vercel Web Analytics: cookieless, aggregated page views. It only runs on Vercel deployments
// (the script is served from /_vercel/insights). The URL fragment is stripped before sending, so
// report data (#r=...) and in-app routes are never collected; only the page path is.
import { inject } from "@vercel/analytics";

inject({
  beforeSend: event => {
    const url = new URL(event.url);
    url.hash = "";
    url.search = "";
    return { ...event, url: url.toString() };
  },
});
