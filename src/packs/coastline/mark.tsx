// Coastline Credit Union mark: a low sun over stepped coastal waves, on indigo with cyan.
// Original design, not based on any real institution's logo or colors.
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#243B6B" />
      <circle cx="20.5" cy="12" r="3.6" fill="#FFE08A" />
      <path d="M6 18.5c2.2 0 3.3-1.6 5-1.6s2.8 1.6 5 1.6 3.3-1.6 5-1.6 2.8 1.6 5 1.6" fill="none" stroke="#7FD6E8" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 23c2.2 0 3.3-1.6 5-1.6s2.8 1.6 5 1.6 3.3-1.6 5-1.6 2.8 1.6 5 1.6" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
