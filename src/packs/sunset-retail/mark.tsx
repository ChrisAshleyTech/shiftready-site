// Sunset Retail Group mark: a setting sun framed by an arched doorway, in terracotta and sand.
// Original design, not based on any real retailer's logo or colors.
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#9E4A36" />
      <path d="M9 25V15a7 7 0 0 1 14 0v10" fill="none" stroke="#F4E3C3" strokeWidth="2" />
      <path d="M11.5 21.5a4.5 4.5 0 0 1 9 0z" fill="#FFC56B" />
      <path d="M7 25h18" stroke="#F4E3C3" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
