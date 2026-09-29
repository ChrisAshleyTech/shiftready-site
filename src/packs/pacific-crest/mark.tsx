// Pacific Crest Logistics mark: an isometric crate on deep teal. Not based on any real company's logo.
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#0E5E6F" />
      <path d="M16 6.5 24.5 11.2 16 16 7.5 11.2Z" fill="#8FD8CC" />
      <path d="M16 6.5 24.5 11.2v9.6L16 25.5l-8.5-4.7v-9.6ZM16 16v9.5M7.5 11.2 16 16l8.5-4.8" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
