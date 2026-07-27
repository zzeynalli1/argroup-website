/**
 * Hand-drawn outline brand marks for Facebook/Instagram/LinkedIn/WhatsApp.
 * lucide-react (used elsewhere for generic icons like MapPin/Phone/Mail)
 * deliberately ships no brand logos, so these are custom SVGs kept in the
 * same stroke-based visual language (24x24, ~1.8 stroke) to blend in.
 * `className` should set the color via `text-*` (they use currentColor).
 */

export function FacebookIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M14.5 8.5h-1.5a2 2 0 0 0-2 2v1.5H9v2h2v6h2v-6h2l.5-2h-2.5v-1.5a.5.5 0 0 1 .5-.5h2z" />
    </svg>
  )
}

export function InstagramIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function LinkedinIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <line x1="7.5" y1="10.5" x2="7.5" y2="16.5" />
      <circle cx="7.5" cy="7.3" r="0.6" fill="currentColor" stroke="none" />
      <path d="M11 16.5v-4a2 2 0 0 1 4 0v4" />
      <line x1="11" y1="10.5" x2="11" y2="16.5" />
    </svg>
  )
}

export function WhatsappIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" />
      <path d="M8.5 9.5c0-.5.4-1 1-1h.5c.3 0 .5.2.6.4l.5 1.3c.1.3 0 .6-.2.8l-.5.5c.4 1 1.2 1.8 2.2 2.2l.5-.5c.2-.2.5-.3.8-.2l1.3.5c.3.1.4.4.4.6v.5c0 .6-.5 1-1 1-3 0-6-3-6-6z" />
    </svg>
  )
}
