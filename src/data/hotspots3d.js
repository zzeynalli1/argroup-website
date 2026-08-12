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
 * hotspot highlights/dims on select — for all 10 hotspots below it equals
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
 * All 10 hotspots map to a real AR Group service (see the KB's "Services"
 * section) — no landscaping/exterior-cladding filler hotspots, and no
 * duplicate coverage of the same service across multiple points.
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
    cameraPosition: [2.5, 3.3, 3.5],
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
    cameraPosition: [-4.5, 2.2, 3],
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
    cameraPosition: [-3.5, 4.2, 4],
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
    cameraPosition: [5.5, 3, -1],
    highlightColor: null,
  },
  {
    id: 7,
    key: 'vibrationSolutions',
    group: 'vibrationSolutions',
    category: 'structural',
    status: 'current',
    icon: 'Activity',
    position: [1.5, 3.9, 0.5],
    cameraPosition: [3.5, 6, 4],
    highlightColor: null,
  },
  {
    id: 8,
    key: 'waterproofInjection',
    group: 'waterproofInjection',
    category: 'structural',
    status: 'current',
    icon: 'Droplets',
    position: [-2.5, 0.25, -1.92],
    cameraPosition: [-5.5, 1.8, -4],
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
    cameraPosition: [6.5, 3, 5],
    highlightColor: null,
  },
]

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
// instead verified by projecting the building's actual bounding-box
// corners (x:+-3, y:0..4.1, z:+-2) through a real `THREE.PerspectiveCamera`
// (matching this scene's 45deg FOV) and reading back the resulting screen
// bounding box as a fraction of each target viewport:
//   - WIDE (azimuth 38 deg, elevation 15 deg, distance 9.7): ~76% vertical /
//     ~54-72% horizontal fill with zero cropping at 1440x900, 1600x1000,
//     1366x768, and 1024x768.
//   - NARROW (azimuth 28 deg, elevation 13 deg, distance 12.8, safely under
//     OrbitControls' existing maxDistance=13 rather than sitting right at
//     it): ~52% vertical fill, zero horizontal cropping at 768x1024 and
//     900x900. Ultra-narrow phone portrait (390x844) is the one case that
//     remains a real, disclosed limitation: fitting this building's full
//     6-unit width inside a 45deg-FOV frame that narrow is not achievable
//     without either changing the FOV per-aspect-ratio or raising
//     OrbitControls' maxDistance well past 13, neither of which this pass
//     makes (out of scope / avoids extending OrbitControls beyond what's
//     already justified) — at 390x844 this preset now crops only the far
//     (least important, most shadowed) back corner rather than roughly half
//     the building the way the pre-this-pass NARROW preset did.
// Hero3DScene.jsx picks between these once at mount based on the actual
// canvas aspect ratio (see `isPortraitAspect`), the same static-check
// pattern already used there for `detectMobile()`.
export const DEFAULT_CAMERA_POSITION = [5.77, 4.26, 7.38]
export const DEFAULT_CAMERA_TARGET = [0, 1.75, 0]
export const NARROW_CAMERA_POSITION = [5.86, 4.58, 11.01]
export const NARROW_CAMERA_TARGET = [0, 1.7, 0]
