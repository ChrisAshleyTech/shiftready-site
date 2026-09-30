// Meridian Aerospace mark: a swept wing crossing a meridian arc, on graphite with amber. Original
// design, not based on any real company's logo or colors.
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#2B3240" />
      <path d="M16 5.5a10.5 10.5 0 0 1 0 21" fill="none" stroke="#9AA5B8" strokeWidth="1.4" />
      <path d="M6.5 19.5 25.5 11l-6.5 8.5z" fill="#F2B544" />
      <path d="M6.5 19.5 19 19.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
