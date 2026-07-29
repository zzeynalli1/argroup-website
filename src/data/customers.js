export const customers = Array.from(
  { length: 19 },
  (_, i) => `/images/logos/customers/customer-${String(i + 1).padStart(2, '0')}.png`,
)
