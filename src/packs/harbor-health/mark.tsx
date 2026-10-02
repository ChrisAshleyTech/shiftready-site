// Harbor Health Network mark: a rounded plus above two harbor waves, on plum. Original design,
// not based on any real organization's logo or colors.
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#5A2A6E" />
      <path d="M16 6.5v10M11 11.5h10" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M6.5 21.5c2.4-1.8 4.6-1.8 7 0s4.6 1.8 7 0 4.2-1.6 5-.6M6.5 25.5c2.4-1.8 4.6-1.8 7 0s4.6 1.8 7 0 4.2-1.6 5-.6" fill="none" stroke="#FF9A7A" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
