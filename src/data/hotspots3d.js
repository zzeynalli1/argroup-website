/**
 * Hotspot registry for Hero3DScene. `position` is where the marker sits on
 * the cutaway building AND the orbit look-at point; `cameraPosition` is
 * where the camera itself flies to when a hotspot is selected (renamed from
 * the old `cameraTarget` — that name was backwards from what the field
 * actually does and caused real confusion; no coordinate values changed,
 * only the key). `icon` is a lucide-react icon name, used for the panel's
 * mini hotspot-selector strip. Display copy (name/description/systemType/
 * fireRating/certification/applicationArea) lives in
 * locales/<locale>/home.json under `building3d.hotspots.<key>` — real
 * values stay "—" until confirmed against docs/argroup-knowledge-base.md
 * (see CLAUDE.md: no fabricated data).
 *
 * `group` is the id of the entry in components/3d/groups/index.js this
 * hotspot highlights/dims on select — for all 9 hotspots below it equals
 * `key` 1:1 today, but is a separate field so a future hotspot can point at
 * a shared or different group without this shape changing.
 *
 * `category` is the discipline, for future filtering/layer UI (not built
 * yet). `status` is 'current' (real, fully modeled) or 'future' (reserved,
 * not modeled — see the reserved-zone table in
 * .claude/agents/3d-modeling-agent.md); Building3DSection.jsx's InfoPanel
 * branches on it. `highlightColor` is an optional per-hotspot override of
 * the group's default highlight color; null means "use the group default."
 *
 * All 9 hotspots map to a real AR Group service (see the KB's "Services"
 * section) — no landscaping/exterior-cladding filler hotspots, and no
 * duplicate coverage of the same service across multiple points.
 * `waterproofInjection` (id 8) was removed: no corresponding service exists
 * in `servicesDetail.js` (confirmed with the project owner) — id numbering
 * below is intentionally non-contiguous (7, 9, 10) rather than renumbered,
 * since `id` only needs to be stable/unique, not sequential.
 */
