/**
 * Projects-page hero decoration: a simplified building skyline silhouette —
 * thin gray line-art plus two ember accent dots marking featured projects.
 * Purely decorative, not a real site plan.
 */
export default function SkylineIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 480 320" fill="none" className={className}>
      <g className="text-neutral-custom-400" stroke="currentColor" strokeWidth="1" fill="none">
        <line x1="20" y1="280" x2="460" y2="280" />
        <rect x="40" y="180" width="50" height="100" />
        <rect x="110" y="120" width="50" height="160" />
        <rect x="180" y="200" width="50" height="80" />
        <rect x="250" y="80" width="50" height="200" />
        <rect x="320" y="150" width="50" height="130" />
        <rect x="390" y="220" width="50" height="60" />
      </g>
      <g className="text-ember-600" fill="currentColor">
        <circle cx="135" cy="120" r="3" />
        <circle cx="275" cy="80" r="3" />
      </g>
    </svg>
  )
}
