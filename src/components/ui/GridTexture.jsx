/**
 * Very subtle dot-grid texture — material character that should be felt
 * more than seen (opacity ~5-8%). Parent must be `relative`; this renders
 * behind content (place it first, keep content in a `relative z-10`
 * wrapper). Color comes from `currentColor` via the `className` passed in,
 * so the same component works on light or dark sections.
 */
export default function GridTexture({ className = '', opacity = 'opacity-[0.06]' }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${opacity} ${className}`}
      style={{
        backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    />
  )
}