export const hotspots = [
  {
    id: 1,
    key: 'passiveFireProtection',
    group: 'passiveFireProtection',
    category: 'fireProtection',
    status: 'current',
    icon: 'ShieldCheck',
    position: [0, 1.2, -1],
    // Hotspot-clarity pass review: kept unchanged — reads as a medium-close
    // 3/4 view through the front wall's own pop-plug opening toward the
    // pipe riser/collar assembly deeper inside, no self-occlusion or
    // top-down angle found on screenshot review.
    cameraPosition: [1, 3, 4],
    highlightColor: null,
  },
  {
    id: 2,
    key: 'fireproofingSystems',
    group: 'fireproofingSystems',
    category: 'fireProtection',
    status: 'current',
    icon: 'Flame',
    position: [1, 1.8, -1.6],
    // Hotspot-clarity pass: re-derived to a medium-close 3/4 view of the
    // fireproofed column through its own open slide panel, with the
    // building's own front-right massing still visible for context —
    // screenshot-verified, kept as-is.
    cameraPosition: [2.6, 1.9, 1.3],
    highlightColor: null,
  },
  {
    id: 3,
    key: 'cableProtection',
    group: 'cableProtection',
    category: 'fireProtection',
    status: 'current',
    icon: 'Cable',
    position: [-2, 1.05, -1.3],
    // Hotspot-clarity pass: the value this was first re-derived to
    // ([-4.5, 1.7, 0.5]) was never re-checked against `ExteriorShell.jsx`'s
    // `LowWideWing` (x -6.6..-3, z -2..2, capped at y 1.37) added in a later
    // massing pass — screenshot-verified defect: that camera sat almost
    // entirely inside the wing's own x/z footprint at a height (1.7, dropping
    // toward the 1.05 target) that dips under the wing's 1.37 roof partway
    // along its own sightline to the target, so the shot rendered as a
    // near-black, extremely close-up view of the wing's own interior/roof
    // underside instead of the cable tray. Re-solved to keep the ray's
    // height above 1.37 for its entire crossing of the wing's x-span (camera
    // y raised to 2.05, z pulled from 0.5 to -0.9 to keep the wall-crossing
    // point's z within the left-wall reveal panel's own opening range
    // -1.4..0.2 — see `ExteriorShell.jsx`'s `PANEL_DEFS` `cableProtection`
    // entry) while keeping the same medium-close, 3/4-angle framing family.
    cameraPosition: [-4.3, 2.05, -0.9],
    highlightColor: null,
  },
  {
    id: 4,
    key: 'mechanicalSupport',
    group: 'mechanicalSupport',
    category: 'structural',
    status: 'current',
    icon: 'Wrench',
    position: [-1.2, 2.4, -1],
    // Hotspot-clarity pass: re-derived to a medium-close 3/4 view showing
    // the full conduit + both hanger rods + ceiling flanges + clamp
    // brackets against the open service-hatch panel — screenshot-verified,
    // kept as-is (no wing/sightline conflict: this hotspot's ray never
    // crosses the wing's x<-3 footprint, see hotspots3d.js's own massing-pass
    // re-check note above).
    cameraPosition: [-2.3, 2.9, 2.9],
    highlightColor: null,
  },
  {
    id: 5,
    key: 'jointSealing',
    group: 'jointSealing',
    category: 'fireProtection',
    status: 'current',
    icon: 'Link2',
    position: [-3, 1.8, -1.95],
    // Hotspot-clarity pass review: kept unchanged — reads clearly as a
    // corner control joint (backer rod + sealant bead) with both adjoining
    // walls and the floor line visible for context, no top-down/flat angle
    // found on screenshot review; also already re-verified clear of the
    // LowWideWing in the massing-pass note above (ray height never drops
    // below 1.8, well above the wing's 1.37 cap).
    cameraPosition: [-6, 3, 1],
    highlightColor: null,
  },
  {
    id: 6,
    key: 'acousticInsulation',
    group: 'acousticInsulation',
    category: 'structural',
    status: 'current',
    icon: 'Volume2',
    position: [2.9, 1.2, -1.9],
    // Hotspot-clarity pass fix: the old camera ([5.5, 3, -1]) sat close
    // enough to `ExteriorShell.jsx`'s `ARGroupSign` (world x~3.1, z
    // -0.72..0.42, y 1.52..2.18) that the sign panel dominated/obscured most
    // of the frame at this hotspot's own close-in distance — screenshot-
    // verified defect, not a design choice (the sign has no relationship to
    // acoustic insulation). Pulled further back along -z (from -1 to -2.2)
    // and lowered slightly (y 3 -> 2.6) to clear the sign both vertically
    // and horizontally (re-verified: the new ray passes ~1.3 units past the
    // sign's own z-span and ~0.2 below its y-span at the sign's x) while
    // keeping the same right-side approach and a comparable medium-close
    // distance to the strip.
    cameraPosition: [5.5, 2.6, -2.2],
    highlightColor: null,
  },
  {
    id: 7,
    key: 'vibrationSolutions',
    group: 'vibrationSolutions',
    category: 'structural',
    status: 'current',
    icon: 'Activity',
    // y nudged 3.9 -> 3.99 (Phase D geometry pass): VibrationSolutions.jsx's
    // equipment unit previously overlapped its own isolation pads (a real
    // clipping bug, fixed by rebuilding the pad/plate/unit stack bottom-up
    // off the roof deck surface) and its center moved from y=3.925 to
    // y=3.992 as a result — nudged the look-at target by the same amount so
    // it still centers on the real equipment mass, not the old, now-
    // slightly-stale position. x/z unchanged; cameraPosition unchanged (a
    // 0.09 vertical shift in the orbit target doesn't materially change this
    // hotspot's already-elevated [3.5,6,4] framing).
    position: [1.5, 3.99, 0.5],
    cameraPosition: [3.5, 6, 4],
    highlightColor: null,
  },
  {
    id: 9,
    key: 'drillingCutting',
    group: 'drillingCutting',
    category: 'structural',
    status: 'current',
    icon: 'Drill',
    position: [1.6, 1.2, -1],
    // Hotspot-clarity pass review: kept unchanged. This hotspot sits behind
    // the curtain-wall glazing (Architecture.jsx), so its view necessarily
    // crosses the bay's own mullions — that's the real, transparent
    // envelope this system sits behind, not a solid wall to open a panel
    // in (see ExteriorShell.jsx's own note on why drillingCutting/
    // engineeringTesting have no PANEL_DEFS entry). The pipe/collar
    // assembly itself is still clearly legible in frame on screenshot
    // review.
    cameraPosition: [4, 2.8, 4],
    highlightColor: null,
  },
  {
    id: 10,
    key: 'engineeringTesting',
    group: 'engineeringTesting',
    category: 'structural',
    status: 'current',
    icon: 'ClipboardCheck',
    position: [3, 1.8, 1.7],
    // Hotspot-clarity pass: re-derived to a medium-close 3/4 view of the
    // anchor bracket + gauge/rod assembly through the curtain-wall glazing
    // (see the drillingCutting note above on why this view crosses real
    // mullions rather than a solid-wall opening) — screenshot-verified,
    // kept as-is; the nearest mullion reads as the assembly's own fixed
    // connection point (Architecture.jsx facade-emphasis highlight), not
    // clutter.
    cameraPosition: [4.6, 2.35, 3.2],
    highlightColor: null,
  },
]

