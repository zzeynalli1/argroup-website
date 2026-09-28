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

// Camera moves this much closer/farther per zoom-button click (see `zoomBy`).
const ZOOM_STEP = 0.85

// Coarse, dependency-free "is this a phone/tablet, or a small/touch
// viewport" check — used only to drop the most expensive post-processing
// settings (SSAO quality, Bloom, multisampling, shadow-map size) a notch,
// per the brief's "adaptive settings for mobile" requirement. Deliberately
// not using GPU-benchmark detection (e.g. drei's `useDetectGPU`, which
// fetches a benchmark table from a CDN) — that adds a network dependency
// and latency to a marketing homepage for a call this simple heuristic
// already answers well enough. Computed once; screen size/pointer type
// don't change during a session in any way that matters here.
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
// Building3DSection.jsx's left text column (Fix 1/2 of the layout-refinement
// pass): true only for viewports wide AND landscape-ish enough that shifting
// the building right via `CameraFrameShift` below is safe. Gated on ASPECT
// RATIO, not raw width — the constraining factor for how much of the frame
// can be reclaimed without cropping the building's own silhouette (verified
// with a standalone script projecting the building's bounding box, the same
// method this file's camera presets in data/hotspots3d.js already use) is
// how much horizontal FOV a given vertical 45deg FOV yields, which is an
// aspect-ratio question: at aspect 1.78 (16:9) the WIDE preset has enough
// horizontal margin to absorb the shift below with zero cropping at every
// resolution tested; at aspect 1.33 (4:3, e.g. a 1024x768 window) the same
// shift already clips the building's own back-right roofline corner. 1.5 is
// the lowest tested aspect that still clears with real margin. `>= 1024`
// keeps this aligned with the brief's own "roughly lg/xl breakpoints and up"
// framing rather than firing for e.g. a short, wide embedded iframe.
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
// before cropping back down to it (see `CameraFrameShift`) — tuned via the
// same NDC bounding-box-projection method as `detectWideLayout` above
// against 1.5 (the lowest gated aspect ratio): 1.2 leaves real margin
// (largest tested corner at NDC 0.949, vs. the 1.0 edge) at that worst-case
// aspect, while every wider/more common desktop aspect (1.6, 1.78) clears
// with even more room. Do not raise this without re-running that check —
// cropping starts around 1.26 at aspect 1.5.
const VIEW_SHIFT_FACTOR = 1.2

// Vertical gradient, dark blue-grey — a plain <color> would read as flat
// black; this sits between industrial-950 and a lighter blue-grey stop.
// Dusk gradient, warmed slightly at the horizon (BOTTOM) — a believable
// dusk sky transitions from cool blue-grey overhead to a warm glow near the
// horizon, which also gives the building's silhouette a warmer edge to
// separate against instead of a flat cool backdrop everywhere.
// Rebuild pass, screenshot-verified fix: the old, much darker stops
// (#20242B / #2A2118) read as near-solid black once actually rendered —
// one of the confirmed defects ("scene should not read as very dark
// overall"). Lightened both stops a full step while keeping the same
// cool-overhead / warm-horizon dusk relationship.
const BACKDROP_TOP = '#3D4451'
const BACKDROP_BOTTOM = '#5C4A31'
// Bridges the warm backdrop-bottom glow and the new warm-graphite ground
// paving tone (see `groundMaterial` in buildingMaterials.js) rather than the
// old `#333944`, which matched only the cool sky-top stop — that mismatch is
// what read as a visible seam at the horizon once the ground itself got
// darker/warmer in this same pass (see fog near/far tuning below).
const FOG_COLOR = '#3B352E'

// Environment pass, corrected: the previous procedural canvas-painted
// skyline (rectangles + window-light speckle) read as primitive toy-box
// silhouettes rather than a real city and was rejected outright — removed
// entirely, no replacement geometry. In its place: an OPTIONAL real
// photographic panorama, composited into the SAME small canvas texture as
// the vertical sky gradient below (zero extra draw calls/geometry — see this
// file's own header note), loaded manually (not via Suspense) so a missing
// asset just falls back to the plain gradient with no error/placeholder. See
// `PANORAMA_URL` and `GradientBackdrop` below.
const BACKDROP_CANVAS_WIDTH = 512
const BACKDROP_CANVAS_HEIGHT = 256

