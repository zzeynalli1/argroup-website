import { forwardRef, Suspense, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Billboard, ContactShadows, Environment, Html, OrbitControls } from '@react-three/drei'
import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  HueSaturation,
  N8AO,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { Minus, Plus } from 'lucide-react'
import * as THREE from 'three'
import { useTranslation } from '../../lib/i18n/useTranslation'
import {
  DEFAULT_CAMERA_POSITION,
  DEFAULT_CAMERA_TARGET,
  NARROW_CAMERA_POSITION,
  NARROW_CAMERA_TARGET,
  hotspots,
} from '../../data/hotspots3d'
import { COLORS, groundMaterial } from './buildingMaterials'
import Building from './Building'
import { diag3d } from '../../lib/diag3d'

// Camera moves this much closer/farther per zoom-button click (see `zoomBy`).
const ZOOM_STEP = 0.85

// Coarse, dependency-free "is this a phone/tablet, or a small/touch
// viewport" check — used only to drop the most expensive post-processing
// settings (SSAO quality, Bloom, multisampling, shadow-map size) a notch.
// Deliberately not using GPU-benchmark detection (e.g. drei's
// `useDetectGPU`, which fetches a benchmark table from a CDN) — that adds a
// network dependency and latency for a call this simple heuristic already
// answers well enough. Computed once; screen size/pointer type don't change
// during a session in any way that matters here.
function detectMobile() {
  if (typeof window === 'undefined') return false
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false
  const smallViewport = window.innerWidth < 768
  return coarsePointer || smallViewport
}

// Same one-time-at-mount pattern as `detectMobile` above, but answering a
// different question: is this viewport's own aspect ratio portrait/
// near-square? This governs which of the two default camera framings from
// data/hotspots3d.js applies (see the comment there) — a landscape-vs-mobile
// device check wouldn't be the right signal here, since e.g. a tablet in
// portrait and a resized narrow desktop browser window need the same
// (safer, less zoomed) framing a phone does, while a tablet in landscape
// doesn't.
function detectPortraitAspect() {
  if (typeof window === 'undefined') return false
  return window.innerWidth / window.innerHeight < 1.15
}

// Same one-time-at-mount pattern again, gating the composition-shift from
// Building3DSection.jsx's left text column: true only for viewports wide AND
// landscape-ish enough that shifting the building right via
// `CameraFrameShift` below is safe. Gated on ASPECT RATIO, not raw width —
// how much horizontal FOV a given vertical 45deg FOV yields is an
// aspect-ratio question: at aspect 1.78 (16:9) the WIDE preset has enough
// horizontal margin to absorb the shift with zero cropping, but at aspect
// 1.33 (4:3) the same shift clips the building's own back-right roofline
// corner. 1.5 is the lowest aspect that still clears with real margin; do
// not lower it without re-verifying against the building's bounding box.
function detectWideLayout() {
  if (typeof window === 'undefined') return false
  return window.innerWidth >= 1024 && window.innerWidth / window.innerHeight >= 1.5
}

// Same one-time-at-mount pattern again: does the user's OS/browser have
// "reduce motion" turned on? Gates only the hotspot markers' idle breathing
// pulse below (see `Hotspot`'s `useFrame`) — rest/hover/active tier values
// are untouched either way, so reduced-motion users still see the markers,
// just without the continuous animated pulse on top.
function detectReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

// How far the virtual full frame is inflated beyond the canvas's own width
// before cropping back down to it (see `CameraFrameShift`) — tuned against
// 1.5, the lowest gated aspect ratio (see `detectWideLayout` above): 1.2
// leaves real margin at that worst-case aspect. Do not raise this without
// re-verifying against the building's bounding box — cropping starts around
// 1.26 at aspect 1.5.
const VIEW_SHIFT_FACTOR = 1.2

// Dusk gradient, warmed slightly at the horizon (BOTTOM) — a believable dusk
// sky transitions from cool blue-grey overhead to a warm glow near the
// horizon, which also gives the building's silhouette a warmer edge to
// separate against instead of a flat cool backdrop everywhere.
const BACKDROP_TOP = '#3D4451'
const BACKDROP_BOTTOM = '#5C4A31'
// Bridges the warm backdrop-bottom glow and the warm-graphite ground paving
// tone (see `groundMaterial` in buildingMaterials.js) so there's no visible
// seam at the horizon.
const FOG_COLOR = '#3B352E'

// No procedural skyline geometry is drawn here by design (per CLAUDE.md:
// no fabricated content) — only an OPTIONAL real photographic panorama,
// composited into the same small canvas texture as the vertical sky
// gradient below (zero extra draw calls/geometry), loaded manually (not via
// Suspense) so a missing asset just falls back to the plain gradient with no
// error/placeholder. See `PANORAMA_URL` and `GradientBackdrop` below.
const BACKDROP_CANVAS_WIDTH = 512
const BACKDROP_CANVAS_HEIGHT = 256

// Reserved path for a real dusk/blue-hour Baku skyline photo (not supplied
// yet). Deliberately NOT filled with any procedural/placeholder image per
// this project's content rules (CLAUDE.md: don't fabricate content that
// isn't real) — until a real file exists at this path, `GradientBackdrop`
// silently renders the plain gradient only.
const PANORAMA_URL = '/images/3d/city-panorama.webp'
// Horizon baseline as a fraction of canvas height. `scene.background`'s
// screen-locked stretch means canvas Y maps 1:1 to SCREEN Y, not to the 3D
// ground plane's own far edge — at this scene's camera angle the ground
// plane visually recedes to a horizon at roughly 35-40% down the actual
// viewport, well above the canvas's vertical midpoint.
const PANORAMA_HORIZON_FRAC = 0.4
// Where the source photo's own horizon sits, as a fraction of the SOURCE
// IMAGE's own height (not the canvas) — this photo's sky occupies roughly
// its top 55-60%, so its horizon/city line sits at roughly 0.58 down its
// own height. Used to vertically position the "cover" crop so the photo's
// real horizon lands on PANORAMA_HORIZON_FRAC above, rather than naively
// centering the crop (which would put an arbitrary slice of sky/city there).
const SOURCE_HORIZON_FRAC = 0.58
// How far below the horizon line the composited region (and its bottom
// feather) extends, as a fraction of canvas height — small on purpose: only
// enough to show a little city/foreground below the skyline before
// dissolving into the fog/ground tone, not a tall band.
const PANORAMA_BELOW_HORIZON_FRAC = 0.16
// Height of the top feather zone (photo dissolving into the sky gradient),
// as a fraction of canvas height — sized to fully cover the portion of the
// photo that sits above the visible skyline so there's no seam, while still
// leaving the skyline itself (just above the horizon) unfeathered/crisp.
const PANORAMA_TOP_FEATHER_FRAC = 0.22
// Compositing knobs that push the loaded photo toward "soft/hazy/subordinate
// to the building" regardless of the real photo's own grading. Alpha < 1
// lets the sky gradient's own dusk tone show through/blend; filter
// desaturates, lowers contrast, and dims.
const PANORAMA_ALPHA = 0.85
const PANORAMA_FILTER = 'saturate(80%) contrast(90%) brightness(92%)'

// Vertical sky gradient — the only thing painted when no panorama photo is
// available (and always painted first, underneath the panorama band, when
// one is).
function paintSkyGradient(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, BACKDROP_TOP)
  gradient.addColorStop(1, BACKDROP_BOTTOM)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

