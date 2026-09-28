// Detail panel that slides in from the right (admin-center "blade"). Non-modal: the page behind stays
// usable (so toasts with Undo work), Escape closes it, focus moves to its title on open and back to
// what opened it on close. Full width on small screens.
import { useEffect, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DetailPanel({ title, subtitle, badges, onClose, children, labelId }:
  { title: ReactNode; subtitle?: ReactNode; badges?: ReactNode; onClose: () => void; children: ReactNode; labelId: string }) {
  const reduce = useReducedMotion();
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    opener.current = document.activeElement as HTMLElement;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !e.defaultPrevented && !document.querySelector("[role=dialog][data-state=open]")) onClose(); };
    addEventListener("keydown", onKey);
    return () => { removeEventListener("keydown", onKey); opener.current?.isConnected && opener.current.focus({ preventScroll: true }); };
  }, [onClose]);
  return (
    <motion.aside aria-labelledby={labelId} data-detail-panel
      initial={reduce ? false : { x: 48, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l bg-card shadow-2xl sm:w-[min(40rem,92vw)]"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <header className="flex items-start justify-between gap-3 border-b px-6 py-4">
        <div className="min-w-0 space-y-1.5">
          {badges && <div className="flex flex-wrap gap-1">{badges}</div>}
          <h2 id={labelId} data-panel-focus tabIndex={-1} className="t-h2 truncate">{title}</h2>
          {subtitle && <p className="t-meta">{subtitle}</p>}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel"><X /></Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
    </motion.aside>
  );
}
