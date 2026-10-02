// /terms: terms of use.
import { LegalPage, Contact } from "@/marketing/LegalPage";
import { LEGAL, DISCLAIMER } from "@/marketing/legal";

export default function Page() {
  const op = LEGAL.operator;
  return (
    <LegalPage title="Terms of use">
      <section><p>These terms govern use of the {op} website, simulator, reports and lab materials (the "service"). Using the service means accepting these terms.</p></section>
      <section aria-labelledby="t-service">
        <h2 id="t-service">The service</h2>
        <p>{op} is a training service. All companies, people, tickets and data in its scenarios are fictional. Policies and framework references are training material based on published frameworks; they are not legal, compliance or audit advice. Completing {op} scenarios is not an industry certification and does not guarantee any exam result or job outcome.</p>
      </section>
      <section aria-labelledby="t-use">
        <h2 id="t-use">Acceptable use</h2>
        <ul>
          <li>Use the service for learning and for evaluating identity and access skills.</li>
          <li>Do not enter real personal data, credentials or data belonging to an employer into the service.</li>
          <li>Do not attempt to disrupt the service, bypass its security controls, or access it through automated means at a volume that affects other users.</li>
          <li>Do not present a readiness report as verified by {op} unless {op} states that it is verified.</li>
        </ul>
      </section>
      <section aria-labelledby="t-labs">
        <h2 id="t-labs">Platform labs</h2>
        <p>Lab scripts make changes to the tenant they are run against. Run them only in a test or trial tenant that the user controls and is authorised to change, never in a production environment. Lab scripts are provided as is; the user is responsible for reviewing them before running them and for any changes made to their tenant.</p>
      </section>
      <section aria-labelledby="t-plans">
        <h2 id="t-plans">Plans and waitlists</h2>
        <p>Paid plans are shown for information and are not yet on sale. Joining a waitlist creates no obligation to buy, and prices and features may change before release.</p>
      </section>
      <section aria-labelledby="t-ip">
        <h2 id="t-ip">Content and trademarks</h2>
        <p>Scenario content, software and design are owned by {op} or its licensors. Photographs are used under the Unsplash License and credited where shown. {DISCLAIMER}</p>
      </section>
      <section aria-labelledby="t-warranty">
        <h2 id="t-warranty">Disclaimers and liability</h2>
        <p>The service is provided "as is" and "as available", without warranties of any kind to the extent permitted by law. To the extent permitted by law, {op} is not liable for indirect, incidental or consequential damages arising from use of the service, including changes made to a lab tenant.</p>
      </section>
      <section aria-labelledby="t-changes">
        <h2 id="t-changes">Changes and contact</h2>
        <p>These terms may be updated; material changes are posted on this page with a new effective date.{LEGAL.governingLaw ? ` These terms are governed by the laws of ${LEGAL.governingLaw}.` : ""} <Contact /></p>
      </section>
    </LegalPage>
  );
}
