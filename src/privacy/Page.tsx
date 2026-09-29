// /privacy: what ShiftReady collects, where it goes, and the choices available.
import { LegalPage, Contact } from "@/marketing/LegalPage";
import { LEGAL } from "@/marketing/legal";

export default function Page() {
  return (
    <LegalPage title="Privacy policy">
      <section><p>This policy explains what {LEGAL.operator} collects when the website and simulator are used, why, and the choices available. {LEGAL.operator} does not sell personal information and does not use advertising trackers.</p></section>
      <section aria-labelledby="p-summary">
        <h2 id="p-summary">Summary</h2>
        <ul>
          <li>No cookies are set.</li>
          <li>Simulator progress stays in the browser and is not sent to {LEGAL.operator}.</li>
          <li>The waitlist form collects an email address, a plan of interest and a current role.</li>
          <li>Page-view analytics are cookieless and aggregated.</li>
        </ul>
      </section>
      <section aria-labelledby="p-waitlist">
        <h2 id="p-waitlist">Waitlist</h2>
        <p>When the waitlist form is submitted, the email address, plan of interest and current role are sent to <a href="https://formspree.io/legal/privacy-policy" rel="noopener" target="_blank">Formspree</a>, which processes form submissions on {LEGAL.operator}'s behalf. They are used only to send release notifications for the chosen plan and to understand who the product serves. They are kept until deletion is requested. A hidden anti-spam field is used to filter automated submissions; it is not stored.</p>
      </section>
      <section aria-labelledby="p-local">
        <h2 id="p-local">Data stored in the browser</h2>
        <p>Simulator progress, the theme preference and the name entered on a readiness report are stored in the browser's local storage on the device being used. This data is not sent to {LEGAL.operator}. It can be removed with "Reset progress" in the app or by clearing site data in the browser.</p>
      </section>
      <section aria-labelledby="p-report">
        <h2 id="p-report">Readiness report links</h2>
        <p>A shared readiness report carries its data inside the link itself, after the # sign. Browsers do not send that part of a link to web servers, so report contents are not received by {LEGAL.operator}. Anyone who has a report link can view the report.</p>
      </section>
      <section aria-labelledby="p-analytics">
        <h2 id="p-analytics">Analytics</h2>
        <p>{LEGAL.operator} uses <a href="https://vercel.com/docs/analytics/privacy-policy" rel="noopener" target="_blank">Vercel Web Analytics</a> to count page views. It uses no cookies and reports aggregated data such as the page path, referring site, browser, device type and country. The part of a link after the # sign and any query string are removed before anything is sent.</p>
      </section>
      <section aria-labelledby="p-hosting">
        <h2 id="p-hosting">Hosting</h2>
        <p>The site is hosted by Vercel, which processes technical data such as IP addresses in server logs to deliver and secure the service. See the <a href="https://vercel.com/legal/privacy-policy" rel="noopener" target="_blank">Vercel privacy policy</a>. Fonts, images and video are served from the same site; no third-party font or media servers are contacted.</p>
      </section>
      <section aria-labelledby="p-rights">
        <h2 id="p-rights">Choices and rights</h2>
        <p>Depending on location, rights may include access to, correction of, or deletion of personal information, and objection to its use. Waitlist data can be removed on request. <Contact /></p>
      </section>
      <section aria-labelledby="p-children">
        <h2 id="p-children">Children</h2>
        <p>The service is intended for working professionals and is not directed to children under 16.</p>
      </section>
      <section aria-labelledby="p-changes">
        <h2 id="p-changes">Changes</h2>
        <p>Material changes to this policy are posted on this page with a new effective date.</p>
      </section>
    </LegalPage>
  );
}