// Composites the loaded panorama photo as a continuous environment layer,
// not a hard-edged band. Draws the photo across a tall region spanning from
// the canvas top down through a margin below the horizon line, "cover"-fit
// (never stretched) and vertically positioned so the source photo's OWN
// horizon (SOURCE_HORIZON_FRAC down its own height) lands on
// PANORAMA_HORIZON_FRAC of the canvas — same on-screen horizon placement as
// before. Both edges of the drawn region are then feathered with soft alpha
// gradients (dissolving to BACKDROP_TOP at the top, to FOG_COLOR at the
// bottom) instead of a hard ctx.clip() rectangle, so there's no visible
// seam at either edge. Canvas X still maps 1:1 to screen-space left-right
// so the left-dark/right-bright readability ramp stays a pure 2D
// compositing question.
function paintPanoramaBand(ctx, image, width, height) {
  const horizonY = height * PANORAMA_HORIZON_FRAC
  const regionBottom = horizonY + height * PANORAMA_BELOW_HORIZON_FRAC

  // "Cover" fit against both the full canvas width and the tall region
  // height — fills both regardless of the source photo's own aspect ratio,
  // cropping overflow rather than distorting it.
  const scale = Math.max(width / image.width, regionBottom / image.height)
  const drawW = image.width * scale
  const drawH = image.height * scale
  const dx = (width - drawW) / 2
  // Align the source photo's own horizon row to this scene's horizon line,
  // rather than naively centering the crop.
  const dy = horizonY - image.height * SOURCE_HORIZON_FRAC * scale

  ctx.save()
  ctx.globalAlpha = PANORAMA_ALPHA
  ctx.filter = PANORAMA_FILTER
  ctx.drawImage(image, dx, dy, drawW, drawH)
  ctx.filter = 'none'
  ctx.globalAlpha = 1

  // Top feather: dissolve the photo's own top edge into the sky gradient
  // already painted underneath (same color at the y=0 stop), instead of
  // cutting off at a hard edge.
  const topFeatherEnd = height * PANORAMA_TOP_FEATHER_FRAC
  const topFeather = ctx.createLinearGradient(0, 0, 0, topFeatherEnd)
  topFeather.addColorStop(0, BACKDROP_TOP)
  topFeather.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = topFeather
  ctx.fillRect(0, 0, width, topFeatherEnd)

  // Bottom feather: dissolve the photo's lower edge toward the fog/ground
  // tone starting right at the horizon line (keeping the skyline silhouette
  // itself crisp/unfeathered), rather than cutting off.
  const bottomFeather = ctx.createLinearGradient(0, horizonY, 0, regionBottom)
  bottomFeather.addColorStop(0, 'rgba(0, 0, 0, 0)')
  bottomFeather.addColorStop(1, FOG_COLOR)
  ctx.fillStyle = bottomFeather
  ctx.fillRect(0, horizonY, width, regionBottom - horizonY)

  // Left-dark -> right-bright readability ramp, reapplied across the full
  // composited region (canvas top through the feathered horizon margin) —
  // darkest directly behind the left-side heading column, clearing by
  // roughly center-right where the building sits.
  const ramp = ctx.createLinearGradient(0, 0, width, 0)
  ramp.addColorStop(0, 'rgba(8, 7, 6, 0.35)')
  ramp.addColorStop(0.22, 'rgba(8, 7, 6, 0.14)')
  ramp.addColorStop(0.4, 'rgba(8, 7, 6, 0)')
  ctx.fillStyle = ramp
  ctx.fillRect(0, 0, width, regionBottom)

  ctx.restore()
}

function GradientBackdrop() {
  const { scene } = useThree()

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = BACKDROP_CANVAS_WIDTH
    canvas.height = BACKDROP_CANVAS_HEIGHT
    const ctx = canvas.getContext('2d')
    paintSkyGradient(ctx, canvas.width, canvas.height)

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])

  useEffect(() => {
    // three.js scene is an imperative escape hatch (the standard R3F pattern
    // for background/fog), not React state — safe to mutate directly.
    /* eslint-disable react-hooks/immutability */
    scene.background = texture
    return () => {
      scene.background = null
    }
    /* eslint-enable react-hooks/immutability */
  }, [scene, texture])

  // `texture` is a GPU-backed CanvasTexture created once above (empty-deps
  // memo) — R3F never takes ownership of it for auto-dispose since it's
  // assigned to `scene.background` imperatively rather than passed as a JSX
  // prop/child. Without this, navigating away from Home (unmounting this
  // whole Canvas) left the compiled texture resident with nothing left
  // referencing it. Safe as a plain unmount-only cleanup: `texture` is
  // referentially stable for this component's entire lifetime.
  useEffect(() => () => texture.dispose(), [texture])

  // Optional real panorama photo, loaded manually via `THREE.TextureLoader`
  // rather than Suspense/`useTexture` — deliberately so a missing/404'd
  // asset resolves through the loader's own `onError` callback and simply
  // leaves the plain gradient already painted above in place, instead of
  // throwing into (and needing) a Suspense/error-boundary fallback path.
  // Nothing is drawn/attempted here today (the asset doesn't exist yet) —
  // this is the "ready the moment it's added" architecture the task calls
  // for.
  useEffect(() => {
    let cancelled = false
    const loader = new THREE.TextureLoader()
    loader.load(
      PANORAMA_URL,
      (loaded) => {
        if (cancelled) return
        // `texture.image` is the same canvas created in the `useMemo` above
        // (a `THREE.CanvasTexture`'s `.image` IS its backing canvas) —
        // reading it back here (an effect, not render) avoids needing a
        // parallel ref just to reach the same object.
        const canvas = texture.image
        const ctx = canvas.getContext('2d')
        paintSkyGradient(ctx, canvas.width, canvas.height)
        paintPanoramaBand(ctx, loaded.image, canvas.width, canvas.height)
        texture.needsUpdate = true
        // We only needed the decoded <img> to draw into our own canvas
        // texture above — this loader-created Texture itself is never
        // assigned to any material/map, so free it immediately rather than
        // leaving an unused Texture instance resident.
        loaded.dispose()
      },
      undefined,
      () => {
        // Expected right now: no real photo has been supplied yet. Not a
        // real error condition for an explicitly-optional asset — no
        // console noise, just keep the plain gradient already in place.
      }
    )
    return () => {
      cancelled = true
    }
  }, [texture])

  return null
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow material={groundMaterial} dispose={null}>
      <planeGeometry args={[24, 24]} />
    </mesh>
  )
}

