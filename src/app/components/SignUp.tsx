// Sign-up screen shown before the simulator opens for the first time in a browser.
import { useState, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/Rolevara";
import { cn } from "@/lib/utils";
import { signUp } from "../account";

const ROLES = ["Service desk or IT support", "IAM analyst or engineer", "Security operations", "GRC, audit or compliance", "Team lead or manager", "Training provider", "Moving into identity and access"];

const checkName = (v: string) => v.trim() ? null : "Enter your name.";
const checkEmail = (v: string) => !v.trim() ? "Enter an email address." : /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim()) ? null : "Enter an email address in the format name@example.com.";

export function SignUp({ onDone }: { onDone: () => void }) {
  const [errs, setErrs] = useState<{ name?: string | null; email?: string | null }>({});
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    const f = e.currentTarget, val = (n: string) => (f.elements.namedItem(n) as HTMLInputElement).value;
    const next = { name: checkName(val("name")), email: checkEmail(val("email")) };
    setErrs(next);
    if (next.name || next.email) {
      setMsg("Fix the errors above to create your account.");
      (f.elements.namedItem(next.name ? "name" : "email") as HTMLInputElement).focus();
      return;
    }
    // Honeypot: people never see or fill it, bots usually do.
    if (val("_gotcha")) return;
    setSending(true); setMsg("Creating your account…");
    try {
      await signUp({ name: val("name").trim(), email: val("email").trim(), role: val("role") });
      onDone();
    } catch {
      setMsg("That didn't go through. Check the connection and try again.");
      setSending(false);
    }
  };
  const field = "h-12 rounded-xl text-[15px]";
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <a href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" aria-hidden />Home</a>
        <div className="rounded-3xl border bg-card p-7 shadow-xl md:p-9">
          <Logo sim className="h-8" />
          <h1 tabIndex={-1} data-page-title className="mt-6 font-display text-2xl font-bold">Create your free account</h1>
          <p className="mt-1.5 text-[15px] text-muted-foreground">Sign up to start your first shift. It's free, and no payment details are needed.</p>
          <form onSubmit={submit} noValidate aria-busy={sending} className="relative mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="su-name" className="text-[15px]">Name</Label>
              <Input id="su-name" name="name" autoComplete="name" required maxLength={100} aria-invalid={errs.name ? true : undefined}
                aria-describedby={errs.name ? "su-name-error" : undefined} className={cn(field, errs.name && "border-bad")} />
              {errs.name && <p id="su-name-error" className="text-sm font-semibold text-bad">{errs.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="su-email" className="text-[15px]">Email</Label>
              <Input id="su-email" name="email" type="email" inputMode="email" autoComplete="email" required maxLength={254} aria-invalid={errs.email ? true : undefined}
                aria-describedby={errs.email ? "su-email-error" : undefined} className={cn(field, errs.email && "border-bad")} />
              {errs.email && <p id="su-email-error" className="text-sm font-semibold text-bad">{errs.email}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="su-role" className="text-[15px]">Current role</Label>
              <select id="su-role" name="role" className="h-12 w-full rounded-xl border border-input bg-background px-3 text-[15px]">
                {ROLES.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
              <label>Leave this field empty<input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" /></label>
            </div>
            <Button type="submit" size="lg" disabled={sending} className="h-12 w-full text-base font-bold">{sending ? "Creating your account…" : "Sign up and start"}</Button>
            <p className="text-xs text-muted-foreground">By signing up you agree to the <a className="underline" href="/terms/">Terms</a> and <a className="underline" href="/privacy/">Privacy policy</a>.</p>
            <p role="status" className="min-h-5 text-sm text-muted-foreground">{msg}</p>
          </form>
        </div>
      </div>
    </main>
  );
}
