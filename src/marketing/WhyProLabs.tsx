// "Why Pro + Labs": what the labs add, and Pro next to Pro + Labs. Shown on /pricing and /labs.
import { Award, CheckCircle2, FileCheck2, FolderGit2, Minus, MonitorCog } from "lucide-react";
import { Reveal } from "@/components/brand/motion";
import { CANCEL_ANYTIME, tier } from "./plans";

const POINTS = [
  { icon: MonitorCog, t: "The consoles employers use", d: "Practice in Microsoft Entra ID, Okta and AWS, in free tenants you own." },
  { icon: FileCheck2, t: "Graded automatically", d: "A read-only check scores your console work, ticket by ticket, with the simulator's rules." },
  { icon: FolderGit2, t: "Proof you can show", d: "Every lab adds a GitHub portfolio project and a line on your readiness report." },
  { icon: Award, t: "Cert-aligned", d: "Mapped to SC-300, Okta and AWS Security certification objectives." },
];

// [capability, in Pro, in Pro + Labs]
const ROWS: [string, boolean, boolean][] = [
  ["Simulated admin center, every company and track", true, true],
  ["Graded tickets, hints and readiness report", true, true],
  ["Real Entra ID, Okta and AWS tenants", false, true],
  ["Automatic grading of console work", false, true],
  ["GitHub portfolio project per lab", false, true],
];

const Mark = ({ on }: { on: boolean }) => on
  ? <><CheckCircle2 className="mx-auto size-5 text-ok" aria-hidden /><span className="sr-only">Included</span></>
  : <><Minus className="mx-auto size-5 text-muted-foreground" aria-hidden /><span className="sr-only">Not included</span></>;

export function WhyProLabs() {
  const pro = tier("pro"), labs = tier("labs");
  return (
    <section id="why-pro-labs" aria-labelledby="why-h" className="scroll-mt-24 mx-auto max-w-7xl px-4 py-16 md:px-6">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="t-eyebrow">Why Pro + Labs</p>
            <h2 id="why-h" className="t-h1">Show the work in the real console.</h2>
            <p className="t-lead">Employers hire for what a candidate has done in their tools. Pro + Labs turns simulator practice into graded work in live tenants.</p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {POINTS.map(p => (
              <li key={p.t} className="rounded-2xl border bg-card p-5">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/12 text-primary-strong"><p.icon className="size-5" aria-hidden /></span>
                <h3 className="mt-3 font-display text-base font-bold">{p.t}</h3>
                <p className="mt-1 text-[15px] text-muted-foreground">{p.d}</p>
              </li>))}
          </ul>
        </div>
        <Reveal className="overflow-hidden rounded-3xl border bg-card">
          <table className="w-full text-left text-[15px]">
            <caption className="sr-only">Pro compared with Pro + Labs</caption>
            <thead>
              <tr className="border-b bg-muted/40 align-bottom">
                <th scope="col" className="p-4 font-semibold"><span className="sr-only">Capability</span></th>
                <th scope="col" className="w-[28%] p-4 text-center"><span className="block font-display text-base font-bold">Pro</span><span className="block text-sm font-normal text-muted-foreground">Realistic simulator</span></th>
                <th scope="col" className="w-[28%] bg-primary/8 p-4 text-center"><span className="block font-display text-base font-bold text-primary-strong">Pro + Labs</span><span className="block text-sm font-normal text-muted-foreground">Simulator + real tenants</span></th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, a, b]) => (
                <tr key={label} className="border-b last:border-0">
                  <th scope="row" className="p-4 font-normal">{label}</th>
                  <td className="p-4"><Mark on={a} /></td>
                  <td className="bg-primary/8 p-4"><Mark on={b} /></td>
                </tr>))}
              <tr className="border-t">
                <th scope="row" className="p-4 font-semibold">Price</th>
                <td className="p-4 text-center text-sm"><b className="block font-display text-lg">${pro.monthly}/mo</b>{pro.trialDays}-day free trial</td>
                <td className="bg-primary/8 p-4 text-center text-sm"><b className="block font-display text-lg">${labs.monthly}/mo</b>{CANCEL_ANYTIME}</td>
              </tr>
            </tbody>
          </table>
        </Reveal>
      </div>
    </section>
  );
}
