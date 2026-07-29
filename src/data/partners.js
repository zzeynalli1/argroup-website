export const partners = Array.from(
  { length: 7 },
  (_, i) => `/images/logos/partners/partner-${String(i + 1).padStart(2, '0')}.png`,
)