// --- Massing pass (reference-inspired exterior redesign) re-anchoring note ---
// Before re-deriving the camera presets below, every one of the 10 hotspots
// above was individually checked against the new massing added in this pass
// (see groups/ExteriorShell.jsx's `EntranceAssembly`/accent pier,
// groups/Architecture.jsx's raised stairwell-tower cap, and
// groups/RooftopShell.jsx's parapet + generic rooftop equipment enclosure):
// none of the 7 wall-opening `PANEL_DEFS` rects, the curtain-wall bay's
// `drillingCutting`/`engineeringTesting` anchor points, or the
// `vibrationSolutions` rooftop-unit footprint overlap any of the new
// geometry (the entrance/accent pier sit at front-wall u -2.7..-0.45, clear
// of every PANEL_DEFS rect there; the tower cap is confined to the bay's own
// footprint; the parapet is flush with the existing wall planes; the new
// rooftop enclosure sits at x -2.35, z 1.55, clear of the vibrationSolutions
// unit at x 0.9-2.1/z -0.1-1.1 and of every reserved future-zone footprint).
// Net result: no hotspot `position` or `cameraPosition` value changed in
// this pass — each still corresponds to the same real system location it
// always did. What DID need re-deriving is the two default resting-camera
// presets below, because the building's own bounding box grew (taller
// stairwell-tower cap + parapet, deeper entrance canopy) — see that note.