// --- Hotspot marker visual constants ---
// `MARKER_REFERENCE_DISTANCE` is roughly the WIDE default resting distance
// (see hotspots3d.js) rather than the much shorter post-select distance or
// the much longer NARROW resting distance: the marker's un-scaled (1x) size
// looks right at that middle distance, and the clamp below scales it up when
// the camera is farther away (so it doesn't shrink to invisibility at the
// NARROW resting shot) and down when closer (so it doesn't balloon once the
// camera flies in on select) — the same "keep roughly constant screen size"
// job `Html`'s `distanceFactor` already does for the label, applied here to
// the mesh-based core/rings, which don't get that for free. Keep this in
// sync with hotspots3d.js's WIDE resting distance.
const MARKER_REFERENCE_DISTANCE = 9.5
const MARKER_MIN_DIST_SCALE = 0.68
const MARKER_MAX_DIST_SCALE = 1.55
// Slow breathing (idle-only "alive/interactive" cue, independent of the Html
// label's CSS `animate-ping`, which only ever fires on hover/active) —
// period = 2*PI / speed ≈ 3.31s. Breathing is split across independently
// refed elements (core emissive AND scale, main ring scale, glow opacity AND
// scale — see the per-frame block below) instead of one shared uniform
// scale, so the ring/glow "halo" can visibly expand more than the subtler
// core pulse. Each amount below is applied UNIDIRECTIONALLY on top of that
// element's own rest-tier value (0 -> +amount, via a (sin+1)/2 pulse, never
// negative) — deliberate: breathing only ever ADDS emphasis on top of the
// already-visible rest state and never dips below it, which is what keeps
// the marker "never disappearing" without needing a separate opacity floor
// constant on the ring/rim/glow.
const MARKER_BREATHE_SPEED = 1.9
const MARKER_CORE_BREATHE_AMOUNT = 0.2
// Core scale pulse (~1.00 -> 1.10 -> 1.00) — applied to the core mesh's own
// scale via `coreMeshRef`, separate from the emissive brightening above and
// from the parent `visualRef` group's distance/hover/active scale, so it
// doesn't fight either.
const MARKER_CORE_SCALE_BREATHE_AMOUNT = 0.1
// Core OPACITY pulse (~0.78 -> 1.00 -> 0.78) — a second, independent
// brightness channel on top of the emissive+scale pulse above, since
// emissive intensity alone reads as barely perceptible at the marker's
// actual ~11-22px on-screen size at the default resting camera distance.
// Safe to make transparent: `depthTest`/`depthWrite` are already both false
// on this mesh (see below), so there's no z-fighting/sorting concern.
const MARKER_CORE_OPACITY_BREATHE_AMOUNT = 0.22
// Main ring scale pulse — the halo visibly expands (~1.00 -> ~1.35 -> 1.00),
// one of the two primary visibility channels (with the glow scale below).
const MARKER_RING_BREATHE_AMOUNT = 0.35
const MARKER_GLOW_BREATHE_AMOUNT = 0.28
// Glow/halo billboard plane's own scale pulse (paired with the opacity pulse
// above) — at this marker's real on-screen scale, a LARGER soft glow blob is
// the single most perceptible lever available: a few-pixel change on the
// small hard-edged ring/core is easy to miss, but a visibly swelling,
// brightening soft halo reads clearly even at a glance. See `glowBaseScale`
// below for the blob's own rest/emphasized base size this multiplies.
const MARKER_GLOW_SCALE_BREATHE_AMOUNT = 0.6
// How fast the breathing pulse's strength eases to 0 on hover/active and
// back to 1 once neither — an exponential `THREE.MathUtils.damp` rate
// (per-second), not a linear lerp, so it settles smoothly rather than
// snapping mid-cycle. At 6/s the pulse is ~95% settled within ~0.5s of a
// hover/select/deselect, which reads as "breathing pauses right away"
// without an abrupt cut.
const MARKER_BREATHE_DAMPING = 6
const MARKER_CORE_RADIUS = 0.05
const MARKER_RING_INNER = 0.078
const MARKER_RING_OUTER = 0.094
// Thin off-white contrast rim just outside the main ember ring — keeps the
// marker legible against both light concrete AND dark curtain-wall glazing,
// not just one of the two (a pure red ring can blend into the charcoal
// accent-panel bays at a glance).
const MARKER_RIM_INNER = 0.096
const MARKER_RIM_OUTER = 0.107
const MARKER_RIM_COLOR = '#F3EFE6'
// The rim also breathes its own scale + opacity: the glow blob is
// additively blended (`THREE.AdditiveBlending`), which contributes much less
// visible brightening against a light concrete background than a dark
// glazing one — the ring/core pulse alone doesn't compensate since they're
// small and hard-edged. The off-white rim reads as a real contrast delta
// against both backgrounds, so it carries the "obviously animating" signal
// reliably regardless of what's behind a given marker.
const MARKER_RIM_SCALE_BREATHE_AMOUNT = 0.5
const MARKER_RIM_OPACITY_BREATHE_AMOUNT = 0.35

// Shared radial-gradient glow-sprite texture — one small canvas texture
// reused across all 10 markers' Billboard glow planes (same "one texture,
// many materials" economy `buildingMaterials.js` already uses for the AR
// Group sign), not a per-marker texture.
function createMarkerGlowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255,255,255,0.9)')
  gradient.addColorStop(0.45, 'rgba(255,255,255,0.35)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  return new THREE.CanvasTexture(canvas)
}
const markerGlowTexture = createMarkerGlowTexture()

