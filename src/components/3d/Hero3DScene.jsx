import { forwardRef, lazy, Suspense, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Billboard, ContactShadows, Html, OrbitControls } from '@react-three/drei'
import { RGBELoader } from 'three-stdlib'
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

// Split into its own lazy chunk — see PostProcessingEffects.jsx's own
// comment — so `lowPower` scenes, which never render it (see the JSX gate
// below), never download `@react-three/postprocessing`/`postprocessing` at
// all, shrinking the base 3D chunk those devices do pay for.
const PostProcessingEffects = lazy(() => import('./PostProcessingEffects'))

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

// Self-hosted (public/hdr/) rather than `preset="city"` — drei's preset
// system fetches that exact file from a third-party CDN (raw.githack.com)
// at runtime, which previously made the whole scene (and, with no error
// boundary above it, the whole page) fail if that host was slow/
// unreachable/blocked. Same HDRI drei's "city" preset used — reads as a
// moody, window-lit night skyline (fits the dark industrial backdrop) and
// gives metal/glass reflections actual shape/variation instead of a flat,
// uniform dome. A flat procedural (Lightformer-rig) environment was tried
// in place of this file and reliably read as grey/flat — a real
// photographed HDRI's uneven, directional light pattern is what makes
// metal/glass reflections look like a real environment instead of a
// uniform studio dome, so that's worth the one real asset load. Also
// fetched eagerly, in parallel with this chunk itself, by App.jsx's
// `HeroScenePrefetch` — same URL, so that fetch's bytes are already
// HTTP-cache-warm by the time the `loadHDRTexture()` below requests them.
const HDRI_URL = '/hdr/potsdamer_platz_512.hdr'
// How long to wait for the HDRI before compiling/revealing the scene
// without it — see `SceneReady` below for why this exists at all (no
// isolated Suspense this scene can silently resolve behind).
const HDRI_TIMEOUT_MS = 4000
const HDRI_ENV_INTENSITY = 1.15

