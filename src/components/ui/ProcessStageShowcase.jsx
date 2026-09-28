import { useEffect, useRef, useState } from 'react'
import ImagePlaceholder from './ImagePlaceholder'

/**
 * Interactive technical-process image, driven entirely by `stages` — any
 * length (3, 4, 5, 6+), never assumed to be four. Two independent rendering
 * paths:
 *
 * - No `src` (still-unsourced services): `ImagePlaceholder` + small point
 *   markers with a visible numbered badge each — since there's nothing else
 *   on the image to hover for.
 * - `src` given (a real supplied process photo, which already has its own
 *   assemblies and baked-in 01-02-03... markers): the image is divided into
 *   one large full-height hover/tap zone per stage — instead of requiring a
 *   precise hover over the small numbers. Zone boundaries are derived from
 *   `markers[i].x` (hand-measured marker-center positions, one per stage) by
 *   taking midpoints between consecutive markers, so the data only needs to
 *   say where each number is, not redeclare separate zone widths. When a
 *   service has no hand-measured `markers` yet, zones fall back to an even
 *   spread across the image (see `generateDefaultMarkers`).
 *
 * `stages` is an array of `{ title, description }` (translation-driven,
 * i18n-safe — see locales/<locale>/services.json `process.genericStages` or
 * a per-service `detail.<key>.process` override); numbers/titles/
 * descriptions are all plain markup, never part of the image itself, so one
 * placeholder/real image works unmodified across all 4 languages.
 *
 * Desktop hover ("spotlight"): the hovered stage's own artwork stays at its
 * original color/brightness; every other stage dims and desaturates. This is
 * built from two stacked copies of the same image — a full-color base layer,
 * and a dimmed/desaturated copy above it whose opacity fades in on hover and
 * whose CSS mask cuts a soft-edged hole over the active zone (so the base
 * layer's original colors show through only there). No tint, wash, glow, or
 * border is ever drawn on top of the artwork itself — only that fade and a
 * floating text panel. Mouse leave -> the dim layer fades back out, restoring
 * the untouched image. Touch: tap a zone -> activate; tap another -> swaps.
 */
// Even spread across an image with no hand-authored marker positions —
// works for any stage count (3, 4, 5, 6...), not just four.
function generateDefaultMarkers(count) {
  return Array.from({ length: count }, (_, index) => ({
    x: `${count === 1 ? 50 : 10 + (80 * index) / (count - 1)}%`,
  }))
}

const H_ALIGN_CLASS = {
  start: 'left-0',
  center: 'left-1/2 -translate-x-1/2',
  end: 'right-0',
}

// Anchors near the image's own left/right edge close to start/end rather
// than only the first/last stage, so a floating panel never gets pushed
// past the image bounds (and the page's horizontal scroll) on layouts with
// many narrow stages.
function hAlignForPercent(xPercent, index, count) {
  if (index === 0 || xPercent <= 22) return 'start'
  if (index === count - 1 || xPercent >= 78) return 'end'
  return 'center'
}

function parsePercent(value) {
  return parseFloat(value)
}

// Turns hand-measured marker centers into full-height zone boundaries: each
// zone's edge sits at the midpoint between its own marker and the next/
// previous one, so the zones tile the image with no gaps/overlaps — works
// for any number of stages, not just four.
function computeZones(markerPoints) {
  return markerPoints.map((marker, index) => {
    const x = parsePercent(marker.x)
    const prevX = index === 0 ? null : parsePercent(markerPoints[index - 1].x)
    const nextX = index === markerPoints.length - 1 ? null : parsePercent(markerPoints[index + 1].x)
    const left = index === 0 ? 0 : (prevX + x) / 2
    const right = index === markerPoints.length - 1 ? 100 : (x + nextX) / 2
    return { left, width: right - left, center: x }
  })
}

