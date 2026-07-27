/**
 * Hotspot positions for Hero3DScene. `position` is where the marker sits on
 * the cutaway building; `cameraTarget` is where the camera itself moves to
 * (OrbitControls' look-at target becomes `position`) when a hotspot is
 * selected. `icon` is a lucide-react icon name, used for the panel's mini
 * hotspot-selector strip. Display copy (name/description/systemType/
 * fireRating/certification/applicationArea) lives in
 * locales/<locale>/home.json under `building3d.hotspots.<key>` — real values
 * stay "—" until confirmed against docs/argroup-knowledge-base.md (see
 * CLAUDE.md: no fabricated data).
 */
export const hotspots = [
  {
    id: 1,
    key: 'cableTray',
    icon: 'Cable',
    position: [-2, 1.05, -1.3],
    cameraTarget: [-4.5, 2.2, 3],
  },
  {
    id: 2,
    key: 'metalPipe',
    icon: 'Cylinder',
    position: [0, 1.2, -1],
    cameraTarget: [1, 3, 4],
  },
  {
    id: 3,
    key: 'pvcPipe',
    icon: 'Cylinder',
    position: [1.6, 1.2, -1],
    cameraTarget: [4, 2.8, 4],
  },
  {
    id: 4,
    key: 'hvacDuct',
    icon: 'Wind',
    position: [-1.2, 2.4, -1],
    cameraTarget: [-3.5, 4.2, 4],
  },
  {
    id: 5,
    key: 'floorWallJoint',
    icon: 'Layers',
    position: [2.9, 1.2, -1.9],
    cameraTarget: [5.5, 3, -1],
  },
  {
    id: 6,
    key: 'curtainWall',
    icon: 'PanelTop',
    position: [3, 1.8, 1.7],
    cameraTarget: [6.5, 3, 5],
  },
  {
    id: 7,
    key: 'structuralJoint',
    icon: 'Link2',
    position: [-3, 1.8, -1.95],
    cameraTarget: [-6, 3, 1],
  },
  {
    id: 8,
    key: 'landscape',
    icon: 'TreePine',
    // Ground level, out in the yard beyond the building footprint (not a
    // building system) — panel uses `labelOverrideKey` since "System Type"
    // doesn't fit a landscaping/exterior-design point.
    position: [4.8, 0.05, 2.8],
    cameraTarget: [8, 2.5, 6],
    labelOverrideKey: 'serviceType',
  },
  {
    id: 9,
    key: 'exteriorDesign',
    icon: 'Building',
    // On the left wall's outer face (cladding/facade), distinct from the
    // curtainWall glazing hotspot on the opposite side.
    position: [-3.05, 2.2, 0.5],
    cameraTarget: [-6.5, 3, 4],
    labelOverrideKey: 'serviceType',
  },
]

export const DEFAULT_CAMERA_POSITION = [7, 5, 9]
export const DEFAULT_CAMERA_TARGET = [0, 1.5, 0]