// Reserved path for a real dusk/blue-hour Baku skyline photo (not supplied
// yet — see PANORAMA_* comments below). Deliberately NOT filled with any
// procedural/placeholder image per this project's content rules (CLAUDE.md:
// don't fabricate content that isn't real) — until a real file exists at
// this path, `GradientBackdrop` silently renders the plain gradient only.
const PANORAMA_URL = '/images/3d/city-panorama.webp'
// Horizon baseline as a fraction of canvas height. `scene.background`'s
// screen-locked stretch means canvas Y maps 1:1 to SCREEN Y, not to the 3D
// ground plane's own far edge — at this scene's camera angle the ground
// plane visually recedes to a horizon at roughly 35-40% down the actual
// viewport, well above the canvas's vertical midpoint. Reused from the prior
// (now-removed) skyline pass, which verified this fraction against the real
// on-screen horizon band.
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
// to the building" regardless of the real photo's own grading (brief:
// "don't trust the source image's own grading"). Alpha < 1 lets the sky
// gradient's own dusk tone show through/blend; filter desaturates, lowers
// contrast, and dims.
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
// (same reasoning the old skyline pass verified), so the left-dark/
// right-bright readability ramp stays a pure 2D compositing question.
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

// --- Hotspot marker visual constants (marker redesign pass) ---
// `MARKER_REFERENCE_DISTANCE` is roughly the WIDE default resting distance
// (~8.7 — see hotspots3d.js) rather than the much shorter post-select
// distance (~3-6, each hotspot's own cameraPosition-to-position distance) or
// the much longer NARROW resting distance (~13.3): the marker's un-scaled
// (1x) size looks right at that middle distance, and the clamp below scales
// it up when the camera is farther away (so it doesn't shrink to invisibility
// at the NARROW resting shot) and down when closer (so it doesn't balloon
// once the camera flies in on select) — the same "keep roughly constant
// screen size" job `Html`'s `distanceFactor` already does for the label,
// applied here to the mesh-based core/rings, which don't get that for free.
// Camera fill re-verification pass: WIDE's own resting distance moved from
// ~8.76 to ~9.64 (see hotspots3d.js) — nudged to match so the marker's
// baseline (1x) scale is still tuned against the distance a viewer actually
// sees most often (the default resting shot), not a now-stale number.
const MARKER_REFERENCE_DISTANCE = 9.5
const MARKER_MIN_DIST_SCALE = 0.68
const MARKER_MAX_DIST_SCALE = 1.55
// Slow breathing (idle-only "alive/interactive" cue — replaces relying on
// the Html label's CSS `animate-ping`, which only ever fired on hover/
// active) — period = 2*PI / speed ≈ 3.31s, inside the 3.0-3.6s target band
// (nudged down from the previous 2.1, which at 2.99s landed just under the
// floor). Unlike the old single `group.scale` pulse, breathing is split
// across independently-refed elements (core emissive AND scale, main ring
// scale, glow opacity AND scale — see the per-frame block below) instead of
// one shared uniform scale, so the ring/glow "halo" can visibly expand more
// than a subtler core pulse does, per the animation-refinement brief. Each
// amount below is applied UNIDIRECTIONALLY on top of that element's own
// rest-tier value (0 -> +amount, via a (sin+1)/2 pulse, never negative) —
// deliberate, not an oversight: it means breathing only ever ADDS emphasis
// on top of the already-visible rest state and never dips below it, which
// is what naturally keeps the marker "never disappearing" without needing a
// separate opacity floor constant on the ring/rim/glow. The core's own rest
// baseline (`coreEmissive` below) was also raised slightly so the red dot
// itself never reads as faint even at the bottom of its pulse.
const MARKER_BREATHE_SPEED = 1.9
const MARKER_CORE_BREATHE_AMOUNT = 0.2
// Core scale pulse (~1.00 -> 1.10 -> 1.00) — applied to the core mesh's own
// scale via `coreMeshRef`, separate from the emissive brightening above and
// from the parent `visualRef` group's distance/hover/active scale, so it
// doesn't fight either.
const MARKER_CORE_SCALE_BREATHE_AMOUNT = 0.1
// Core OPACITY pulse (~0.78 -> 1.00 -> 0.78) — added on top of the existing
// emissive+scale pulse above. The core sphere previously had no
// `transparent`/`opacity` at all (emissive intensity was its only
// "brightness" signal); at the marker's actual ~11-22px on-screen size at
// the default resting camera distance (see the perceptibility investigation
// this pass grew out of), an emissive-only change reads as barely
// perceptible, so a real, literal opacity animation is layered in as a
// second independent channel. Safe to make transparent: `depthTest`/
// `depthWrite` are already both false on this mesh (see below), so there's
// no z-fighting/sorting concern to introduce.
const MARKER_CORE_OPACITY_BREATHE_AMOUNT = 0.22
// Main ring scale pulse — raised further (from 0.25) so the halo visibly
// expands (~1.00 -> ~1.35 -> 1.00), one of two primary visibility fixes.
const MARKER_RING_BREATHE_AMOUNT = 0.35
const MARKER_GLOW_BREATHE_AMOUNT = 0.28
// Glow/halo billboard plane's own scale pulse (paired with the opacity
// pulse above) — raised substantially (from 0.25 to 0.6, a ~60% peak growth
// in the blob's diameter) because at this marker's real on-screen scale, a
// LARGER soft glow blob is the single most perceptible lever available: a
// few-pixel change on the small hard-edged ring/core is easy to miss, but a
// visibly swelling, brightening soft halo reads clearly even at a glance.
// See `glowBaseScale` below (also raised) for the blob's own rest/
// emphasized base size this multiplies.
const MARKER_GLOW_SCALE_BREATHE_AMOUNT = 0.6
// How fast the breathing pulse's strength eases to 0 on hover/active and
// back to 1 once neither — an exponential `THREE.MathUtils.damp` rate
// (per-second), not a linear lerp, so it settles smoothly rather than
// snapping mid-cycle (a snap would show as a tiny visible jump if the pulse
// happens to be mid-swing the instant the pointer enters). At 6/s the pulse
// is ~95% settled within ~0.5s of a hover/select/deselect, which reads as
// "breathing pauses right away" without an abrupt cut.
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
// Per-marker breathing-perceptibility investigation (all 10 markers checked
// individually via screenshot pixel-diff, not just eyeballed): every marker
// DOES animate every frame — this was never a per-instance bug (no shared
// ref/key aliasing found, `breathePhase` is purely `hotspot.id`-derived) —
// but the amount of VISIBLE change varies hugely by local background.
// Markers sitting against the light concrete facade (e.g.
// `passiveFireProtection`, `fireproofingSystems`) measured mean per-pixel
// diff ~0.4 across a full cycle vs. ~1.7-2.1 for markers against dark
// recessed glazing/openings (e.g. `mechanicalSupport`, `cableProtection`) —
// same underlying animation, ~5x weaker apparent signal. Root cause: the red
// glow blob is additively blended (`THREE.AdditiveBlending`), which by its
// own math contributes much less visible brightening on a light background
// than a dark one (adding red to already-bright beige barely shifts it,
// while adding the same red to near-black glazing is dramatic) — the ring/
// core pulse alone isn't enough to compensate since they're small and
// hard-edged. Fix: breathe the off-white RIM too (previously static, fixed
// opacity only) — off-white against both light concrete and dark glazing
// reads as a real contrast delta either way (unlike the glow's additive red),
// so it carries the "obviously animating" signal reliably regardless of
// local background. Re-verified after: all 10 markers show comparable,
// clearly visible per-cycle diffs (see the per-marker screenshot/diff
// methodology this investigation used).
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
  // A sibling hotspot is the active one — this marker dims (per the brief:
  // "other hotspots may dim slightly but must remain visible/clickable, not
  // disappear") but hover still overrides the dim so it stays fully readable
  // the moment the user's pointer actually reaches it.
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
    // Overall marker size stays distance-compensation + hover/active tier
    // only — no breathing here anymore. Breathing moved to per-element
    // treatment below (core emissive / ring scale / glow opacity) so the
    // ring can expand more than the core, per the animation-refinement
    // brief, instead of one shared group-scale pulse doing everything.
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
          fixed `renderOrder`) — this building is now a closed volume by
          default (ExteriorShell's front/back/left/right walls only open a
          hotspot's own reveal panel once THAT hotspot is active), so most
          markers sit at their real system's location INSIDE the solid wall
          mass and would otherwise be fully hidden behind opaque geometry at
          rest (screenshot-verified: only 2 of 9 markers were visible before
          this fix — the two whose system happens to sit at/behind existing
          glazing). Rendering markers as an always-on-top UI layer (the same
          convention interactive BIM/product-tour viewers use for hotspot
          pins) is the correct fix rather than repositioning every marker to
          an exterior-only point, which would pull several of them away from
          the real system they're meant to indicate. `renderOrder` values are
          staggered (glow < core < rings) purely so the three transparent
          layers of the SAME marker composite correctly against each other
          once depth-testing between them is gone; they still don't
          depth-test against each other's geometry as a group. */}
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
          {/* No declarative `scale` prop here on purpose — this mesh's
              scale is 100% useFrame-owned (see `glowMeshRef.current.scale
              .setScalar(...)` below), same as the core/ring meshes.
              Previously this had BOTH a declarative `scale={glowBaseScale}`
              prop AND the imperative per-frame update; since this component
              re-renders whenever ANY sibling hotspot's hover/active state
              changes (lifted state in the parent), the declarative prop was
              momentarily re-applied on those re-renders, fighting the
              imperative value until the next animation frame overwrote it
              again. */}
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

        {/* Solid AR-red core — now baseline-visible at rest (was only
            reachable via hover/active before), strengthens on hover/active,
            dims (never disappears) when a sibling hotspot is selected. */}
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
// perspective distortion (per the brief). This is fully orthogonal to
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

function CameraRig({ orbitRef, desiredPosRef, desiredTargetRef, transitioningRef }) {
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
    }
  })

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
  }

  function selectHotspot(hotspot) {
    setActiveKey(hotspot.key)
    desiredPosRef.current.set(...hotspot.cameraPosition)
    desiredTargetRef.current.set(...hotspot.position)
    transitioningRef.current = true
    onHotspotChange?.(hotspot)
  }

  function resetCamera() {
    setActiveKey(null)
    desiredPosRef.current.set(...defaultCameraPosition)
    desiredTargetRef.current.set(...defaultCameraTarget)
    transitioningRef.current = true
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
        dpr={isMobile ? [1, 1] : [1, 1.5]}
        // Paused (no automatic per-frame render/useFrame invocation) while
        // Building3DSection's own IntersectionObserver reports this section
        // is scrolled far out of view — see that component's `inView` state
        // for why this is safe (doesn't touch camera/controls/transition
        // state, only the RAF loop driving them).
        frameloop={active ? 'always' : 'never'}
        // `antialias` off deliberately: once `<EffectComposer>` is mounted,
        // the 3D scene is rendered into the composer's own render target,
        // never the canvas's default (potentially MSAA) framebuffer — the
        // composer's own `multisampling` prop below is what actually
        // controls edge antialiasing now, so paying for a second, unused
        // native AA context would be pure waste.
        gl={{ antialias: false, outputColorSpace: THREE.SRGBColorSpace }}
        // Fires once, right after the WebGL context/scene is first created
        // (well before every texture/environment map is necessarily loaded) —
        // used purely as the "the real canvas has something on screen now"
        // signal for Building3DSection's placeholder-to-canvas crossfade, not
        // as a "fully loaded" signal. Doesn't affect rendering/frameloop.
        onCreated={() => onReady?.()}
      >
        <GradientBackdrop />
        {/* Near/far widened slightly (16/30 -> 15/33) alongside the FOG_COLOR
            retune above: the darker/warmer ground paving needs a slightly
            longer, gentler falloff to blend into the horizon without a
            visible seam — kept cheap (no new geometry, just tuning existing
            fog args). */}
        <fog attach="fog" args={[FOG_COLOR, 15, 33]} />

        {/* Restrained key/fill/rim rig. Ambient kept deliberately low — the
            `Environment` IBL below and the post-processing SSAO now do the
            job flat ambient used to do, so a high ambient here would just
            wash the contrast back out. */}
        {/* Screenshot-verified fix (reference-fidelity pass): the render read
            flat/evenly-lit rather than dusk — ambient trimmed further and
            the key/fill contrast pushed harder below so the sunlit side
            reads distinctly warm and the shadow side distinctly cool. */}
        {/* Rebuild pass, screenshot-verified fix: 0.1 combined with the old
            near-black backdrop read as "very dark overall" (a confirmed
            defect) — raised one step; still well below a flat/washed-out
            level since the key/fill contrast below is unchanged. */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[6, 7, 5.5]}
          intensity={2.1}
          color="#FFEBC8"
          castShadow
          shadow-mapSize-width={isMobile ? 1024 : 2048}
          shadow-mapSize-height={isMobile ? 1024 : 2048}
          // Frustum derived from projecting the building's bounding box
          // (x:-3..3, y:0..4.1 incl. rooftop rail, z:-2..2) onto this light's
          // own local left/up axes — the projected extent is left/right
          // ±3.46, top 5.35, bottom -2.83; the values below add a safety
          // margin on top of that rather than guessing a round symmetric
          // number, so nothing at the model's real edges (e.g. the rooftop
          // rail's far corner) clips. near/far left at their original safe
          // values since they only affect depth precision, not the map's
          // effective resolution.
          // Camera/massing pass: the bounding box's left edge grew from
          // x=-3 to x=-4.3 (ExteriorShell.jsx's `LowWideWing`) — left
          // extended by the same ~1.3 world-space delta plus margin so the
          // wing's own shadow isn't clipped by the frustum edge.
          // Massing re-pass (round 3): the wing's left edge grew again,
          // -4.3 -> -6.6 — re-solved by projecting both the old and new
          // bounding boxes onto this light's own local axes (a standalone
          // three.js OrthographicCamera/DirectionalLight script, not
          // eyeballed) and applying the resulting delta on top of the
          // already-tuned values above: left delta ~-1.55 -> -6.9, top delta
          // ~+1.1 -> 6.75 (this light isn't purely overhead, so widening X
          // also shifts its local "top" bound slightly). Bottom/right are
          // unaffected (the box's z/near-x extent driving those didn't
          // change) and are left as-is.
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
        {/* Warm rim/accent from the back-left, opposite the key — separates
            the building's silhouette from the dark backdrop and gives the
            concrete a warm/cool split instead of one flat white light. */}
        <directionalLight position={[-6, 3.2, -5]} intensity={0.4} color={COLORS.amber500} />
        {/* Cool fill from the opposite side — keeps the shadow side of the
            cutaway readable instead of crushed to black now that ambient is
            low. Camera/massing pass: desaturated from a distinctly blue
            #7C93B0 toward a neutral cool grey (brief: "no blue cast") —
            still reads as the shadow side's cool counterpoint to the key
            light's warm side, just without tinting the concrete/facade
            visibly blue at this pass's much closer camera distance. */}
        <directionalLight position={[-4, 2, 6]} intensity={0.2} color="#8D9295" />
        {/* Warm accent at the entrance canopy/windows — the brief's "warm
            interior/entrance glow". Raised from 0.35 to push the warm-vs-cool
            separation harder per the screenshot-verified "reads flat" fix
            above; still low/no-shadow (see the original reasoning: an extra
            shadow-casting light here would cost a second shadow map for a
            small, mostly-decorative effect). */}
        <pointLight position={[-1.25, 1.35, 2.5]} intensity={0.42} distance={2.6} decay={2} color="#FFC98A" />
        {/* Second small warm point light at the AR Group sign / stairwell
            corner (right wall, ExteriorShell.jsx's `ARGroupSign`) — echoes
            the entrance's warm glow on the building's other visible face so
            neither side of the default 3/4 view reads flat.
            Visual-QA fix: after the sign panel was enlarged (SIGN_SCALE 1.85,
            panel center at world x=3.1, y=1.85, z=-0.15 — see ExteriorShell.jsx),
            this light was left sitting almost exactly on the panel's own
            surface (x=3.1, only ~0.05-0.1 units from the face/text plane at
            every axis). At that distance a point light's 1/distance^2 falloff
            blows the surface out completely, and with Bloom's 0.92 luminance
            threshold that overexposure spreads into a single glare blob that
            fully hides the backlit-text texture behind it — confirmed via a
            cropped screenshot showing pure glare, no legible letterforms.
            Moved up and out into open air above/in front of the panel (clears
            the panel's own top edge at y=2.183 with margin, offset 0.15 off
            the wall face into open air) so it reads as a downlight grazing the
            sign from above instead of a light embedded in its face, and
            intensity trimmed since proximity was doing most of the previous
            brightness. */}
        <pointLight position={[3.25, 2.35, -0.15]} intensity={0.28} distance={1.8} decay={2} color="#FFC98A" />
        {/* Scoped to its own Suspense so the CDN-fetched HDRI reflections never
            block the building/hotspots from rendering — without this boundary
            the whole R3F tree suspends (see useEnvironment -> useLoader) and
            nothing commits, which is why only the Html markers were visible.
            "city" reads as a moody, window-lit night skyline (fits the dark
            industrial backdrop) and gives metal/glass reflections actual
            shape/variation instead of "warehouse"'s flat, uniform bright
            dome. `environmentIntensity` keeps that IBL contribution
            restrained so reflections read as real without blowing out. */}
        <Suspense fallback={null}>
          <Environment preset="city" environmentIntensity={0.85} />
        </Suspense>

        <Ground />
        <Building activeGroup={activeGroup} hoveredGroup={hoveredGroup} />
        <ContactShadows
          position={[0, -0.01, 0]}
          opacity={0.6}
          scale={14}
          blur={2.2}
          far={4.2}
          resolution={isMobile ? 128 : 256}
        />

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
          // Bumped 13 -> 14 for the massing pass, then 14 -> 17.5 for the
          // camera fill re-verification pass (see hotspots3d.js's
          // "Marker/fill re-verification pass" note): NARROW's own resting
          // distance moved 13.6 -> 16.63 to actually clear a real, scripted-
          // verified crop at the 768x1024 breakpoint, so this needs to grow
          // by the same margin pattern to keep that new resting distance
          // safely under the limit (16.63 under 17.5, not right at it).
          // Massing re-pass (round 3): the wing widened again (WING_X0 -4.3
          // -> -6.6, see ExteriorShell.jsx) so NARROW's own resting distance
          // grew again, 16.63 -> 18 (see hotspots3d.js) — bumped once more
          // to keep the same "not right at the limit" margin.
          maxDistance={19.5}
          maxPolarAngle={Math.PI / 2.05}
          touches={{ ONE: undefined, TWO: undefined }}
        />
        <CameraRig
          orbitRef={orbitRef}
          desiredPosRef={desiredPosRef}
          desiredTargetRef={desiredTargetRef}
          transitioningRef={transitioningRef}
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
                          hotspot markers) bloom, never a general glow — the
                          brief's explicit "no bloom/glow overuse".
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
            `gl={{antialias:false}}` note above) — reduced, not removed, on
            mobile; N8AO's quality/resolution and Bloom (skipped entirely on
            mobile) are the two genuinely expensive settings, so those are
            what actually adapt for phones/tablets. */}
        <EffectComposer multisampling={isMobile ? 0 : 4}>
          <N8AO
            aoRadius={0.45}
            distanceFalloff={1}
            intensity={isMobile ? 2.2 : 3.2}
            quality={isMobile ? 'performance' : 'medium'}
            halfRes={isMobile}
            screenSpaceRadius
          />
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