// Builds the CSS mask for the dimmed copy of the image: opaque (dim layer
// visible) everywhere except a soft-edged "hole" over the active zone, where
// it turns transparent so the full-color base layer shows through untouched.
// The feather is clamped to the zone's own width so narrow zones (many
// stages) never produce inverted/invalid gradient stops.
function buildSpotlightMask(zone) {
  const feather = Math.min(4, Math.max(0.5, zone.width / 2 - 0.5))
  const left = zone.left
  const right = zone.left + zone.width
  let holeStart = left + feather
  let holeEnd = right - feather
  if (holeStart > holeEnd) {
    const mid = (left + right) / 2
    holeStart = mid
    holeEnd = mid
  }
  return `linear-gradient(to right, black 0%, black ${left}%, transparent ${holeStart}%, transparent ${holeEnd}%, black ${right}%, black 100%)`
}

function StageZonesOverlay({ stages, zones, active, setActive, onHoverEnter }) {
  return (
    <>
      {stages.map((stage, index) => {
        const zone = zones[index]
        const isActive = active === index
        const hAlign = hAlignForPercent(zone.center, index, stages.length)

        return (
          <div key={index} className="absolute inset-y-0" style={{ left: `${zone.left}%`, width: `${zone.width}%` }}>
            <button
              type="button"
              aria-pressed={isActive}
              aria-label={`${String(index + 1).padStart(2, '0')} — ${stage.title}`}
              className="absolute inset-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ember-600"
              onMouseEnter={() => onHoverEnter(index)}
              onMouseLeave={() => setActive((current) => (current === index ? null : current))}
              onFocus={() => setActive(index)}
              onBlur={() => setActive((current) => (current === index ? null : current))}
              onClick={() => setActive(index)}
            />

            {/* Floating explanation anchored near the floor of the image,
                below every assembly, so it never covers the technical
                object itself. */}
            <div
              aria-hidden={!isActive}
              className={`pointer-events-none absolute bottom-4 w-80 max-w-[85vw] rounded-sm border border-ember-600/25 bg-industrial-950/94 px-5 py-4 shadow-lg shadow-black/30 backdrop-blur-sm transition-all duration-200 ${H_ALIGN_CLASS[hAlign]} ${
                isActive ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
              }`}
            >
              <p className="font-heading text-base font-semibold text-base-50">
                <span className="mr-2 text-ember-600">{String(index + 1).padStart(2, '0')}</span>
                {stage.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-custom-300">{stage.description}</p>
            </div>
          </div>
        )
      })}
    </>
  )
}

function PointMarkersOverlay({ stages, tone, active, setActive, onHoverEnter }) {
  const isDark = tone === 'dark'
  const points = generateDefaultMarkers(stages.length).map((marker, index) => ({
    x: marker.x,
    y: index % 2 === 0 ? '68%' : '24%',
    vAlign: index % 2 === 0 ? 'above' : 'below',
    hAlign: hAlignForPercent(parsePercent(marker.x), index, stages.length),
  }))

  return (
    <>
      {stages.map((stage, index) => {
        const point = points[index]
        const isActive = active === index

        return (
          <div key={index} className="absolute" style={{ left: point.x, top: point.y }}>
            {/* Centers this fixed-size (marker + tooltip) box exactly on the
                (x, y) point above — the point itself carries no size. */}
            <div className="relative -translate-x-1/2 -translate-y-1/2">
              {/* Local warm glow, contained to a small radius around the
                  marker only — never a full-image or full-column tint. */}
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember-600 blur-xl transition-opacity duration-200 ${
                  isActive ? 'opacity-20' : 'opacity-0'
                }`}
              />

              <button
                type="button"
                aria-pressed={isActive}
                aria-label={`${String(index + 1).padStart(2, '0')} — ${stage.title}`}
                className="relative flex h-8 w-8 items-center justify-center rounded-full focus:outline-none focus-visible:ring-1 focus-visible:ring-ember-600"
                onMouseEnter={() => onHoverEnter(index)}
                onMouseLeave={() => setActive((current) => (current === index ? null : current))}
                onFocus={() => setActive(index)}
                onBlur={() => setActive((current) => (current === index ? null : current))}
                onClick={() => setActive(index)}
              >
                <span
                  className={`flex h-full w-full items-center justify-center rounded-full border font-mono text-[11px] font-semibold transition-all duration-200 ${
                    isActive
                      ? 'scale-110 border-ember-600 bg-ember-600 text-base-50'
                      : isDark
                        ? 'border-white/30 bg-industrial-950/70 text-base-50 hover:border-ember-600/70'
                        : 'border-industrial-950/25 bg-base-50/85 text-industrial-950 hover:border-ember-600/70'
                  }`}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
              </button>

              {/* Compact floating tooltip, anchored to this marker only —
                  never wide/tall enough to cover the rest of the image. */}
              <div
                aria-hidden={!isActive}
                className={`pointer-events-none absolute w-52 max-w-[85vw] rounded-sm border border-white/10 bg-industrial-950/90 px-3.5 py-3 backdrop-blur-sm transition-all duration-200 ${
                  point.vAlign === 'above' ? 'bottom-full mb-3' : 'top-full mt-3'
                } ${H_ALIGN_CLASS[point.hAlign]} ${
                  isActive
                    ? 'translate-y-0 opacity-100'
                    : `opacity-0 ${point.vAlign === 'above' ? 'translate-y-1' : '-translate-y-1'}`
                }`}
              >
                <p className="font-heading text-xs font-semibold text-base-50">
                  <span className="mr-1.5 text-ember-600">{String(index + 1).padStart(2, '0')}</span>
                  {stage.title}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-custom-400">{stage.description}</p>
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}

export default function ProcessStageShowcase({
  image,
  src,
  aspect = 'aspect-[16/7]',
  markers,
  stages,
  tone = 'light',
  className = '',
}) {
  const [active, setActive] = useState(null)
  const isDark = tone === 'dark'

  // A programmatic scroll (e.g. auto-scrolling to a newly opened detail
  // panel) can leave the cursor resting over this image once the page stops
  // moving underneath it — browsers then fire a genuine `mouseenter` for
  // whatever zone ends up under the pointer, which would activate a stage
  // before the user ever intentionally hovered anything. Swallowing hover
  // activations (not clicks/taps, and not the leave/blur that clears them)
  // for a brief window after this component mounts keeps the default state
  // — the untouched image, no panel — genuinely default.
  const hoverReadyRef = useRef(false)
  useEffect(() => {
    const timer = setTimeout(() => {
      hoverReadyRef.current = true
    }, 500)
    return () => clearTimeout(timer)
  }, [])
  function handleHoverEnter(index) {
    if (!hoverReadyRef.current) return
    setActive(index)
  }

  if (src) {
    const zones = computeZones(markers ?? generateDefaultMarkers(stages.length))
    const spotlightMask = active !== null ? buildSpotlightMask(zones[active]) : undefined

    return (
      <div className={`relative ${className}`}>
        <div className={`relative w-full overflow-hidden border border-current/10 ${aspect} ${isDark ? 'bg-industrial-800' : 'bg-concrete-200'}`}>
          <img src={src} alt="" className="absolute inset-0 h-full w-full object-contain" />
          {/* Dimmed/desaturated copy of the same image, revealed only
              outside the active stage's zone via a CSS mask — this is what
              produces the "spotlight" look (active stage untouched, the rest
              darkened) without ever tinting or bordering the artwork. */}
          <img
            src={src}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-contain transition-opacity duration-[220ms] ease-out"
            style={{
              opacity: active !== null ? 1 : 0,
              filter: 'grayscale(0.7) brightness(0.45) contrast(0.95)',
              WebkitMaskImage: spotlightMask,
              maskImage: spotlightMask,
            }}
          />
        </div>
        <StageZonesOverlay stages={stages} zones={zones} active={active} setActive={setActive} onHoverEnter={handleHoverEnter} />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <ImagePlaceholder label={image} aspect={aspect} tone={tone} className="w-full" />
      <PointMarkersOverlay stages={stages} tone={tone} active={active} setActive={setActive} onHoverEnter={handleHoverEnter} />
    </div>
  )
}