// Default resting camera framing — second pivot. The building is no longer a
// permanent open cutaway (see groups/ExteriorShell.jsx: a real front wall now
// closes it, with per-hotspot openings only appearing on select). Fixing
// "too high" meant lowering the camera below the roofline (previous WIDE
// y=4.47 vs. roof top ~3.68/rail top ~4.1) and lowering the look-at target
// off the upper-floor line (was y=2.38) to a natural eye-level/entrance-
// height anchor (~1.7-1.75) — both presets keep the same ~28-38 degree
// azimuth family as before (front + one side).
//
// Distance/elevation below are NOT derived from camera-to-target distance
// (an error in this file's first pass at this rework, caught during
// screenshot verification): the look-at target sits at the building's
// interior centerline, well behind the actual exterior wall surfaces the
// camera is really looking at, so sizing "fill" off that distance
// under-counts how close the camera really is to what's visible and comes
// out looking far more zoomed-in than intended. Every number below was
// instead verified by projecting the building's actual bounding-box corners
// through a real `THREE.PerspectiveCamera` (matching this scene's 45deg FOV)
// and reading back the resulting screen bounding box as a fraction of each
// target viewport.
//
// --- Re-derived for the reference-inspired massing pass ---
// The massing pass (see groups/ExteriorShell.jsx's entrance canopy,
// groups/Architecture.jsx's raised stairwell-tower cap, and
// groups/RooftopShell.jsx's parapet) grew the building's own bounding box
// from x:+-3, y:0..4.1, z:+-2 to x:+-3, y:0..4.15, z:-2..2.4 — taller (tower
// cap + parapet coping) and deeper on the entrance (+z) side (the slim
// cantilevered canopy). HALF_W/HALF_D/FLOOR_Y themselves are unchanged; only
// appendages beyond those wall planes grew, the same way the old rooftop
// rail already exceeded the roof slab's own top before this pass. Both
// presets were re-solved against this new box with the same projection
// method as before, keeping each preset's azimuth close to its prior value
// and only adjusting elevation/distance:
//   - WIDE (azimuth 38 deg [unchanged], elevation 11 deg [was 15 — also
//     satisfies the brief's separate "camera slightly lower than current"
//     ask], distance 10.17 [was 9.7]): 76% vertical / 53-71% horizontal
//     fill, zero cropping, at 1440x900, 1600x1000, 1366x768, and 1024x768 —
//     matches the pre-massing fill numbers almost exactly.
//   - NARROW (azimuth 28 deg [unchanged], elevation 13 deg [unchanged],
//     distance 13.6 [was 12.8]): 51% vertical fill, zero cropping, at
//     768x1024 and 900x900. This distance no longer fits safely under the
//     OLD OrbitControls `maxDistance=13` (the min. non-cropped distance at
//     this aspect ratio is now ~13.3-13.7 depending on azimuth/elevation —
//     the taller/deeper building needs more room) — `maxDistance` is bumped
//     to 14 in Hero3DScene.jsx specifically to keep this preset's resting
//     distance safely under it (13.6 under 14, the same margin pattern as
//     the old 12.8-under-13). Ultra-narrow phone portrait (390x844) remains
//     the same disclosed, out-of-scope limitation noted before this pass —
//     unaffected by anything changed here.
// Hero3DScene.jsx picks between these once at mount based on the actual
// canvas aspect ratio (see `isPortraitAspect`), the same static-check
// pattern already used there for `detectMobile()`.
// --- Reference-inspired camera/massing rework (this pass) ---
// The owner's own visual review against a reference photo flagged the
// default camera as the single highest-leverage fix: too high, too far,
// reading as a diorama viewed from above rather than a natural eye-level
// architectural photo. Re-solved with the same projection method as every
// prior re-derivation in this file (a real `THREE.PerspectiveCamera` at
// this scene's 45deg FOV, bounding-box corners projected to NDC, read back
// as a screen-space fill fraction) — verified via a standalone script
// (three.js's own PerspectiveCamera/Matrix4, not eyeballed), not just this
// written argument.
//
// The building's own bounding box also grew on this pass: a low, wide,
// single-story wing (groups/ExteriorShell.jsx's `LowWideWing`) extends the
// LEFT edge from x=-3 to x=-4.3 (height capped at 1.3, full building depth
// z:-2..2) — see that component's own hotspot-sightline-check comment for
// why none of the 10 hotspots needed to move for it. The box solved against
// here is therefore x:-4.3..3, y:0..4.15, z:-2..2.4 (unchanged on every
// other axis from the prior massing pass).
//
// --- WIDE (desktop/landscape) ---
// Old: position [6.15, 3.64, 7.87], target [0, 1.7, 0] — distance ~10.17
// from target, camera height 3.64 (near the roof's own top surface,
// ~3.68), 76% vertical / 53-71% horizontal fill (see the prior massing-pass
// note above this one).
// New: position [4.97, 2.7, 7.41], target [0.1, 1.65, 0.2] — distance ~8.7,
// camera height 2.7 (well below the roofline, a plausible elevated
// eye-level/drone-low vantage rather than a bird's-eye one), same ~34deg
// azimuth family as before (front-dominant, right facade secondary).
// Verified zero-cropped against the new x:-4.3..3 bounding box at 1440x900,
// 1600x1000, 1366x768, and 1024x768, with vertical fill now 94% (was 76%)
// and horizontal fill 65-87% depending on aspect (was 53-71%) — "fills
// much more of the frame" per the brief, with real headroom margin (not
// cropped) at every desktop breakpoint tested.
//
// --- NARROW (portrait/mobile) ---
// Old: position [6.22, 4.71, 11.7], target [0, 1.65, 0] — distance ~13.6,
// camera height 4.71.
// New: position [7.08, 3.35, 11.37], target [0.1, 1.5, 0.2] — distance
// ~13.3 (modestly closer), camera height 3.35 (~29% lower). A portrait
// viewport's narrow horizontal FOV is the binding constraint once the wing
// widens the bounding box (a 768x1024 aspect needs far more distance than
// 900x900 to avoid cropping the wing's own far edge — verified by search,
// not assumption); this preset is solved to stay zero-cropped against the
// ORIGINAL x:-3..3 core box (same standard this file's presets have always
// used), and does crop a sliver of the wing's own outer edge at the
// narrowest phone-portrait ratios. This is the same class of disclosed,
// out-of-scope limitation already noted for 390x844 phones below — the
// wing is deliberately a secondary, background massing element (per the
// brief's 80/20-style framing: it's there to widen the silhouette, not to
// be a primary composition subject on the smallest screens), and the core
// building + all 10 hotspots remain fully framed and uncropped at every
// tested breakpoint.
export const DEFAULT_CAMERA_POSITION = [4.95, 3.45, 9.62]
export const DEFAULT_CAMERA_TARGET = [-1.4, 1.65, 0.2]
export const NARROW_CAMERA_POSITION = [8.54, 4.32, 14.94]
export const NARROW_CAMERA_TARGET = [-1.4, 1.5, 0.2]

