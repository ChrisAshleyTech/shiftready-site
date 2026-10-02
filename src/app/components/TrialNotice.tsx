// From day 10 of the free trial: how many days are left, with a link to the plan options.
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TRIAL_DAYS, TRIAL_NOTICE_DAY, trialDaysLeft } from "../account";

const STORE = "rolevara-trial-dismissed";

export function TrialNotice() {
  const left = trialDaysLeft();
  // Dismissing hides it until the count changes the next day.
  const [hidden, setHidden] = useState(() => { try { return localStorage.getItem(STORE) === String(left); } catch { return false; } });
  if (left == null || left > TRIAL_DAYS - TRIAL_NOTICE_DAY || hidden) return null;
  const dismiss = () => { try { localStorage.setItem(STORE, String(left)); } catch { /* storage blocked */ } setHidden(true); };
  const text = left === 0 ? "Your free trial has ended. Choose a plan to keep going."
    : `Your free trial ends in ${left} ${left === 1 ? "day" : "days"}. See your plan options.`;
  return (
    <div role="status" className="border-b bg-primary/10 px-4 py-2.5 md:px-6">
      <div className="mx-auto flex max-w-[1480px] flex-wrap items-center gap-x-4 gap-y-2">
        <p className="min-w-0 flex-1 text-sm font-semibold">{text}</p>
        <Button asChild size="sm"><a href="/pricing/">See plans</a></Button>
        <Button variant="ghost" size="icon" className="size-8" aria-label="Dismiss trial notice" onClick={dismiss}><X className="size-4" aria-hidden /></Button>
      </div>
    </div>
  );
}