function Hotspot({ hotspot, isActive, isHovered, anyActive, onHover, onSelect, prefersReducedMotion }) {
  const { t } = useTranslation('home')
  const emphasized = isActive || isHovered
  // A sibling hotspot is active — this marker dims, but hover still
  // overrides the dim so it stays fully readable once the pointer reaches it.
  const dimmed = anyActive && !emphasized
  const visualRef = useRef(null)
  const coreMaterialRef = useRef(null)
  const coreMeshRef = useRef(null)
  const ringMeshRef = useRef(null)
  const glowMaterialRef = useRef(null)
  const glowMeshRef = useRef(null)
  const rimMeshRef = useRef(null)
  const rimMaterialRef = useRef(null)
  // Smoothed 0-1 "how much idle breathing is currently applied" — damped
  // toward 0 on hover/active and back to 1 at rest, in `useFrame` below.
  const pulseStrengthRef = useRef(1)
  const worldPos = useMemo(() => new THREE.Vector3(...hotspot.position), [hotspot.position])
  // Desyncs the markers' breathing phase using the golden angle (~137.5deg,
  // 2.399963 rad) per id — the standard trick for spreading N points/phases
  // as evenly as possible around a cycle with a single deterministic
  // multiply (phyllotaxis-style), still purely a function of `hotspot.id`
  // (stable across renders/hot-reloads). Replaces the previous
  // `(id % 7) * 0.9`, which silently gave identical phases to every pair of
  // hotspots 7 ids apart (with only 10 markers today, ids 1&8, 2&9, 3&10
  // landed on the exact same phase) — a real lockstep bug the modulo choice
  // didn't intend. The `% (2*PI)` wrap just keeps the stored value small;
  // `Math.sin` doesn't need it.
  const breathePhase = useMemo(() => (hotspot.id * 2.399963) % (Math.PI * 2), [hotspot.id])

  // Visual tiers (rest / hover / active / dimmed-by-a-sibling) — plain
  // values recomputed on render, not refs: they only change on hover/select
  // (rare, user-driven), unlike the per-frame TRANSFORM below, which is
  // mutated imperatively via `visualRef` in `useFrame` specifically so the
  // constant breathing/distance-compensation animation never triggers a
  // React re-render.
  // Core rest-tier emissive baseline raised so the red dot itself never
  // reads as faint/absent. The core mesh also now carries a real, literal
  // `opacity` (see `coreOpacity`/`MARKER_CORE_OPACITY_BREATHE_AMOUNT` below)
  // as a second, independent brightness channel on top of the emissive
  // pulse — added because emissive intensity alone proved too subtle to
  // read at this marker's small (~11-22px) on-screen size at the default
  // camera distance. It renders depth-tested-off either way, so going
  // transparent introduced no sorting concerns.
  let coreEmissive = isActive ? 1.15 : isHovered ? 0.95 : 0.74
  // Core opacity tier — new channel (see `MARKER_CORE_OPACITY_BREATHE_AMOUNT`
  // above). Rest tier is the literal 0.78 floor the breathing pulse adds up
  // from to reach 1.00 at peak; hover/active sit at/near 1.00 already since
  // breathing pauses (damps to 0) the instant a marker is emphasized, so
  // those tiers read as a stopped, fully "solid" state rather than still
  // visibly pulsing.
  let coreOpacity = isActive ? 1 : isHovered ? 0.94 : 0.78
  let ringOpacity = isActive ? 0.95 : isHovered ? 0.85 : 0.62
  let rimOpacity = isActive ? 0.9 : isHovered ? 0.7 : 0.5
  let glowOpacity = isActive ? 0.62 : isHovered ? 0.55 : 0.4
  let tierScale = isActive ? 1.32 : isHovered ? 1.18 : 1
  // Glow blob's own rest size, raised (0.22 -> 0.3 rest, 0.32 -> 0.42
  // emphasized) alongside the scale-breathe amount above — a bigger base
  // blob makes the same proportional pulse a bigger absolute pixel change.
  const glowBaseScale = emphasized ? 0.42 : 0.3
  if (dimmed) {
    coreEmissive = 0.38
    coreOpacity = 0.5
    ringOpacity = 0.25
    rimOpacity = 0.2
    glowOpacity = 0.14
    tierScale = 0.82
  }

  useFrame((state, delta) => {
    const group = visualRef.current
    if (!group) return
    const distance = state.camera.position.distanceTo(worldPos)
    const distScale = THREE.MathUtils.clamp(
      distance / MARKER_REFERENCE_DISTANCE,
      MARKER_MIN_DIST_SCALE,
      MARKER_MAX_DIST_SCALE
    )
    // Overall marker size is distance-compensation + hover/active tier only.
    // Breathing is applied per-element below (core emissive / ring scale /
    // glow opacity) instead of one shared group-scale pulse, so the ring can
    // expand more than the core.
    group.scale.setScalar(distScale * tierScale)

    // Idle breathing pauses (eases to 0) the moment this marker is hovered
    // or active, and eases back to full strength once neither — so hover/
    // active read as a deliberate, stable "engaged" state rather than
    // breathing continuing to modulate underneath the stronger hover/active
    // tier values.
    const pulseTarget = emphasized ? 0 : 1
    pulseStrengthRef.current = THREE.MathUtils.damp(
      pulseStrengthRef.current,
      pulseTarget,
      MARKER_BREATHE_DAMPING,
      delta
    )
    // (sin+1)/2 -> 0..1, scaled by the eased pulse strength -> unidirectional
    // 0..1 "how much extra emphasis right now", never negative, so breathing
    // only ever adds on top of the rest-tier baseline and never dips below
    // it (see the constants' own comment on why that's the "never
    // disappears" guarantee here rather than a separate opacity floor).
    // `prefersReducedMotion` forces this to a flat 0 — markers render at
    // their steady rest/hover/active tier with no animated contribution at
    // all, rather than hiding them or altering the tier values themselves.
    const pulse01 = prefersReducedMotion
      ? 0
      : (Math.sin(state.clock.elapsedTime * MARKER_BREATHE_SPEED + breathePhase) * 0.5 + 0.5) *
        pulseStrengthRef.current

    if (coreMaterialRef.current) {
      coreMaterialRef.current.emissiveIntensity = coreEmissive + MARKER_CORE_BREATHE_AMOUNT * pulse01
      coreMaterialRef.current.opacity = coreOpacity + MARKER_CORE_OPACITY_BREATHE_AMOUNT * pulse01
    }
    if (coreMeshRef.current) {
      coreMeshRef.current.scale.setScalar(1 + MARKER_CORE_SCALE_BREATHE_AMOUNT * pulse01)
    }
    if (ringMeshRef.current) {
      ringMeshRef.current.scale.setScalar(1 + MARKER_RING_BREATHE_AMOUNT * pulse01)
    }
    if (glowMaterialRef.current) {
      glowMaterialRef.current.opacity = glowOpacity + MARKER_GLOW_BREATHE_AMOUNT * pulse01
    }
    if (glowMeshRef.current) {
      glowMeshRef.current.scale.setScalar(glowBaseScale * (1 + MARKER_GLOW_SCALE_BREATHE_AMOUNT * pulse01))
    }
    // Off-white rim breathing (see the constants' own comment above on why
    // this is the reliable-on-any-background signal) — own scale ref
    // (parallel to the ring) plus an opacity channel via its own material
    // ref, same unidirectional add-on-top-of-rest-tier pattern as every
    // other channel here.
    if (rimMeshRef.current) {
      rimMeshRef.current.scale.setScalar(1 + MARKER_RIM_SCALE_BREATHE_AMOUNT * pulse01)
    }
    if (rimMaterialRef.current) {
      rimMaterialRef.current.opacity = rimOpacity + MARKER_RIM_OPACITY_BREATHE_AMOUNT * pulse01
    }
  })

  return (
    <group position={hotspot.position}>
      {/* Larger invisible sphere carries the pointer handlers — the visible
          marker below is too small a raycast target to hit/tap reliably on
          its own. `visible=false` would skip it during raycasting too, so it
          stays "visible" with a fully transparent, non-depth-writing
          material instead. Deliberately NOT part of the scaled `visualRef`
          group below — the tap/click target stays a fixed, generous size
          regardless of the marker's own distance-compensated visual scale. */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation()
          onHover(hotspot.key)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          onHover(null)
          document.body.style.cursor = 'auto'
        }}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(hotspot)
        }}
      >
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Visual marker group — core + rings + glow, scaled together every
          frame by the distance-compensation + hover/active-tier logic above
          (idle breathing is applied per-element instead — core emissive,
          main ring scale, glow opacity — not to this shared group scale).

          Depth-test is deliberately OFF on every mesh here (plus a high,
          fixed `renderOrder`) — the building is a closed volume by default
          (ExteriorShell's walls only open a hotspot's own reveal panel once
          THAT hotspot is active), so most markers sit at their real system's
          location INSIDE the solid wall mass and would otherwise be fully
          hidden behind opaque geometry at rest. Rendering markers as an
          always-on-top UI layer (the same convention interactive BIM/
          product-tour viewers use for hotspot pins) avoids repositioning
          every marker to an exterior-only point, which would pull several of
          them away from the real system they indicate. `renderOrder` values
          are staggered (glow < core < rings) so the three transparent layers
          of the SAME marker composite correctly against each other once
          depth-testing between them is gone; they still don't depth-test
          against each other's geometry as a group. */}
      <group ref={visualRef}>
        {/* Soft local glow: a camera-facing (Billboard) additive-blended
            plane using the shared radial-gradient texture above, kept small
            and low-opacity on purpose — verified against Bloom's 0.92
            luminance threshold (Hero3DScene's EffectComposer below): at
            these opacities/sizes this never approaches that threshold, so
            it reads as a soft red glow, never a bloom-inflated ball. No
            per-marker point light (10 simultaneous lights would be a real,
            avoidable cost for a decorative effect). */}
        <Billboard renderOrder={997}>
          {/* No declarative `scale` prop here — this mesh's scale is 100%
              useFrame-owned (see `glowMeshRef.current.scale.setScalar(...)`
              below), same as the core/ring meshes. A declarative scale prop
              here would fight the imperative value, since this component
              re-renders whenever ANY sibling hotspot's hover/active state
              changes (lifted state in the parent). */}
          <mesh ref={glowMeshRef}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              ref={glowMaterialRef}
              map={markerGlowTexture}
              color={COLORS.ember600}
              transparent
              opacity={glowOpacity}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              depthTest={false}
            />
          </mesh>
        </Billboard>

        {/* Solid AR-red core — baseline-visible at rest, strengthens on
            hover/active, dims (never disappears) when a sibling hotspot is
            selected. */}
        <mesh ref={coreMeshRef} renderOrder={998}>
          <sphereGeometry args={[MARKER_CORE_RADIUS, 16, 16]} />
          <meshStandardMaterial
            ref={coreMaterialRef}
            color={COLORS.ember600}
            emissive={COLORS.ember600}
            emissiveIntensity={coreEmissive}
            transparent
            opacity={coreOpacity}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>

        {/* Main ember ring — own `ringMeshRef` scale carries the ring-specific
            breathing expansion (see useFrame above), separate from the
            group's own distance/tier scale. */}
        <mesh ref={ringMeshRef} rotation={[Math.PI / 2, 0, 0]} renderOrder={999}>
          <ringGeometry args={[MARKER_RING_INNER, MARKER_RING_OUTER, 24]} />
          <meshBasicMaterial
            color={COLORS.ember600}
            transparent
            opacity={ringOpacity}
            side={THREE.DoubleSide}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>

        {/* Thin contrasting outer rim (see the constant's own comment
            above) — now breathes its own scale + opacity (own `rimMeshRef`/
            `rimMaterialRef`, set imperatively in useFrame above), the same
            pattern as the ring/glow, since off-white reads as a reliable
            contrast delta against both light concrete and dark glazing
            (unlike the additively-blended red glow, which is naturally much
            weaker against a light background). */}
        <mesh ref={rimMeshRef} rotation={[Math.PI / 2, 0, 0]} renderOrder={1000}>
          <ringGeometry args={[MARKER_RIM_INNER, MARKER_RIM_OUTER, 24]} />
          <meshBasicMaterial
            ref={rimMaterialRef}
            color={MARKER_RIM_COLOR}
            transparent
            opacity={rimOpacity}
            side={THREE.DoubleSide}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
      </group>

      <Html distanceFactor={8} style={{ pointerEvents: 'none' }} zIndexRange={[10, 0]}>
        <div className="relative flex h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
          {emphasized && (
            <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-ember-600 opacity-60" />
          )}
          {isHovered && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap rounded border border-white/10 bg-industrial-950/90 px-2 py-1 text-xs text-base-50">
              {t(`building3d.hotspots.${hotspot.key}.name`)}
            </span>
          )}
        </div>
      </Html>
    </group>
  )
}