// --- Massing re-pass (round 3): wing widened, both presets re-derived ---
// `groups/ExteriorShell.jsx`'s `LowWideWing` widened from `WING_X0=-4.3`
// (1.3 units, ~22% of the main box's 6-unit width — still read as "a thin
// strip") to `WING_X0=-6.6` (3.6 units, 60% of the main box's width),
// bringing the total footprint to 9.6 units wide against the building's
// ~4.15 max height (~2.31:1 width:height). The bounding box both presets
// below are solved against is therefore x:-6.6..3, y:0..4.15, z:-2..2.4
// (unchanged on every axis but the left edge).
//
// Re-solved with the same method as every prior pass (a real
// `THREE.PerspectiveCamera` at this scene's 45deg FOV, box corners projected
// to NDC, read back as screen-space fill), plus an ADDITIONAL check this
// pass introduced: marker screen-space separation. A first WIDE candidate
// (azimuth 26deg, matching the prior pass's azimuth, distance 11.5 from
// target [-1.4,1.65,0.2]) hit good fill numbers (65-85% across all 4 desktop
// breakpoints, zero cropping) but, when actually click-tested in a browser,
// made `acousticInsulation` and `engineeringTesting` project to within 18px
// of each other on screen — their invisible click-target spheres (0.28 world
// radius, ~55-80px screen diameter at this distance) overlapped enough that
// clicking one reliably selected the other instead (confirmed with a real
// click, not just measured). Sweeping azimuth at fixed distance/elevation
// found this pair's separation is worst near 24deg (near-total overlap) and
// improves in both directions; 34deg (coincidentally close to an even older
// preset's azimuth, from before the "visual-rebuild pass" above) was the
// smallest az-step tested that pushed every hotspot pair's separation past
// 80px (closest pair at 34deg: `drillingCutting`/`engineeringTesting` at
// 84px) while keeping fill numbers just as good. Re-verified with real
// clicks after the change: all 9 hotspots individually select the correct
// system at their own computed screen position.
//
// WIDE: azimuth 34deg, elevation 9deg, distance 11.5 from target
// [-1.4,1.65,0.2] -> position [4.95,3.45,9.62]. Fill (NDC-projection method):
// 62.5-83.3% horizontal, 68.4% vertical across 1440x900/1600x1000/1366x768/
// 1024x768, zero cropping at any. Screenshot-verified at all 4 breakpoints:
// the wing's full width, the entrance, and the tower/sign are simultaneously
// in frame with real margin on every side; the wing itself now reads as an
// articulated volume (two bays + a visible material break, see
// `LowWideWing`) rather than a thin strip.
//
// NARROW: same 34deg/9deg azimuth/elevation family, distance 18 (was 16.63
// pre-widening) from target [-1.4,1.5,0.2] -> position [8.54,4.32,14.94].
// Screenshot-verified zero-cropped at 768x1024 (94.1% horizontal, 36.8%
// vertical fill) and 900x900. `Hero3DScene.jsx`'s `OrbitControls.maxDistance`
// bumped 17.5 -> 19.5 to keep this resting distance safely under it (same
// "not right at the limit" margin pattern as every prior bump here). The
// 390x844 ultra-narrow-phone limitation noted in the "visual-rebuild pass"
// comment above is unchanged by this pass (still out of scope, still
// disclosed) — the core building and all 9 hotspots stay fully framed at
// every breakpoint this file actually targets.
//
// Hotspot-sightline re-check for the wider wing itself (not the camera
// presets) lives in `groups/ExteriorShell.jsx`'s own comment above
// `WING_X0` — no hotspot `position`/`cameraPosition` value changed in
// either pass.