// Module-scope cache (not component state): the decoded HDR
// `THREE.DataTexture` behind `scene.environment` is identical across every
// mount of this component (same file, same URL) — caching the RESOLVED
// texture (not just relying on the browser's HTTP cache for the raw bytes)
// means a second mount this session (e.g. navigating away from Home and
// back) skips RGBE decoding entirely, not just the network fetch. Kept as a
// shared in-flight promise too so two near-simultaneous mounts don't both
// start their own RGBELoader.
let cachedHDRTexturePromise = null
function loadHDRTexture() {
  if (!cachedHDRTexturePromise) {
    cachedHDRTexturePromise = new Promise((resolve, reject) => {
      new RGBELoader().load(HDRI_URL, resolve, undefined, reject)
    })
  }
  return cachedHDRTexturePromise
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
          {/* `animate-ping` is a continuously-running CSS animation — skipped
              on `lowPower`/reduced-motion devices (same `prefersReducedMotion`
              flag this component already uses to flatten the 3D breathing
              pulse), since it keeps compositing a DOM layer on top of the
              WebGL canvas for as long as a marker is emphasized. */}
          {emphasized && !prefersReducedMotion && (
            <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-ember-600 opacity-60" />
          )}
          {emphasized && prefersReducedMotion && (
            <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-ember-600 opacity-60" />
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
// Post-processing (EffectComposer/ContactShadows below) is no longer staged
// behind a later `postFxReady` flip — it mounts together with everything
// else in this Canvas from the very first render, so there is only ever ONE
// visible look: `onReady` (and therefore Building3DSection's poster
// crossfade) waits for this same first-real-frame tick regardless. Staging
// the composer in later used to shave the FIRST frame's compile cost by
// deferring its ~6 extra shader programs a couple of frames past the base
// scene's own first paint — but that meant the poster faded out to reveal
// an un-graded frame (no AGX tone mapping, no Bloom/N8AO) for a beat before
// the graded look popped in a frame or two later, a visible double color
// shift. Compiling everything together costs a longer wait behind the
// poster instead of a shorter one followed by a visible pop — the explicit
// trade this scene now makes.
//
// HDRI loading is handled HERE too, BEFORE `gl.compileAsync` is ever
// called — not as a separate component racing it independently. Measured
// root cause of a ~5s stall in production: every material's compiled
// WebGLProgram is keyed in part on whether `scene.environment` is set
// (envMap changes which shader variant a standard material needs), so
// compiling first and setting `scene.environment` afterward meant EVERY
// material's program had to be silently, SYNCHRONOUSLY relinked the
// instant the HDRI arrived and changed that key — exactly the kind of
// main-thread stall `compileAsync` was supposed to avoid in the first
// place. Loading the HDRI first and only then starting `compileAsync`
// means every program compiles ONCE, already in its final envMap-aware
// form.
function ReadySignal({ onReady }) {
  const { gl, scene, camera, invalidate } = useThree()
  const compileStartedRef = useRef(false)
  const compileDoneRef = useRef(false)
  const firstFrameLoggedRef = useRef(false)

  // `scene` is the standard R3F imperative escape hatch (same convention as
  // GradientBackdrop's `scene.background` above) — safe to mutate directly.
  /* eslint-disable react-hooks/immutability */
  useEffect(() => {
    let unmounted = false
    const pmrem = new THREE.PMREMGenerator(gl)
    pmrem.compileEquirectangularShader()
    scene.environmentIntensity = HDRI_ENV_INTENSITY

    function startCompile(envReason) {
      if (compileStartedRef.current) return
      compileStartedRef.current = true
      diag3d(`3D shader precompile (gl.compileAsync) starting — env: ${envReason}`)
      gl.compileAsync(scene, camera).then(() => {
        if (unmounted) return
        diag3d('3D shader precompile (gl.compileAsync) done')
        compileDoneRef.current = true
        // `frameloop="demand"` won't render the frame that notices
        // `compileDoneRef` flipped on its own — this promise resolves
        // outside R3F's render loop, so it has to explicitly ask for the
        // next frame.
        invalidate()
      })
    }

    // Safety valve: a slow/unreachable HDRI must never block the scene
    // forever — compile and reveal without it once this fires. If the file
    // DOES still arrive after that (rare — only on a genuinely slow/
    // unreachable connection), it's still applied to `scene.environment`
    // below for correctness, just without a second `compileAsync` pass (the
    // one remaining case where a material may still relink synchronously on
    // next use, same original issue, but now only on a connection already
    // this degraded).
    const timeoutId = window.setTimeout(() => {
      diag3d('3D HDRI load timed out at 4s')
      startCompile('timed out, no env map')
    }, HDRI_TIMEOUT_MS)

    loadHDRTexture().then(
      (hdrTexture) => {
        if (unmounted) return
        window.clearTimeout(timeoutId)
        scene.environment = pmrem.fromEquirectangular(hdrTexture).texture
        diag3d('3D HDRI applied to scene.environment')
        startCompile('loaded')
      },
      (err) => {
        if (unmounted) return
        window.clearTimeout(timeoutId)
        diag3d('3D HDRI load failed', err?.message)
        startCompile('load failed, no env map')
      }
    )

    return () => {
      unmounted = true
      window.clearTimeout(timeoutId)
      pmrem.dispose()
      if (scene.environment) {
        scene.environment.dispose()
        scene.environment = null
      }
    }
  }, [gl, scene, camera, invalidate])
  /* eslint-enable react-hooks/immutability */

  useFrame(() => {
    // Wait for the compile above to actually resolve before treating any
    // rendered frame as "ready" — the compile's own `.then()` is what calls
    // `invalidate()` to request the frame that will see this true, so no
    // polling/re-invalidating is needed here while it's still false. The
    // render that follows this same tick is also where EffectComposer's own
    // passes (N8AO/Bloom/ToneMapping/etc., mounted unconditionally alongside
    // the scene now, not gated behind a later flag) synchronously compile/
    // link on their own first use — `onReady` firing here still means
    // "nothing left to visibly pop in later", that compile just now happens
    // to land inside the same blocking frame instead of a follow-up one.
    if (!compileDoneRef.current) return
    if (firstFrameLoggedRef.current) return
    firstFrameLoggedRef.current = true
    diag3d('3D first real frame rendered (building/lights/hotspots/post-fx on screen)')
    onReady?.()
  })

  return null
}

// One-shot diagnostic: logs `renderer.info.programs.length` — the real,
// final count of unique compiled WebGLPrograms (scene materials + their
// shadow-depth variants + the post-processing pipeline, now all mounted
// together — see ReadySignal above) — two frames after `ready` flips true,
// so EffectComposer/ContactShadows have actually rendered at least once and
// their own on-first-use shaders are counted too, not just the base
// scene's. Used to compare the before/after program count for the
// gl.compileAsync + checkShaderErrors + material-dedup changes in this
// file/buildingMaterials.js — strip once that comparison is done, same as
// the rest of the `diag3d` call sites.
function ProgramCountLogger({ ready }) {
  const { gl } = useThree()
  const loggedRef = useRef(false)
  const rafsRef = useRef({ raf1: 0, raf2: 0 })

  useEffect(() => {
    if (!ready || loggedRef.current) return undefined
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
  }, [ready, gl])

  return null
}

// Diagnostic for the hotspot-click freeze investigation: logs how many NEW
// WebGL programs got compiled (target: 0) across a hotspot select/
// deselect/switch — `useSystemMaterial`'s per-mesh materials used to
// recreate themselves (and therefore their compiled shader variant) on
// every one of these, which is exactly what froze the frame. Compared two
// frames after `activeKey` changes (same rAF-settle pattern as
// `ProgramCountLogger` above) so the real post-click program count is
// counted, not a mid-render snapshot.
function HotspotProgramDiag({ activeKey }) {
  const { gl } = useThree()
  const prevKeyRef = useRef(activeKey)
  const baselineRef = useRef(null)
  const rafsRef = useRef({ raf1: 0, raf2: 0 })

  useEffect(() => {
    if (baselineRef.current == null) {
      baselineRef.current = gl.info.programs?.length ?? 0
    }
    if (activeKey === prevKeyRef.current) return undefined
    prevKeyRef.current = activeKey
    const before = baselineRef.current
    rafsRef.current.raf1 = requestAnimationFrame(() => {
      rafsRef.current.raf2 = requestAnimationFrame(() => {
        const after = gl.info.programs?.length ?? 0
        diag3d('3D hotspot click -> new WebGL programs (target 0)', after - before)
        baselineRef.current = after
      })
    })
    return () => {
      cancelAnimationFrame(rafsRef.current.raf1)
      cancelAnimationFrame(rafsRef.current.raf2)
    }
  }, [activeKey, gl])

  return null
}

// Hard cap on the hotspot fly-to duration on mobile/lowPower — the desktop
// exponential-decay lerp below has no such cap (time-to-settle scales with
// the raw distance covered, which can run past a second for some hotspots),
// which read as sluggish on phones. Bounded instead by a fixed-duration
// eased tween (see `fastTransition` below) so it always lands by this many ms.
const MOBILE_FLIGHT_MS = 400

// Also doubles as this scene's one "give the outer, non-R3F component scope
// access to `invalidate`" bridge (see `invalidateRef` below) — under
// `frameloop="demand"`, nothing renders again on its own once the camera
// stops moving/settling, so `selectHotspot`/`resetCamera`/`zoomBy` (plain
// closures in `Hero3DScene`, defined OUTSIDE the Canvas/R3F tree, which is
// the only place `useThree` can be called) need a way to kick off the very
// first render of a new camera transition. `invalidateRef.current` is set
// here once R3F's own `invalidate` is available and read back there.
function CameraRig({ orbitRef, desiredPosRef, desiredTargetRef, transitioningRef, invalidateRef, fastTransition }) {
  const { invalidate } = useThree()
  // Fixed-duration tween state (`fastTransition` only) — the start pose is
  // captured the instant a transition begins (not just the target), so the
  // tween always covers the REAL distance for THIS flight in exactly
  // `MOBILE_FLIGHT_MS`, regardless of how far the camera already is.
  const flightStartPosRef = useRef(new THREE.Vector3())
  const flightStartTargetRef = useRef(new THREE.Vector3())
  const flightStartTimeRef = useRef(0)
  const wasTransitioningRef = useRef(false)

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
    if (!transitioningRef.current) {
      wasTransitioningRef.current = false
      return
    }

    const controls = orbitRef.current

    if (fastTransition) {
      if (!wasTransitioningRef.current) {
        flightStartPosRef.current.copy(state.camera.position)
        flightStartTargetRef.current.copy(controls ? controls.target : desiredTargetRef.current)
        flightStartTimeRef.current = performance.now()
        wasTransitioningRef.current = true
      }
      const elapsed = performance.now() - flightStartTimeRef.current
      const t = Math.min(elapsed / MOBILE_FLIGHT_MS, 1)
      const eased = 1 - (1 - t) ** 3 // ease-out cubic
      state.camera.position.lerpVectors(flightStartPosRef.current, desiredPosRef.current, eased)
      if (controls) {
        controls.target.lerpVectors(flightStartTargetRef.current, desiredTargetRef.current, eased)
        controls.update()
      }
      if (t >= 1) {
        transitioningRef.current = false
      } else {
        state.invalidate()
      }
      return
    }

    const t = 1 - Math.exp(-delta * 6)
    state.camera.position.lerp(desiredPosRef.current, t)

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

// `lowPower` scenes never mount `<EffectComposer>` (see the Canvas JSX
// below), which is normally what forces `renderer.toneMapping` to
// `NoToneMapping` for as long as it's mounted (see that prop's own comment)
// and applies the AGX grade via its own `<ToneMapping>` pass. Without the
// composer, the renderer would otherwise fall back to its own default
// (`NoToneMapping`, i.e. flat/unmapped output) — this sets the renderer's
// OWN tone mapping to AGX directly so a low-power scene's colors stay close
// to the full-quality look rather than visibly flattening out just because
// the post-fx pipeline is skipped. Reset back to `NoToneMapping` on
// disable/unmount so a later non-lowPower mount (where the composer takes
// over tone mapping itself) isn't fighting a stale renderer-level setting.
function LowPowerToneMapping({ enabled }) {
  const { gl } = useThree()

  useEffect(() => {
    if (!enabled) return undefined
    // The renderer is an imperative escape hatch (same convention as
    // GradientBackdrop's `scene.background` / StaticShadowMap's
    // `gl.shadowMap` above) — safe to mutate directly.
    /* eslint-disable react-hooks/immutability */
    gl.toneMapping = THREE.AgXToneMapping
    gl.toneMappingExposure = 1
    return () => {
      gl.toneMapping = THREE.NoToneMapping
    }
    /* eslint-enable react-hooks/immutability */
  }, [gl, enabled])

  return null
}

const Hero3DScene = forwardRef(function Hero3DScene(
  { onHotspotChange, active = true, onReady, lowPower = false },
  ref
) {
  const { t } = useTranslation('home')
  const orbitRef = useRef(null)
  const [isMobile] = useState(detectMobile)
  const [isPortrait] = useState(detectPortraitAspect)
  const [isWideLayout] = useState(detectWideLayout)
  const [prefersReducedMotion] = useState(detectReducedMotion)
  // Weak-device scenes (see Building3DSection's lowPower gating) skip the
  // idle hotspot breathing pulse too — it's a purely decorative ambient
  // cue, not core interaction, and `BreathingPulseDriver`'s periodic
  // `invalidate()` + the per-marker useFrame math are both work a
  // low-power device shouldn't pay for just to animate something nobody
  // asked to see move.
  const disableBreathing = prefersReducedMotion || lowPower
  // See data/hotspots3d.js for why there are two presets and how each was
  // derived/verified — this is the only place that picks between them.
  const defaultCameraPosition = isPortrait ? NARROW_CAMERA_POSITION : DEFAULT_CAMERA_POSITION
  const defaultCameraTarget = isPortrait ? NARROW_CAMERA_TARGET : DEFAULT_CAMERA_TARGET
  const desiredPosRef = useRef(new THREE.Vector3(...defaultCameraPosition))
  const desiredTargetRef = useRef(new THREE.Vector3(...defaultCameraTarget))
  const transitioningRef = useRef(false)
  const [activeKey, setActiveKey] = useState(null)
  const [hoveredKey, setHoveredKey] = useState(null)
  // Mirrors the `onReady` callback passed in from Building3DSection — kept
  // as local state too so `ProgramCountLogger` (a Canvas child, which can't
  // reach a prop drilled only to the JSX below without this) has something
  // to key off. <EffectComposer>/<ContactShadows> mount unconditionally
  // alongside everything else now (no separate staged flag) — see
  // ReadySignal's own comment on why: `onReady`/`sceneReady` firing already
  // means the composer's own TONE-MAPPING/grade passes are compiled too,
  // since they're part of the same first blocking render. N8AO/Bloom are a
  // separate, later-staged concern — see `heavyFxReady` below.
  const [sceneReady, setSceneReady] = useState(false)
  // N8AO + Bloom specifically (not the rest of the composer, see
  // `heavyFxReady`'s own gate on the JSX below) stay staged behind a short
  // delay past `sceneReady`, same 2-rAF pattern this scene used to apply to
  // the ENTIRE composer. Measured cause: under software-rendered WebGL
  // (confirmed via this scene's own CPU profiling — no real GPU driver,
  // `KHR_parallel_shader_compile` unsupported), N8AO's SSAO shader alone
  // turned a sub-4s first frame into a 30s+ one; Bloom adds a smaller but
  // real amount on top. Neither pass changes the image's base color/tone
  // the way ToneMapping/BrightnessContrast/HueSaturation do (see the bug
  // this whole restructure fixes: a visible double color-pop from THOSE
  // specific passes popping in late) — AO/bloom are localized refinements
  // (contact shadow in tight corners, a soft highlight bloom on already-
  // bright specular hits), not a tone/color-space change, so popping in a
  // couple of frames after the poster has already faded out reads as the
  // render settling in, not as a wrong-then-corrected image the way the
  // original bug did. Skipped entirely (stays false forever) on mobile and
  // lowPower — see the JSX gate below, which already drops both passes
  // there regardless of this flag.
  const [heavyFxReady, setHeavyFxReady] = useState(false)
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
    diag3d('3D hotspot clicked', hotspot.key)
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

  // Stages N8AO/Bloom in 2 rAFs after the rest of the scene (including the
  // composer's own tone-mapping/grade passes) is already on screen — see
  // `heavyFxReady`'s own comment above for why only these two passes stay
  // deferred. Plain `window.requestAnimationFrame`, not R3F's `useFrame`:
  // this runs outside the Canvas/R3F tree (same reasoning as `zoomBy`/
  // `selectHotspot` above needing `invalidateRef`), and R3F auto-invalidates
  // `frameloop="demand"` on its own whenever a committed prop/children
  // change touches the scene graph, so no manual `invalidate()` call is
  // needed here once `heavyFxReady` flips and N8AO/Bloom mount below.
  useEffect(() => {
    if (!sceneReady || isMobile || lowPower) return undefined
    let raf1 = 0
    let raf2 = 0
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        diag3d('3D N8AO/Bloom mounting (deferred, heavier shader compile starts now)')
        setHeavyFxReady(true)
      })
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [sceneReady, isMobile, lowPower])

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
        shadows={!lowPower}
        // Explicit near/far instead of R3F's defaults (near 0.1, far 1000)
        // — this scene's entire usable depth range is ~0.3-35 world units
        // (OrbitControls minDistance 3 / maxDistance 19.5, fog fades out at
        // 33), so a far plane of 1000 was wasting the vast majority of the
        // depth buffer's precision on space nothing ever occupies, the
        // classic cause of z-fighting on coplanar/near-coplanar surfaces
        // (panel-on-panel cladding, wall-on-cladding, ground-on-paving).
        // `near` raised to the largest safe value (0.3 — comfortably below
        // the closest any real geometry/camera-zoom gets) rather than
        // leaving it near-zero, since raising `near` is the single biggest
        // lever on depth precision (it's logarithmic in `far/near`, not
        // linear). Logged once below so this ratio can be re-verified if
        // the camera's own distance range ever changes.
        camera={{ position: defaultCameraPosition, fov: 45, near: 0.3, far: 40 }}
        // Desktop max capped at 1.25 (down from 1.5) — the visible sharpness
        // delta between 1.25x and 1.5x device pixel ratio on this scene's
        // detail level is marginal, but the pixel (and therefore fragment
        // shader / post-fx) count scales with the SQUARE of this value, so
        // the saving is far larger than the ratio change alone suggests.
        // `lowPower` (weak-device auto-load, see Building3DSection) always
        // pins this to 1x regardless of device type.
        dpr={lowPower ? [1, 1] : isMobile ? [1, 1] : [1, 1.25]}
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
        onCreated={({ gl: createdGl, camera: createdCamera }) => {
          diag3d('3D camera near/far', `near=${createdCamera.near} far=${createdCamera.far}`)
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
            setSceneReady(true)
          }}
        />
        <ProgramCountLogger ready={sceneReady} />
        <LowPowerToneMapping enabled={lowPower} />
        <GradientBackdrop />
        <fog attach="fog" args={[FOG_COLOR, 15, 33]} />

        {/* Restrained key/fill/rim rig. Ambient kept deliberately low — the
            `Environment` IBL below and the post-processing SSAO do the job
            flat ambient would otherwise do, so a higher ambient here would
            wash the key/fill contrast back out and read flat instead of
            dusk. */}
        <ambientLight intensity={0.37} />
        <directionalLight
          position={[6, 7, 5.5]}
          intensity={2.1}
          color="#FFEBC8"
          castShadow={!lowPower}
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
          // (tighter frustum + bigger map). Split across two complementary
          // biases rather than depth-bias alone: `shadow-bias` (constant
          // depth offset) is kept small — too large a depth bias is its own
          // artifact (visible "peter-panning", the shadow detaching from its
          // caster) — while `shadow-normalBias` (offsets the sample point
          // along the surface normal instead of raw depth) carries most of
          // the acne-prevention work, since it scales naturally with the
          // angle between the light and each surface instead of applying one
          // flat depth offset everywhere.
          shadow-bias={-0.0005}
          shadow-normalBias={0.035}
        />
        {!lowPower && <StaticShadowMap />}
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

        <Ground />
        <Building activeGroup={activeGroup} hoveredGroup={hoveredGroup} />
        {/* Mounted unconditionally alongside everything else when not
            `lowPower` (see ReadySignal's own comment on why this is no
            longer staged behind a later flag) — ContactShadows' blur pass
            compiles its own 2 shader programs (horizontal + vertical blur)
            synchronously on first use, same cost category as the
            post-processing pipeline below, and now part of the SAME first
            blocking render `onReady` waits for, so there's nothing left to
            visibly pop in afterward. */}
        {/* Also skipped on `isMobile` now, not just `lowPower` — covers the
            narrow-but-not-coarse-pointer desktop-window edge case that
            `lowPower` alone doesn't catch; ContactShadows' blur pass is real
            extra GPU work this scene doesn't need to spend on any phone-
            class viewport. */}
        {!lowPower && !isMobile && (
          <ContactShadows
            position={[0, -0.01, 0]}
            opacity={0.6}
            scale={14}
            blur={2.2}
            far={4.2}
            resolution={256}
            // drei defaults this to Infinity — re-rendering the blur pass
            // every single frame forever. Nothing it captures ever moves
            // (the building is static geometry; hotspot dim/highlight only
            // changes material opacity, never a transform), so one bake is
            // enough — this removes a full extra render pass from every
            // frame for the scene's entire lifetime, not just at startup.
            frames={1}
          />
        )}

        <BreathingPulseDriver prefersReducedMotion={disableBreathing} />

        {hotspots.map((hotspot) => (
          <Hotspot
            key={hotspot.id}
            hotspot={hotspot}
            isActive={activeKey === hotspot.key}
            isHovered={hoveredKey === hotspot.key}
            anyActive={activeKey != null}
            onHover={setHoveredKey}
            onSelect={selectHotspot}
            prefersReducedMotion={disableBreathing}
          />
        ))}

        <OrbitControls
          ref={orbitRef}
          target={defaultCameraTarget}
          enablePan={false}
          enableZoom={false}
          // Damping keeps rendering settle frames for a while after the user
          // stops dragging — real cost under `frameloop="demand"`. Disabled
          // entirely on `lowPower` so an orbit drag stops requesting new
          // frames the instant the pointer lifts, instead of continuing to
          // render its own inertia settle.
          enableDamping={!lowPower}
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
          fastTransition={isMobile || lowPower}
        />
        <CameraFrameShift active={isWideLayout} />
        <HotspotProgramDiag activeKey={activeKey} />

        {/* Post-processing pipeline — see PostProcessingEffects.jsx for the
            pass-by-pass breakdown (N8AO/Bloom/ToneMapping(AGX)/
            BrightnessContrast/HueSaturation/Vignette) and why it's split
            into its own lazy chunk. Never rendered (and therefore never
            downloaded) on `lowPower`. */}
        {!lowPower && (
          <Suspense fallback={null}>
            <PostProcessingEffects isMobile={isMobile} heavyFxReady={heavyFxReady} />
          </Suspense>
        )}
      </Canvas>

      <div className="pointer-events-none absolute bottom-6 right-6 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => zoomBy(ZOOM_STEP)}
          aria-label={t('building3d.zoomIn')}
          // `backdrop-blur-sm` dropped on `lowPower` — compositing a CSS
          // backdrop blur on a DOM element layered over the live WebGL
          // canvas is real, avoidable cost on weak GPUs.
          className={`pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-industrial-950/80 text-base-50 transition-colors hover:border-ember-600 hover:text-ember-600 ${lowPower ? '' : 'backdrop-blur-sm'}`}
        >
          <Plus size={16} />
        </button>
        <button
          type="button"
          onClick={() => zoomBy(1 / ZOOM_STEP)}
          aria-label={t('building3d.zoomOut')}
          className={`pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-industrial-950/80 text-base-50 transition-colors hover:border-ember-600 hover:text-ember-600 ${lowPower ? '' : 'backdrop-blur-sm'}`}
        >
          <Minus size={16} />
        </button>
      </div>
    </>
  )
})

export default Hero3DScene
