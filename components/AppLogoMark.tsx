/** ShiftMind logo mark — same graphic as PWA icon / favicon. */
export function AppLogoMark({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden>
      <rect width="40" height="40" fill="var(--brand-primary)" rx="4" />
      <path
        d="M10 28 L20 10 L30 28"
        stroke="var(--brand-accent)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="30" r="2.5" fill="var(--brand-accent)" />
    </svg>
  );
}