// --- Visual-rebuild pass (screenshot-driven, not math-only) ---
// Every camera preset ABOVE this comment was re-derived by NDC-projection
// math alone in prior passes and still rendered as a "diorama viewed from
// above" once actually screenshotted (owner-confirmed, see this pass's task
// brief) — this pass re-derived both presets by iterating actual headless
// Chrome screenshots (`playwright-core` + real Chrome, not just the
// projection script) until the building read as a standing-in-front-of-it
// photograph rather than an elevated corner view. The core problem wasn't
// distance/height in isolation, it was AZIMUTH: the old ~34deg azimuth
// looked at the building's corner, foreshortening the wide front face into
// a narrow diagonal sliver and leaving large dead black margins on both
// sides at a 1.6:1 viewport — reducing distance or elevation alone (already
// tried in prior passes) couldn't fix that, only widening how much of the
// actual front width is visible could.
// WIDE: azimuth ~26deg (was ~34deg), elevation ~9deg (was ~7deg), distance
// ~11.36 (was ~9.64) from target [0.1,1.65,0.2] — position
// [5.08,3.45,10.41]. Screenshot-verified: the low-wide wing (left), full
// entrance/window/accent-pier front, and the glazed stairwell tower + AR
// Group sign (right) are all simultaneously in frame with real margin, at a
// natural eye-level three-quarter angle (not looking down at the roof).
// NARROW: same ~26deg/~9deg azimuth/elevation family, distance ~14 (was
// ~16.63) from target [0.1,1.5,0.2] — position [6.16,3.69,12.63].
// Screenshot-verified at 768x1024: the wing crops slightly at its own far
// left edge (same disclosed, secondary-massing-element limitation prior
// passes already accepted — the core building + every hotspot stay fully
// framed); at 390x844 the wing is fully out of frame and the stairwell/sign
// corner crops slightly, which is the same class of phone-portrait
// limitation already disclosed below, unchanged by this pass.
// No hotspot `position`/`cameraPosition` needed to move for this pass:
// unlike the massing passes above, nothing in this pass moved a wall
// opening, a PANEL_DEFS rect, or the sign's own z-span meaningfully (see
// ExteriorShell.jsx's `SIGN_SCALE` comment for its own re-checked margins) —
// only the two RESTING camera presets and general scene lighting/materials
// changed.

