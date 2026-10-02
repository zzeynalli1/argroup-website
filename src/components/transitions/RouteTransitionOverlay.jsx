import { motion } from 'framer-motion'

// Timing per variant — "nav" is the normal route-to-route transition,
// "intro" is the shorter first-load-only version (visitors shouldn't wait
// through the richer internal-nav sequence just to reach the homepage).
// Kept here (not in the provider) because these values only ever drive this
// component's own framer-motion `transition` props; the provider never
// guesses a duration, it waits for
// `onCoverAnimationComplete`/`onOpenAnimationComplete`.
//
// The logo and seam are driven directly by `covered` (true for the whole
// covering+holding span), each with its own delay, rather than waiting for
// a "cover fully complete" signal — that's what lets the logo fade in
// during the tail of the plane entrance instead of only appearing after
// the planes visibly stop, which is what previously made the sequence feel
// like separate clips (stop → logo → stop → open) rather than one gesture.
//
// nav total ≈ enter + RouteTransitionProvider's MIN_HOLD_MS.nav + reveal
//            = 400 + 200 + 400 = 1000ms (target 850-1050ms)
// intro total (design budget) ≈ 220 + 60 + 250 = 530ms — deliberately under
// its ~550-700ms target because first-mount JS/React bootstrap overhead
// (unavoidable, not part of this animation) adds to what the visitor
// actually perceives before the page is usable; measured end-to-end this
// lands in the low 600s, which is where "premium but not delaying access"
// wants to sit.
//
// logoDelay+logoDuration lands at/just past `enter`, so the logo finishes
// appearing right as the planes settle; the remainder of MIN_HOLD_MS is the
// readable/visible pause (nav ≈200ms, intro ≈100ms) before reveal starts.
const DURATIONS = {
  nav: {
    enter: 0.4,
    reveal: 0.4,
    planeBDelay: 0.06,
    planeBFactor: 0.85, // plane B runs a touch faster than A — asymmetric arrival, not a mirrored pair
    seamGrowDelay: 0.21,
    seamGrowDuration: 0.17,
    seamExitDuration: 0.14,
    logoDelay: 0.22,
    logoDuration: 0.18,
    logoExitDuration: 0.13,
  },
  intro: {
    enter: 0.22,
    reveal: 0.25,
    planeBDelay: 0.03,
    planeBFactor: 0.85,
    seamGrowDelay: 0.11,
    seamGrowDuration: 0.09,
    seamExitDuration: 0.09,
    logoDelay: 0.1,
    logoDuration: 0.08,
    logoExitDuration: 0.07,
  },
}

// Logo width at the transition midpoint — clamped so it reads as a
// confident brand signature on desktop without overwhelming small screens.
// Height is intentionally omitted (auto) so the logo's real aspect ratio
// (573:265) is preserved with no distortion.
const LOGO_WIDTH = 'clamp(180px, 18vw, 290px)'

// One shared premium ease for every element — planes, seam and logo all
// move on the same curve so the whole composition reads as one gesture
// rather than several differently-timed clips. Strong-but-fluid
// accelerate/decelerate, no linear/bounce/elastic/overshoot.
const EASE = [0.76, 0, 0.24, 1]

// Two full-viewport shapes, split along one diagonal, that exactly tile the
// screen with no gap or overlap once both are at rest (identity transform).
// The seam is a thin band straddling that same diagonal.
const PLANE_A_CLIP = 'polygon(0% 0%, 60% 0%, 40% 100%, 0% 100%)'
const PLANE_B_CLIP = 'polygon(60% 0%, 100% 0%, 100% 100%, 40% 100%)'
const SEAM_CLIP = 'polygon(58.5% 0%, 61.5% 0%, 41.5% 100%, 38.5% 100%)'

// Off-screen rest transforms the planes animate from/to — plane A arrives
// from the lower-left, plane B from the upper-right, at slightly different
// angles and scales so they read as independent masses, not a symmetric pair.
const PLANE_A_OFFSCREEN = { x: '-42%', y: '26%', rotate: -5, scale: 1.14 }
const PLANE_B_OFFSCREEN = { x: '38%', y: '-30%', rotate: 4, scale: 1.14 }
const PLANE_REST = { x: '0%', y: '0%', rotate: 0, scale: 1 }

/**
 * Full-viewport branded route-transition layer. Purely presentational and
 * driven entirely by props — RouteTransitionProvider owns the state
 * machine and decides when `covered` flips.
 *
 * Visual concept: two graphite architectural planes assemble across the
 * viewport from different directions, a single thin red structural seam
 * marks their meeting line, and the real logo sits directly on the
 * graphite (no card/box) for a brief moment before the planes reconfigure
 * to open onto the destination page.
 */
