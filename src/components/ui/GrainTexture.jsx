/**
 * Extremely subtle film-grain texture (feTurbulence noise as a data-URI SVG)
 * so large flat surfaces don't read as digitally flat. Keep opacity very low
 * (~0.03-0.04) — felt, not seen. Parent must be `relative`; place this first
 * and keep real content in a `relative z-10` wrapper, same convention as
 * GridTexture.
 */
export default function GrainTexture({ className = '', opacity = 'opacity-[0.035]' }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${opacity} mix-blend-overlay ${className}`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        backgroundSize: '160px 160px',
      }}
    />
  )
}
