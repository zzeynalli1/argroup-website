/**
 * Hotspot registry for Hero3DScene. `position` is where the marker sits on
 * the cutaway building and the orbit look-at point; `cameraPosition` is
 * where the camera flies to when the hotspot is selected. `icon` is a
 * lucide-react icon name used in the panel's hotspot-selector strip.
 * Display copy (name/description/systemType/fireRating/certification/
 * applicationArea) lives in locales/<locale>/home.json under
 * `building3d.hotspots.<key>`.
 *
 * `group` is the id of the entry in components/3d/groups/index.js that this
 * hotspot highlights/dims on select. `category` is the discipline (for
 * future filtering, not yet built). `status` is 'current' (modeled) or
 * 'future' (reserved, not modeled — see the reserved-zone table in
 * .claude/agents/3d-modeling-agent.md); Building3DSection.jsx's InfoPanel
 * branches on it. `highlightColor` is an optional per-hotspot override of
 * the group's default highlight color; null means "use the group default."
 *
 * Every hotspot maps to a real AR Group service (see the knowledge base's
 * "Services" section). `id` only needs to be stable/unique, not sequential
 * — id 8 (`waterproofInjection`) was removed and is not reused.
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
    // Camera ray must stay above y 1.37 (the LowWideWing roof height in
    // ExteriorShell.jsx) for its entire crossing of the wing's x-span,
    // otherwise the shot clips through the wing's interior/roof underside.
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
    // Kept clear of ExteriorShell.jsx's ARGroupSign (x~3.1, z -0.72..0.42,
    // y 1.52..2.18), which otherwise dominates the frame at this distance.
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
    // y matches VibrationSolutions.jsx's equipment-unit center (3.992).
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
    // Sits behind the curtain-wall glazing (Architecture.jsx), so the view
    // crosses the bay's mullions by design — no PANEL_DEFS entry needed.
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
    // Also behind the curtain-wall glazing, same as drillingCutting above.
    cameraPosition: [4.6, 2.35, 3.2],
    highlightColor: null,
  },
]

// Resting camera presets (WIDE for landscape/desktop, NARROW for portrait/
// mobile). Hero3DScene.jsx picks between them at mount based on the canvas
// aspect ratio (see `isPortraitAspect`). Both are solved against the
// building's full bounding box (including LowWideWing in ExteriorShell.jsx)
// by projecting its corners through a real THREE.PerspectiveCamera at this
// scene's 45deg FOV, so the whole building and all hotspot markers stay in
// frame without cropping across common breakpoints, with enough separation
// between adjacent hotspots' screen-space click targets to select correctly.
// Hero3DScene.jsx's OrbitControls.maxDistance must stay comfortably above
// the NARROW preset's distance from its target.
export const DEFAULT_CAMERA_POSITION = [4.95, 3.45, 9.62]
export const DEFAULT_CAMERA_TARGET = [-1.4, 1.65, 0.2]
export const NARROW_CAMERA_POSITION = [8.54, 4.32, 14.94]
export const NARROW_CAMERA_TARGET = [-1.4, 1.5, 0.2]