export default function RouteTransitionOverlay({
  covered,
  instant = false,
  variant = 'nav',
  reducedMotion = false,
  onCoverAnimationComplete,
  onOpenAnimationComplete,
}) {
  const handlePlaneAComplete = () => {
    if (covered) onCoverAnimationComplete?.()
    else onOpenAnimationComplete?.()
  }

  if (reducedMotion) {
    return (
      <div className="fixed inset-0 z-[100]" aria-hidden="true">
        <motion.div
          className="absolute inset-0 bg-industrial-950"
          initial={{ opacity: instant ? 1 : 0 }}
          animate={{ opacity: covered ? 1 : 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          onAnimationComplete={handlePlaneAComplete}
        />
        <motion.img
          src="/logo.png"
          alt=""
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-contain opacity-90"
          style={{ filter: 'brightness(0) invert(1)', width: LOGO_WIDTH, height: 'auto' }}
          initial={{ opacity: instant ? 0.9 : 0 }}
          animate={{ opacity: covered ? 0.9 : 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        />
      </div>
    )
  }

  const d = DURATIONS[variant]
  const enterTransition = { duration: covered ? d.enter : d.reveal, ease: EASE }
  const planeBTransition = {
    duration: (covered ? d.enter : d.reveal) * d.planeBFactor,
    ease: EASE,
    delay: covered ? d.planeBDelay : 0,
  }

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden"
      style={{ transform: 'translateZ(0)' }}
      aria-hidden="true"
    >
      {/* Solid safety backdrop, always a plain full-bleed rectangle (never
          transformed/clipped like the decorative planes below). The planes
          arrive rotated, scaled and translated, which briefly opens
          irregular gaps between them as they travel — without this, those
          gaps would flash the actual old/new page (including its white
          chrome) instead of graphite. This fades in fast, well before the
          decorative planes have moved far, and fades out fast on reveal so
          the destination genuinely shows through the geometric opening
          between the planes rather than staying hidden behind a solid tint.
          Forced onto its own compositor layer (translateZ/will-change) —
          without it, a `backdrop-blur` header beneath can win a compositing
          race against this backdrop for a frame or two, which reads as a
          flash of the header showing through. Kept fast and independent of
          EASE/DURATIONS above — it's a safety mechanism, not part of the
          visible choreography. */}
      <motion.div
        className="absolute inset-0 bg-industrial-950"
        style={{ transform: 'translateZ(0)', willChange: 'opacity' }}
        initial={{ opacity: instant ? 1 : 0 }}
        animate={{ opacity: covered ? 1 : 0 }}
        transition={{ duration: 0.09, ease: 'easeOut' }}
      />

      {/* Plane A — lower-left mass, drives the phase-complete signal since it
          always carries the longer of the two per-direction durations. */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-industrial-900 via-industrial-950 to-industrial-950"
        style={{ clipPath: PLANE_A_CLIP }}
        initial={instant ? PLANE_REST : PLANE_A_OFFSCREEN}
        animate={covered ? PLANE_REST : PLANE_A_OFFSCREEN}
        transition={enterTransition}
        onAnimationComplete={handlePlaneAComplete}
      />

      {/* Plane B — upper-right mass, slightly lighter graphite to read as a
          separate, closer surface; a soft directional drop-shadow (follows
          the clipped silhouette, unlike box-shadow) gives it a touch of
          elevation over plane A. Starts a beat after plane A and moves
          faster, so the two are in motion together for most of the
          entrance rather than one fully stopping before the other starts. */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-tl from-industrial-800 via-industrial-900 to-industrial-900"
        style={{ clipPath: PLANE_B_CLIP, filter: 'drop-shadow(-6px 8px 22px rgba(0,0,0,0.35))' }}
        initial={instant ? PLANE_REST : PLANE_B_OFFSCREEN}
        animate={covered ? PLANE_REST : PLANE_B_OFFSCREEN}
        transition={planeBTransition}
      />

      {/* The one red element: a thin structural seam along the planes'
          meeting line. Driven directly by `covered` (not a "fully covered"
          signal) so it grows in during the tail of assembly, holds through
          the midpoint, and cuts out quickly as the planes reopen. */}
      <motion.div
        className="absolute inset-0 bg-ember-600"
        style={{ clipPath: SEAM_CLIP, transformOrigin: '50% 50%' }}
        initial={{ opacity: 0, scaleY: instant ? 1 : 0.35 }}
        animate={
          covered
            ? {
                opacity: 1,
                scaleY: 1,
                transition: { duration: d.seamGrowDuration, delay: d.seamGrowDelay, ease: EASE },
              }
            : { opacity: 0, scaleY: 0.6, transition: { duration: d.seamExitDuration, ease: EASE } }
        }
      />

      {/* Real logo, actual colors flattened to a white silhouette (the red
          "AR" is baked into the pixels — inverting without first flattening
          to black turns it cyan) and placed directly on the graphite: no
          card, box, circle or glow. Driven by `covered` with its own delay
          (not a separate "content visible" phase) so it fades/scales in
          during the final part of the plane entrance rather than waiting
          for it to fully stop — a subtle 0.97→1 scale, opacity only,
          no bounce/rotate/stretch. Fades out quickly on reveal rather than
          lingering, so the destination shows through while the planes are
          still visibly moving. */}
      <motion.img
        src="/logo.png"
        alt=""
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-contain"
        style={{ filter: 'brightness(0) invert(1)', width: LOGO_WIDTH, height: 'auto' }}
        initial={{ opacity: instant ? 0.92 : 0, scale: instant ? 1 : 0.97 }}
        animate={
          covered
            ? {
                opacity: 0.92,
                scale: 1,
                transition: { duration: d.logoDuration, delay: d.logoDelay, ease: EASE },
              }
            : { opacity: 0, scale: 0.97, transition: { duration: d.logoExitDuration, ease: EASE } }
        }
      />
    </div>
  )
}
