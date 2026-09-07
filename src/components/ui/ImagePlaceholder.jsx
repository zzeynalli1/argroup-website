/**
 * Development-only stand-in for photography/3D that hasn't been delivered
 * yet. `label` names exactly what belongs here (kept in English, dev-only —
 * not user-facing copy, so it sits outside the i18n system) so placeholders
 * are easy to grep for (`[IMAGE:`) and swap for a real <img>/<Canvas> later.
 * `future3d` marks the handful of spots reserved for an eventual React
 * Three Fiber scene instead of a static photo (see CLAUDE.md: no procedural
 * 3D without a real .glb yet — this just reserves the layout slot).
 */
export default function ImagePlaceholder({
  label,
  aspect = 'aspect-[4/3]',
  tone = 'light',
  future3d = false,
  zoomOnHover = false,
  className = '',
}) {
  // aspect can be '' when a parent grid/flex layout controls sizing instead
  // (see the mosaic gallery in ServicesShowcase.jsx).
  const surface = tone === 'dark' ? 'bg-industrial-800 text-neutral-custom-400' : 'bg-concrete-200 text-neutral-custom-600'
  const border = future3d ? 'border border-dashed border-ember-600/40' : 'border border-current/10'

  return (
    <div className={`relative overflow-hidden ${aspect} ${surface} ${border} ${className}`}>
      <div
        aria-hidden="true"
        className={`absolute inset-0 opacity-40 ${zoomOnHover ? 'transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100' : ''}`}
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 1px, transparent 10px)',
        }}
      />
      <span aria-hidden="true" className="absolute left-3 top-3 h-3 w-3 border-l border-t border-current opacity-30" />
      <span aria-hidden="true" className="absolute bottom-3 right-3 h-3 w-3 border-b border-r border-current opacity-30" />

      <div className="relative flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center">
        {future3d && (
          <span className="rounded-full border border-ember-600/50 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-ember-600">
            Future 3D
          </span>
        )}
        <span className="font-mono text-[11px] uppercase tracking-[0.1em]">[IMAGE: {label}]</span>
      </div>
    </div>
  )
}
