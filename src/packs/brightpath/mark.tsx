// Brightpath SaaS mark: a stepped path climbing to a point of light, on charcoal with gold and
// mint. Original design, not based on any real company's logo or colors.
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#1F2229" />
      <path d="M7 24h5v-5h5v-5h5" fill="none" stroke="#F5C451" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="9" r="2.6" fill="#6EE7B7" />
    </svg>
  );
}
