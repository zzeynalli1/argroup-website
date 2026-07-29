export const brands = Array.from(
  { length: 11 },
  (_, i) => `/images/logos/brands/brand-${String(i + 1).padStart(2, '0')}.png`,
)
