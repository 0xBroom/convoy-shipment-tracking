// The demo clock is fixed so every relative time ("2 days late", "stale 31 h")
// renders the same on any machine and on any day. Never read the real clock.
export const NOW = new Date('2026-10-08T14:30:00+02:00')
export const TZ = 'Europe/Madrid'