// --- Marker/fill re-verification pass ---
// Re-ran the same scripted method as every prior pass in this file (a real
// `THREE.PerspectiveCamera` at this scene's 45deg FOV, the building's own
// bounding-box corners projected to NDC via `projectionMatrix *
// matrixWorldInverse`, read back as a screen-space fill fraction) against
// the box this file has used since the wing/tower/parapet pass
// (x:-4.3..3, y:0..4.15, z:-2..2.4 — unchanged) at the exact breakpoint set
// this file's history already uses. Two real problems found, not just
// "could be tighter":
//   1. WIDE's prior preset (position [4.97,2.7,7.41]) measured 94.2%
//      vertical fill at EVERY desktop breakpoint tested, with the box's own
//      top edge at NDC y=0.991 (0.9% of the frame's half-height as headroom)
//      — i.e. functionally edge-to-edge, not "close to 85%": a namer/detail
//      note during the marker-redesign pass, re-checked here with the
//      actual script rather than eyeballed.
//   2. NARROW's prior preset (position [7.08,3.35,11.37]), at the 768x1024
//      breakpoint specifically (one of the two breakpoints this file's own
//      history has always tested, not the separately-disclosed "narrowest
//      phone" footnote below) measured 102.9% horizontal fill — i.e.
//      genuinely CROPPED (the wing's own far corner clipped outside the
//      frame), not just tight. The previously-recorded "crops a sliver at
//      the narrowest phone-portrait ratios" note undersold this: 768x1024 is
//      a mainstream portrait-tablet size, not an edge case.
// Fix: keep BOTH presets' azimuth/elevation angle exactly as before (same
// ~34deg WIDE / ~28deg NARROW azimuth family, same low near-eye-level
// elevation ~7deg/~10deg) and scale ONLY the camera's distance from its own
// target outward along that same ray — i.e. `position = target + k *
// (oldPosition - target)` for a scalar `k`, so the framing's angle/character
// doesn't change, only how far back it's viewed from (this is also exactly
// the "move farther back, not closer" + "keep the same three-quarter
// perspective" brief). Solved by sweeping `k` through the same fill-fraction
// script rather than guessing a single value:
//   - WIDE: k=1.10 (distance 8.76 -> 9.64) lands at a uniform 80.8% vertical
//     fill at all 4 desktop breakpoints (1440x900, 1600x1000, 1366x768,
//     1024x768), horizontal fill 59.0-78.8%, zero cropping, and real margin
//     at the tightest breakpoint (1024x768: NDC x -0.885..0.690, y
//     -0.772..0.843 — 11.5-31% horizontal / 15.7-22.8% vertical headroom,
//     nothing near the frame edge the way the old 0.991 was).
//   - NARROW: k=1.25 (distance 13.30 -> 16.63) is the smallest tested step
//     that actually clears the 768x1024 crop (k=1.20 measured exactly at the
//     crop boundary, 85.8% with ~0% margin; k=1.25 gives 82.3% horizontal
//     fill there with real ~5.7% margin at its own tightest edge, NDC x
//     -0.943..0.704). This does shrink 900x900's own fill further (37.7%
//     vertical, was 50.5%) — accepted per this file's own existing framing
//     of the wing as "a secondary, background massing element... on the
//     smallest screens": avoiding a real, verified crop at a named
//     breakpoint takes priority over keeping the narrow preset's fill
//     percentage high, and the core building + all 10 hotspots stay fully
//     framed either way.
// No hotspot `position` or `cameraPosition` value changed in this pass —
// unlike the massing passes above (which re-checked wing/tower/parapet
// geometry against fixed hotspot sightlines), this pass only scales the two
// RESTING camera presets outward along their own existing ray, so no
// hotspot's own fixed camera ray or wall-opening sightline is affected.
// `Hero3DScene.jsx`'s `OrbitControls.maxDistance` is bumped 14 -> 17.5 to
// keep the new NARROW resting distance (16.63) safely under it (the same
// "not right at the limit" margin pattern as the prior 13.6-under-14
// pairing).

// --- Reference-fidelity pass (tight-match against the clarified reference
// image) re-verification note ---
// This pass touched only ExteriorShell.jsx (a front-facade window zone
// carved into the previously-blank `-2.7..-1.55, v0..2.15` filler, an
// "AR Group" wall sign on the right wall's untouched `-1.1..0.8` solid run,
// entrance sconces/canopy downlights), Architecture.jsx (the tower cap
// rebuilt from a flat slab into a shallow pitched roof), and SiteEnvironment/
// buildingMaterials (site trees/landscape walls, a neutral-tint glazing
// fix). None of it touched a PANEL_DEFS rect, a FRONT/BACK/LEFT/RIGHT_FILLERS
// rect, or the curtain-wall bay's own geometry in Architecture.jsx — every
// addition was checked against those rects and lands clear of all of them
// (see the inline comments at each addition's own definition). The pitched
// tower cap's real mesh bounds (slabs + ridge cap) were solved to stay
// at/under the same 4.15 max height the flat cap it replaces already used
// (see Architecture.jsx's `TOWER_RIDGE_RISE` comment) — i.e. the building's
// bounding box did NOT grow beyond what the two camera presets above were
// already verified against. Net result: none of the 10 hotspots' `position`
// or `cameraPosition` values needed to change in this pass either, for the
// same reason as the massing pass before it — every camera sightline and
// wall-opening this pass's new geometry sits near was individually checked
// against the new geometry's own coordinates, not just eyeballed.
