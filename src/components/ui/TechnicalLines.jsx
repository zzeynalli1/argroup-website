/**
 * Very subtle diagonal linework — architectural/technical-drawing texture,
 * felt more than seen (opacity ~4-8%). Parent must be `relative`; this
 * renders behind content (place it first, keep content in a `relative z-10`
 * wrapper). Color comes from `currentColor` via the `className` passed in,
 * so the same component works on light or dark sections. Sibling of
 * GridTexture (dot matrix) — use whichever reads better against the section.
 */
export default function TechnicalLines({ className = '', opacity = 'opacity-[0.05]', angle = 22 }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${opacity} ${className}`}
      style={{
        backgroundImage: `repeating-linear-gradient(${angle}deg, currentColor 0, currentColor 1px, transparent 1px, transparent 120px)`,
      }}
    />
  )
}
