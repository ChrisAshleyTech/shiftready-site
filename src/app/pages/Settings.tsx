// Settings: switch path or company, and the account. Progress is saved per path and per company, in this browser.
import { Settings as SettingsIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "../components/bits";
import { PathPicker } from "../components/PathPicker";
import { CompanySwitcher } from "../components/CompanySwitcher";
import { Button } from "@/components/ui/button";
import { account, signOut } from "../account";

export default function Settings() {
  const a = account();
  return (
    <>
      <PageHeader icon={SettingsIcon} title="Settings" sub="Switch path or company at any time. Progress is saved separately for each path at each company, in this browser only." />
      <div className="space-y-8">
        <section aria-labelledby="st-path" className="space-y-3">
          <h2 id="st-path" className="text-lg font-semibold">Path</h2>
          <p className="max-w-[70ch] text-sm text-muted-foreground">All three paths are included in Free.</p>
          <PathPicker headingLevel={3} onPicked={() => { /* stay on Settings */ }} />
        </section>
        <Card className="gap-3 p-5">
          <h2 className="text-lg font-semibold">Company</h2>
          <p className="max-w-[70ch] text-sm text-muted-foreground">The fictional company you work at. Each company has its own tickets, people, policies and audit desk, and keeps its own progress on each path.</p>
          <div><CompanySwitcher className="border border-input px-3 py-2" /></div>
        </Card>
        <Card className="gap-3 p-5">
          <h2 className="text-lg font-semibold">Account</h2>
          <p className="max-w-[70ch] text-sm text-muted-foreground">{a ? <>Signed up as <b className="text-foreground">{a.name}</b> ({a.email}).</> : "Signed up in this browser."} Signing out keeps your progress in this browser.</p>
          <div><Button variant="outline" onClick={signOut}>Sign out</Button></div>
        </Card>
      </div>
    </>
  );
}