// Shifts the rendered building to the right within the canvas via
// `PerspectiveCamera.setViewOffset` (an asymmetric-frustum "lens shift") —
// crops the frame's own already-centered composition down to a rightward
// sub-window rather than moving the camera sideways, so there's zero added
// perspective distortion. This is fully orthogonal to
// `CameraRig`'s position/target lerping and `zoomBy`'s position-along-ray
// zoom above/below — both only ever touch `camera.position`/`controls.target`,
// never the projection matrix, so the shift stays applied through every
// hotspot fly-to and zoom-button click without extra wiring.
// Re-applied whenever the canvas's own pixel size changes (`useThree`'s
// `size`, reactive — unlike the one-time-at-mount `detectWideLayout` gate
// above) so the offset numbers, which are in canvas-pixel units, stay
// correct across resizes; cleared (not just left stale) when `active` is
// false so the NARROW/portrait/small-desktop fallback renders the plain
// centered composition.
function CameraFrameShift({ active }) {
  const { camera, size } = useThree()

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return undefined
    if (!active || size.width === 0 || size.height === 0) {
      camera.clearViewOffset()
      camera.updateProjectionMatrix()
      return undefined
    }

    camera.setViewOffset(size.width * VIEW_SHIFT_FACTOR, size.height, 0, 0, size.width, size.height)
    camera.updateProjectionMatrix()

    return () => {
      camera.clearViewOffset()
      camera.updateProjectionMatrix()
    }
  }, [camera, size, active])

  return null
}

// The directional light's shadow map is also entirely static — same
// reasoning as ContactShadows' `frames={1}` above: the light and the
// building never move (only the camera orbits, and a shadow map is
// rendered from the LIGHT's perspective, independent of the viewing
// camera; hotspot dim/highlight only ever changes material opacity, never
// a transform, and a transparent mesh still casts its normal shadow
// silhouette in three.js's default shadow mapping). `autoUpdate` defaults
// to true, re-rendering the shadow depth pass (2048px on desktop) every
// single frame forever for a result that never changes after the first
// one. Setting `needsUpdate` alongside `autoUpdate = false` renders it
// exactly once more, then three.js itself clears `needsUpdate` back to
// false — no RAF/timer needed.
function StaticShadowMap() {
  const { gl } = useThree()
  useEffect(() => {
    // The renderer is an imperative escape hatch (same convention as
    // GradientBackdrop's `scene.background` above) — safe to mutate
    // directly.
    /* eslint-disable react-hooks/immutability */
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
    /* eslint-enable react-hooks/immutability */
  }, [gl])
  return null
}

// Fires `onReady` once the base scene has actually been compiled
// (`gl.compileAsync`) AND R3F has rendered one real frame with that
// compiled scene — distinct from Canvas's own `onCreated` below, which only
// means the WebGL context/THREE.Scene object exist, well before anything
// has necessarily been drawn or any shader linked. Building3DSection holds
// the route-transition overlay's reveal open (via `markLoading`/
// `markLoaded`) until THIS fires, so the scene's own first paint never
// lands before its ~40 shader programs (scene materials + shadow depth
// variants) are actually usable.
//
// Switched from the old `gl.compile` (synchronous: kicks off
// compile/link for every material AND blocks the main thread waiting for
// each one, since nothing yields back to the event loop) to
// `gl.compileAsync`, which submits the exact same compile/link work but
// polls each program's `KHR_parallel_shader_compile` completion status
// (non-blocking — a `setTimeout`-spaced poll, not a synchronous GPU-driver
// stall) instead of forcing the renderer to wait on it inline. The main
// thread stays free to paint/scroll/respond while the GPU driver compiles
// in the background; `onReady` (and therefore the placeholder-hide) now
// waits for that promise, not just for `gl.compile`'s call to return.
//
// `gl.compileAsync(scene, camera)` has to run from a mounted child's effect
// rather than Canvas's own `onCreated` prop: by the time `onCreated` fires,
// this Canvas's OWN JSX children (Building/Ground/lights/Hotspots below)
// aren't guaranteed to have committed into the real THREE.Scene yet, so
// compiling there risks compiling an empty scene (a no-op). A child
// component's `useEffect` always runs after that commit.
//
// `onPostFxReady` (the heavier EffectComposer/ContactShadows pipeline —
// see `postFxReady` below) is anchored to this SAME first-real-frame tick,
// not to raw component mount — anchoring it to mount raced the async
// compile above, which can itself push the first real frame noticeably
// later than mount on a cold GPU/driver, letting the two "deferred,
// expensive" compiles land back-to-back instead of in sequence.
function ReadySignal({ onReady, onPostFxReady }) {
  const { gl, scene, camera, invalidate } = useThree()
  const compileStartedRef = useRef(false)
  const compileDoneRef = useRef(false)
  const firstFrameLoggedRef = useRef(false)
  const postFxRafsRef = useRef({ raf1: 0, raf2: 0 })

  useEffect(() => {
    if (compileStartedRef.current) return
    compileStartedRef.current = true
    diag3d('3D shader precompile (gl.compileAsync) starting')
    gl.compileAsync(scene, camera).then(() => {
      diag3d('3D shader precompile (gl.compileAsync) done')
      compileDoneRef.current = true
      // `frameloop="demand"` won't render the frame that notices
      // `compileDoneRef` flipped on its own — this promise resolves outside
      // R3F's render loop, so it has to explicitly ask for the next frame.
      invalidate()
    })
  }, [gl, scene, camera, invalidate])

  useEffect(
    () => () => {
      cancelAnimationFrame(postFxRafsRef.current.raf1)
      cancelAnimationFrame(postFxRafsRef.current.raf2)
    },
    []
  )

  useFrame(() => {
    // Wait for the async compile above to actually resolve before treating
    // any rendered frame as "ready" — the compile's own `.then()` is what
    // calls `invalidate()` to request the frame that will see this true,
    // so no polling/re-invalidating is needed here while it's still false.
    if (!compileDoneRef.current) return
    if (firstFrameLoggedRef.current) return
    firstFrameLoggedRef.current = true
    diag3d('3D first real frame rendered (building/lights/hotspots on screen)')
    onReady?.()

    postFxRafsRef.current.raf1 = requestAnimationFrame(() => {
      postFxRafsRef.current.raf2 = requestAnimationFrame(() => {
        diag3d('3D post-processing pipeline mounting (shader compile starts now)')
        onPostFxReady?.()
      })
    })
  })

  return null
}

// One-shot diagnostic: logs `renderer.info.programs.length` — the real,
// final count of unique compiled WebGLPrograms (scene materials + their
// shadow-depth variants + the post-processing pipeline once mounted) — two
// frames after `postFxReady` flips true, so EffectComposer/ContactShadows
// have actually rendered at least once and their own on-first-use shaders
// are counted too, not just the base scene's. Used to compare the
// before/after program count for the gl.compileAsync + checkShaderErrors +
// material-dedup changes in this file/buildingMaterials.js — strip once
// that comparison is done, same as the rest of the `diag3d` call sites.
function ProgramCountLogger({ postFxReady }) {
  const { gl } = useThree()
  const loggedRef = useRef(false)
  const rafsRef = useRef({ raf1: 0, raf2: 0 })

  useEffect(() => {
    if (!postFxReady || loggedRef.current) return undefined
    loggedRef.current = true
    rafsRef.current.raf1 = requestAnimationFrame(() => {
      rafsRef.current.raf2 = requestAnimationFrame(() => {
        diag3d('3D renderer.info.programs.length', gl.info.programs?.length ?? 0)
      })
    })
    return () => {
      cancelAnimationFrame(rafsRef.current.raf1)
      cancelAnimationFrame(rafsRef.current.raf2)
    }
  }, [postFxReady, gl])

  return null
}

