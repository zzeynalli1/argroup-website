/**
 * Purely decorative engineering/blueprint-style line pattern — thin
 * structural grid lines, dimension lines with tick marks, a small angle
 * annotation, and a few connection-point dots. No fill on the lines, meant
 * to sit at low opacity and blend into the background rather than draw
 * attention. Color comes from the parent via `currentColor`; size/position/
 * opacity are controlled entirely by the `className` the caller passes.
 */
export default function BlueprintPattern({ className = '' }) {
  return (
    <svg viewBox="0 0 240 200" fill="none" stroke="currentColor" strokeWidth="0.75" className={className}>
      {/* Structural grid — parallel/perpendicular lines */}
      <line x1="20" y1="20" x2="220" y2="20" />
      <line x1="40" y1="90" x2="200" y2="90" />
      <line x1="20" y1="160" x2="220" y2="160" />
      <line x1="20" y1="20" x2="20" y2="160" />
      <line x1="120" y1="20" x2="120" y2="90" />
      <line x1="220" y1="20" x2="220" y2="160" />

      {/* Bottom dimension line with tick marks */}
      <line x1="20" y1="180" x2="220" y2="180" />
      <line x1="20" y1="175" x2="20" y2="185" />
      <line x1="120" y1="176" x2="120" y2="184" />
      <line x1="220" y1="175" x2="220" y2="185" />

      {/* Left dimension line with tick marks */}
      <line x1="6" y1="20" x2="6" y2="160" />
      <line x1="1" y1="20" x2="11" y2="20" />
      <line x1="1" y1="160" x2="11" y2="160" />

      {/* Angle annotation near a corner */}
      <path d="M 35 20 A 15 15 0 0 1 20 35" />

      {/* Connection / node points */}
      <circle cx="20" cy="20" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="120" cy="90" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="220" cy="160" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  )
}
