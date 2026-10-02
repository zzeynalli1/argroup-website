const ALLOWED_URL_PROTOCOLS = ['http:', 'https:']

/**
 * True only for absolute http(s) URLs — rejects `javascript:`, `data:`,
 * `file:`, and any other scheme `new URL()` would otherwise happily parse.
 * Empty/null is NOT a safe URL here; check for emptiness separately at
 * call sites where the field is optional.
 */
export function isHttpUrl(value) {
  if (typeof value !== 'string' || !value) return false
  try {
    return ALLOWED_URL_PROTOCOLS.includes(new URL(value).protocol)
  } catch {
    return false
  }
}

/**
 * Admin-form validation for optional external-link fields (brand/partner
 * website_url, product external_link). Empty/null is valid — these fields
 * are optional. Anything else must parse as an http(s) URL. Returns an
 * error message to show the admin, or null if the value is safe to save.
 */
export function validateExternalUrl(value) {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  if (!trimmed) return null
  if (!isHttpUrl(trimmed)) {
    return 'Link http:// və ya https:// ilə başlamalıdır.'
  }
  return null
}