// Also doubles as this scene's one "give the outer, non-R3F component scope
// access to `invalidate`" bridge (see `invalidateRef` below) — under
// `frameloop="demand"`, nothing renders again on its own once the camera
// stops moving/settling, so `selectHotspot`/`resetCamera`/`zoomBy` (plain
// closures in `Hero3DScene`, defined OUTSIDE the Canvas/R3F tree, which is
// the only place `useThree` can be called) need a way to kick off the very
// first render of a new camera transition. `invalidateRef.current` is set
// here once R3F's own `invalidate` is available and read back there.
function CameraRig({ orbitRef, desiredPosRef, desiredTargetRef, transitioningRef, invalidateRef }) {
  const { invalidate } = useThree()

  useEffect(() => {
    invalidateRef.current = invalidate
  }, [invalidate, invalidateRef])

  useEffect(() => {
    const controls = orbitRef.current
    if (!controls) return undefined

    // OrbitControls unconditionally sets touch-action:none on its domElement
    // when it connects, which blocks native page scroll on touch devices
    // entirely (independent of enableZoom/enablePan). Override it so a
    // one-finger vertical swipe still scrolls the page.
    controls.domElement.style.touchAction = 'pan-y'

    const stopTransition = () => {
      transitioningRef.current = false
    }
    controls.addEventListener('start', stopTransition)
    return () => controls.removeEventListener('start', stopTransition)
  }, [orbitRef, transitioningRef])

  useFrame((state, delta) => {
    if (!transitioningRef.current) return

    const t = 1 - Math.exp(-delta * 6)
    state.camera.position.lerp(desiredPosRef.current, t)

    const controls = orbitRef.current
    if (controls) {
      controls.target.lerp(desiredTargetRef.current, t)
      controls.update()
    }

    if (state.camera.position.distanceTo(desiredPosRef.current) < 0.01) {
      transitioningRef.current = false
    } else {
      // `frameloop="demand"` only renders the frames explicitly requested —
      // keep requesting the next one for as long as the fly-to lerp above
      // still has distance left to cover, or it would freeze mid-flight
      // after this single rendered frame.
      state.invalidate()
    }
  })

  return null
}

// How often the idle hotspot "breathing" pulse requests a new frame under
// `frameloop="demand"` — deliberately much coarser than a real ~60fps RAF
// loop (see `Hotspot`'s own per-frame block, which this just keeps ticking):
// the pulse is a slow (~3.3s period), purely decorative ambient cue, not an
// interaction the user tracks closely, so sampling it at ~12fps instead of
// 60fps is not visibly choppy in practice while cutting the idle render cost
// (full scene + post-fx redraw, not just the marker math) to roughly a fifth.
const BREATHE_INVALIDATE_INTERVAL_MS = 80

// Keeps `frameloop="demand"` alive at a low, fixed rate ONLY for the
// hotspot markers' idle breathing animation (see the constant above) —
// every other continuously-animated thing in this scene (the fly-to camera
// lerp in `CameraRig`, OrbitControls' own damping settle) already
// self-invalidates on its own while it's actually active, and stops
// invalidating (so rendering stops) the moment it's done. Skipped entirely
// under `prefersReducedMotion`: `Hotspot` already forces its own pulse
// contribution to a flat 0 in that case, so there's nothing for repeated
// invalidation to animate — the marker's distance-compensation scale still
// updates correctly on its own whenever the camera actually moves (which
// already invalidates through the paths above), no polling needed. Calling
// `invalidate()` while this section is scrolled out of view / the tab is
// hidden (`active=false` -> Canvas `frameloop="never"`) is a verified no-op
// in R3F's own `invalidate()` (it early-returns when `frameloop === 'never'`
// — see node_modules/@react-three/fiber's `invalidate` implementation), so
// this timer doesn't need its own `active`-gating to stay safe/cheap then.
function BreathingPulseDriver({ prefersReducedMotion }) {
  const { invalidate } = useThree()

  useEffect(() => {
    if (prefersReducedMotion) return undefined
    const id = window.setInterval(() => invalidate(), BREATHE_INVALIDATE_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [invalidate, prefersReducedMotion])

  return null
}

const Hero3DScene = forwardRef(function Hero3DScene({ onHotspotChange, active = true, onReady }, ref) {
  const { t } = useTranslation('home')
  const orbitRef = useRef(null)
  const [isMobile] = useState(detectMobile)
  const [isPortrait] = useState(detectPortraitAspect)
  const [isWideLayout] = useState(detectWideLayout)
  const [prefersReducedMotion] = useState(detectReducedMotion)
  // See data/hotspots3d.js for why there are two presets and how each was
  // derived/verified — this is the only place that picks between them.
  const defaultCameraPosition = isPortrait ? NARROW_CAMERA_POSITION : DEFAULT_CAMERA_POSITION
  const defaultCameraTarget = isPortrait ? NARROW_CAMERA_TARGET : DEFAULT_CAMERA_TARGET
  const desiredPosRef = useRef(new THREE.Vector3(...defaultCameraPosition))
  const desiredTargetRef = useRef(new THREE.Vector3(...defaultCameraTarget))
  const transitioningRef = useRef(false)
  const [activeKey, setActiveKey] = useState(null)
  const [hoveredKey, setHoveredKey] = useState(null)
  // Mounting <EffectComposer> (6 post-processing shader passes: N8AO, Bloom,
  // ToneMapping, BrightnessContrast, HueSaturation, Vignette) forces all of
  // them to compile before the FIRST frame that includes it can render —
  // on top of the scene's own ~25+ material shaders and shadow-depth
  // variants, that's a large one-shot synchronous compile burden blocking
  // the main thread right as the scene first becomes visible (confirmed via
  // CPU profiling: this is the dominant cost in first paint, far more than
  // network/chunk-download time). Set by `ReadySignal`'s `onPostFxReady`
  // (two rAFs past the scene's own first real frame, not two rAFs past raw
  // mount — see that component's own comment) so the scene's own first
  // frame (materials/lighting/hotspots, no post-fx) reaches the screen on a
  // much cheaper compile first, then the graded/bloomed look pops in a
  // frame or two later once its shaders finish compiling in the background
  // — same final visual, just staged instead of monolithic.
  const [postFxReady, setPostFxReady] = useState(false)
  // Holds R3F's own `invalidate` once `CameraRig` (a Canvas child) captures
  // it — see that component's own comment on why this indirection exists:
  // under `frameloop="demand"`, the functions below (plain closures, called
  // from DOM button clicks / Hotspot's R3F pointer events, but themselves
  // outside the Canvas tree) are what FIRST flips `transitioningRef.current`
  // true, and nothing renders again on its own unless something calls
  // `invalidate()` right then to kick off that first frame.
  const invalidateRef = useRef(null)

  // Zoom now lives here instead of on the mouse wheel (see OrbitControls'
  // enableZoom={false} below) — this moves the camera along the existing
  // target->camera direction, clamped to the same min/maxDistance the wheel
  // used to respect.
  function zoomBy(factor) {
    const controls = orbitRef.current
    if (!controls) return

    const camera = controls.object
    const offset = camera.position.clone().sub(controls.target)
    const nextDistance = THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance)
    offset.setLength(nextDistance)
    camera.position.copy(controls.target).add(offset)
    controls.update()
    // One-shot camera move, not an ongoing transition `CameraRig` lerps
    // toward — needs its own explicit request for the single frame that
    // shows the new zoom level under `frameloop="demand"`.
    invalidateRef.current?.()
  }

  function selectHotspot(hotspot) {
    setActiveKey(hotspot.key)
    desiredPosRef.current.set(...hotspot.cameraPosition)
    desiredTargetRef.current.set(...hotspot.position)
    transitioningRef.current = true
    // Kicks off the first frame of the fly-to transition; `CameraRig`'s own
    // `useFrame` keeps requesting the rest for as long as it's still lerping
    // (see that component).
    invalidateRef.current?.()
    onHotspotChange?.(hotspot)
  }

  function resetCamera() {
    setActiveKey(null)
    desiredPosRef.current.set(...defaultCameraPosition)
    desiredTargetRef.current.set(...defaultCameraTarget)
    transitioningRef.current = true
    invalidateRef.current?.()
    onHotspotChange?.(null)
  }

  function selectHotspotByKey(key) {
    const hotspot = hotspots.find((h) => h.key === key)
    if (hotspot) selectHotspot(hotspot)
  }

  useImperativeHandle(ref, () => ({ resetCamera, selectHotspot: selectHotspotByKey }))

  // Groups (components/3d/groups) are what actually highlight/dim — resolved
  // here from the hotspot's own `group` field rather than passed straight
  // through as the raw hotspot key, so a future hotspot whose `group`
  // differs from its `key` still highlights the right thing without any
  // change to Building.jsx or the group components.
  const activeGroup = hotspots.find((h) => h.key === activeKey)?.group ?? null
  const hoveredGroup = hotspots.find((h) => h.key === hoveredKey)?.group ?? null

  return (
    <>
      <Canvas
        shadows
        camera={{ position: defaultCameraPosition, fov: 45 }}
        // Desktop max capped at 1.25 (down from 1.5) — the visible sharpness
        // delta between 1.25x and 1.5x device pixel ratio on this scene's
        // detail level is marginal, but the pixel (and therefore fragment
        // shader / post-fx) count scales with the SQUARE of this value, so
        // the saving is far larger than the ratio change alone suggests.
        dpr={isMobile ? [1, 1] : [1, 1.25]}
        // Paused (no automatic per-frame render/useFrame invocation) while
        // Building3DSection's own IntersectionObserver reports this section
        // is scrolled far out of view — see that component's `inView` state
        // for why this is safe (doesn't touch camera/controls/transition
        // state, only the RAF loop driving them). `'demand'` (rather than
        // `'always'`) when active: nothing in this scene needs to redraw
        // every single RAF tick forever — the camera fly-to lerp
        // (`CameraRig`), OrbitControls' own damping settle, and the hotspot
        // markers' idle "breathing" pulse (`BreathingPulseDriver`, throttled
        // — see its own comment) all explicitly call `invalidate()` only
        // while/as often as they actually need a new frame, so an idle,
        // non-interacting scene renders nothing further once everything
        // settles, instead of burning a full GPU frame (scene + N8AO +
        // Bloom + shadow/contact-shadow passes) 60 times a second for no
        // visible change.
        frameloop={active ? 'demand' : 'never'}
        // `antialias` off deliberately: once `<EffectComposer>` is mounted,
        // the 3D scene is rendered into the composer's own render target,
        // never the canvas's default (potentially MSAA) framebuffer — the
        // composer's own `multisampling` prop below is what actually
        // controls edge antialiasing now, so paying for a second, unused
        // native AA context would be pure waste.
        gl={{ antialias: false, outputColorSpace: THREE.SRGBColorSpace }}
        // Fires once, right after the WebGL context/scene object are first
        // created — but well before this Canvas's own JSX children have
        // necessarily committed into that scene, let alone had any shader
        // compiled or any frame drawn. Purely a diagnostic checkpoint now;
        // the actual "real canvas has something on screen" signal for
        // Building3DSection's placeholder crossfade is `ReadySignal`'s
        // `onReady` below (first real frame, post-gl.compile).
        onCreated={({ gl: createdGl }) => {
          // Every `WebGLProgram`'s first real use (`getUniforms`/
          // `getAttributes`, called from `WebGLRenderer.setProgram` on the
          // program's first bind) runs a synchronous `gl.getProgramParameter`
          // link-status check + `getShaderInfoLog`/`getProgramInfoLog` calls
          // when `renderer.debug.checkShaderErrors` is true (three.js's
          // default) — exactly the kind of GPU-driver round-trip that
          // forces the main thread to block until that program's link
          // actually finishes, regardless of whether it was warmed up via
          // `gl.compileAsync` first. Off in production (kept on in dev so
          // real shader errors still surface there) removes that stall for
          // every program — the base scene's AND the post-processing
          // pipeline's (EffectComposer/ContactShadows below, which have no
          // async precompile path of their own to opt out of this check).
          if (import.meta.env.PROD) {
            createdGl.debug.checkShaderErrors = false
          }
          diag3d('3D Canvas onCreated (WebGL context exists, nothing drawn/compiled yet)')
        }}
      >
        <ReadySignal
          onReady={() => {
            diag3d('3D scene onReady (first frame rendered, shaders compiled)')
            onReady?.()
          }}
          onPostFxReady={() => setPostFxReady(true)}
        />
        <ProgramCountLogger postFxReady={postFxReady} />
        <GradientBackdrop />
        <fog attach="fog" args={[FOG_COLOR, 15, 33]} />

        {/* Restrained key/fill/rim rig. Ambient kept deliberately low — the
            `Environment` IBL below and the post-processing SSAO do the job
            flat ambient would otherwise do, so a higher ambient here would
            wash the key/fill contrast back out and read flat instead of
            dusk. */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[6, 7, 5.5]}
          intensity={2.1}
          color="#FFEBC8"
          castShadow
          // Was 2048 on desktop (mobile already 1024) — dropped to match
          // mobile. `StaticShadowMap` below bakes this map exactly ONCE
          // (`autoUpdate = false`), so the cost here is a single one-time
          // render-to-texture at mount, not a recurring per-frame cost —
          // still worth halving since it's part of the same first-paint
          // compile/setup burden `ReadySignal`'s staged mounting (see that
          // component's own comment) is specifically working to shrink, and
          // the tighter shadow-camera frustum already derived against the
          // building's real bounding box (see the comment below) means the
          // visible resolution-per-shadow-pixel loss from 2048 -> 1024 is
          // modest, not the 4x-softer blur a naively unbounded frustum would
          // show at the same texel drop.
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          // Frustum derived from projecting the building's full bounding box
          // (including ExteriorShell.jsx's `LowWideWing`, which extends the
          // left edge out to x=-6.6) onto this light's own local left/up
          // axes, plus a safety margin so nothing at the model's real edges
          // (e.g. the wing's shadow or the rooftop rail's far corner) clips.
          // Re-derive these if the building's bounding box changes again.
          // near/far are set at safe values since they only affect depth
          // precision, not the map's effective resolution.
          shadow-camera-left={-6.9}
          shadow-camera-right={3.9}
          shadow-camera-top={6.75}
          shadow-camera-bottom={-3.2}
          shadow-camera-near={0.5}
          shadow-camera-far={20}
          // Prevents shadow acne now that resolution is effectively higher
          // (tighter frustum + bigger map) — a small fixed depth bias offsets
          // the comparison just enough to avoid self-shadowing artifacts on
          // the concrete's own chamfered faces.
          shadow-bias={-0.0015}
        />
        <StaticShadowMap />
        {/* Warm rim/accent from the back-left, opposite the key — separates
            the building's silhouette from the dark backdrop and gives the
            concrete a warm/cool split instead of one flat white light. */}
        <directionalLight position={[-6, 3.2, -5]} intensity={0.4} color={COLORS.amber500} />
        {/* Cool fill from the opposite side — keeps the shadow side of the
            cutaway readable instead of crushed to black now that ambient is
            low. A neutral cool grey rather than a distinctly blue tone, so
            it reads as the shadow side's cool counterpoint to the key
            light's warm side without tinting the concrete/facade visibly
            blue. */}
        <directionalLight position={[-4, 2, 6]} intensity={0.2} color="#8D9295" />
        {/* Warm accent at the entrance canopy/windows. No shadow casting —
            an extra shadow-casting light here would cost a second shadow map
            for a small, mostly-decorative effect. */}
        <pointLight position={[-1.25, 1.35, 2.5]} intensity={0.42} distance={2.6} decay={2} color="#FFC98A" />
        {/* Second small warm point light at the AR Group sign / stairwell
            corner (right wall, ExteriorShell.jsx's `ARGroupSign`) — echoes
            the entrance's warm glow on the building's other visible face so
            neither side of the default 3/4 view reads flat. Positioned up
            and out into open air above/in front of the sign panel (ExteriorShell.jsx's
            `ARGroupSign`, center at world x=3.1, y=1.85, z=-0.15) rather than
            on its surface — a point light sitting too close to the panel
            overexposes it via 1/distance^2 falloff, and with Bloom's 0.92
            luminance threshold that spreads into a glare blob that hides the
            backlit-text texture entirely. This reads as a downlight grazing
            the sign from above instead. */}
        <pointLight position={[3.25, 2.35, -0.15]} intensity={0.28} distance={1.8} decay={2} color="#FFC98A" />
        {/* Scoped to its own Suspense so the HDRI reflections never block the
            building/hotspots from rendering — without this boundary the
            whole R3F tree suspends (see useEnvironment -> useLoader) and
            nothing commits, which is why only the Html markers were visible.
            Self-hosted (public/hdr/) rather than `preset="city"` — drei's
            preset system fetches that exact file from a third-party CDN
            (raw.githack.com) at runtime, which previously made the whole
            scene (and, with no error boundary above it, the whole page)
            fail if that host was slow/unreachable/blocked. Same HDRI drei's
            "city" preset used — reads as a moody, window-lit night skyline
            (fits the dark industrial backdrop) and gives metal/glass
            reflections actual shape/variation instead of "warehouse"'s flat,
            uniform bright dome. `environmentIntensity` keeps that IBL
            contribution restrained so reflections read as real without
            blowing out. */}
        <Suspense fallback={null}>
          <Environment files="/hdr/potsdamer_platz_512.hdr" environmentIntensity={0.85} />
        </Suspense>

        <Ground />
        <Building activeGroup={activeGroup} hoveredGroup={hoveredGroup} />
        {/* Deferred alongside <EffectComposer> (same `postFxReady` flag,
            same 2-rAF delay) — ContactShadows' blur pass compiles its own 2
            shader programs (horizontal + vertical blur) synchronously at
            mount, same cost category as the post-processing pipeline. It's
            a subtle, low-contrast soft shadow on the ground, not a hero
            visual element, so skipping it for the scene's first 1-2 frames
            is imperceptible — and it removes 2 more `gl.linkProgram` calls
            from the critical path blocking the first visible frame.
            Confirmed via CPU profiling (see Hero3DScene's git history /
            PR notes) that WebGLProgram linking is the single largest
            attributable JS cost on the first frame in a software-rendered
            (no GPU, no KHR_parallel_shader_compile) test environment —
            every program removed from this gate helps there and costs
            nothing on real hardware. */}
        {postFxReady && (
          <ContactShadows
            position={[0, -0.01, 0]}
            opacity={0.6}
            scale={14}
            blur={2.2}
            far={4.2}
            resolution={isMobile ? 128 : 256}
            // drei defaults this to Infinity — re-rendering the blur pass
            // every single frame forever. Nothing it captures ever moves
            // (the building is static geometry; hotspot dim/highlight only
            // changes material opacity, never a transform), so one bake is
            // enough — this removes a full extra render pass from every
            // frame for the scene's entire lifetime, not just at startup.
            frames={1}
          />
        )}

        <BreathingPulseDriver prefersReducedMotion={prefersReducedMotion} />

        {hotspots.map((hotspot) => (
          <Hotspot
            key={hotspot.id}
            hotspot={hotspot}
            isActive={activeKey === hotspot.key}
            isHovered={hoveredKey === hotspot.key}
            anyActive={activeKey != null}
            onHover={setHoveredKey}
            onSelect={selectHotspot}
            prefersReducedMotion={prefersReducedMotion}
          />
        ))}

        <OrbitControls
          ref={orbitRef}
          target={defaultCameraTarget}
          enablePan={false}
          enableZoom={false}
          enableDamping
          dampingFactor={0.05}
          minDistance={3}
          // Must stay comfortably above the NARROW camera preset's resting
          // distance from its target (see hotspots3d.js) — not right at the
          // limit — or OrbitControls would clamp that resting shot inward.
          maxDistance={19.5}
          maxPolarAngle={Math.PI / 2.05}
          touches={{ ONE: undefined, TWO: undefined }}
        />
        <CameraRig
          orbitRef={orbitRef}
          desiredPosRef={desiredPosRef}
          desiredTargetRef={desiredTargetRef}
          transitioningRef={transitioningRef}
          invalidateRef={invalidateRef}
        />
        <CameraFrameShift active={isWideLayout} />

        {/* Post-processing pipeline. Order matters — each effect processes
            the previous one's output:
              1. N8AO   — screen-space ambient occlusion. Seats every small
                          connection (bolts, brackets, base plates, slab/
                          column junctions) into real contact shadow that the
                          directional shadow map's resolution can't resolve,
                          without needing per-mesh geometry changes.
              2. Bloom  — luminance-gated, tight threshold: only true bright
                          highlights (sun-hit specular on metal, the emissive
                          hotspot markers) bloom, never a general glow.
              3. ToneMapping (AGX) — replaces the old renderer-level
                          ACESFilmic + fixed exposure (mounting this composer
                          forces `renderer.toneMapping` to `NoToneMapping`
                          for as long as it's mounted, so tone mapping has to
                          live here now). AGX (Blender's own default view
                          transform since 4.0) rolls off bright highlights
                          much more gracefully than ACES/Reinhard, which is
                          the direct fix for "washed out" — mid-tone contrast
                          stays intact instead of everything clipping to white.
              4. BrightnessContrast / HueSaturation — a very small, restrained
                          grade (not a stylized LUT): a touch more contrast
                          and a touch less saturation so it reads as a real
                          render, not a color-corrected screenshot.
              5. Vignette — subtle edge falloff only, to hold focus on the
                          building rather than the frame edges.
            `multisampling` is this composer's own antialiasing (see the
            `gl={{antialias:false}}` note above) — was 4 on desktop/0 on
            mobile, desktop now reduced to 2: the visible edge-aliasing delta
            between 4x and 2x is subtle at this scene's camera distances, but
            each sample multiplies the composer's own resolve cost. N8AO is
            skipped entirely on mobile (same treatment as Bloom, already
            mobile-skipped below) — AO is the single most expensive pass in
            this pipeline, and `halfRes` alone wasn't enough headroom on
            phone-class GPUs; ToneMapping/BrightnessContrast/HueSaturation/
            Vignette stay mounted on mobile too, since those are what give
            the AGX grade (replacing the renderer's own tone mapping — see
            the mode comment above) and dropping the whole composer there
            would make mobile visibly flatter/washed out relative to
            desktop, not just less ambient-occluded. */}
        {postFxReady && (
          <EffectComposer multisampling={isMobile ? 0 : 2}>
            {isMobile ? (
              <></>
            ) : (
              <N8AO
                aoRadius={0.45}
                distanceFalloff={1}
                intensity={3.2}
                quality="medium"
                // Half-resolution AO buffer on desktop too now (previously
                // mobile-only) — screen-space AO is inherently a soft,
                // low-frequency effect; rendering its own buffer at half
                // the pixel count (so a quarter the shading cost) is not
                // visually distinguishable from full-res at this effect's
                // own blur radius, confirmed by comparing both before
                // applying this.
                halfRes
                screenSpaceRadius
              />
            )}
            {isMobile ? (
              <></>
            ) : (
              <Bloom luminanceThreshold={0.92} luminanceSmoothing={0.25} intensity={0.4} mipmapBlur />
            )}
            <ToneMapping mode={ToneMappingMode.AGX} />
            <BrightnessContrast brightness={-0.03} contrast={0.1} />
            <HueSaturation hue={0} saturation={-0.05} />
            <Vignette offset={0.32} darkness={0.45} />
          </EffectComposer>
        )}
      </Canvas>

      <div className="pointer-events-none absolute bottom-6 right-6 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => zoomBy(ZOOM_STEP)}
          aria-label={t('building3d.zoomIn')}
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-industrial-950/80 text-base-50 backdrop-blur-sm transition-colors hover:border-ember-600 hover:text-ember-600"
        >
          <Plus size={16} />
        </button>
        <button
          type="button"
          onClick={() => zoomBy(1 / ZOOM_STEP)}
          aria-label={t('building3d.zoomOut')}
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-industrial-950/80 text-base-50 backdrop-blur-sm transition-colors hover:border-ember-600 hover:text-ember-600"
        >
          <Minus size={16} />
        </button>
      </div>
    </>
  )
})

export default Hero3DScene
