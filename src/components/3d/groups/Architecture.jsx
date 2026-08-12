import { useMemo } from 'react'
import * as THREE from 'three'
import { COLORS, glazingMaterial, framingMaterial, hardwareMaterial, galvanizedMaterial } from '../buildingMaterials'
import { InstancedBoxes } from '../buildingParts'

const HALF_W = 3

// The curtain-wall bay fills the building's open front-right corner (see
// Shell.jsx's right wall: solid panel runs z -1.8..0.8, nothing beyond
// that). Previously the glazing pane was centered at z=1.65 with a 1.4
// width (z 0.95..2.35) — 0.35 units past the building's own z=2 edge, i.e.
// floating past the slab it should be sitting on. Tightened here to sit
// fully within the real footprint (z 0.82..1.98), flush against the solid
// wall's own end and inset from the slab edge.
const BAY_Z_START = 0.82
const BAY_Z_END = 1.98
const BAY_Y_START = 0.08
const BAY_Y_END = 3.52

// Perimeter posts (bay edges) + 2 interior mullions splitting the bay into
// 3 vertical lites. The second interior mullion (z=1.66) lands right next
// to the EngineeringTesting group's fixed curtain-wall anchor bracket at
// x=2.95, z=1.68 (see groups/EngineeringTesting.jsx, untouched this pass) —
// so that bracket now reads as fixed to a real mullion instead of floating
// mid-panel.
const VERT_Z = [BAY_Z_START, 1.14, 1.66, BAY_Z_END]
// Perimeter top/bottom + transoms at the two upper floor lines (y=1.2/2.4)
// concealing the slab edges behind the glass, matching FLOOR_Y in Shell.jsx.
const HORIZ_Y = [BAY_Y_START, 1.2, 2.4, BAY_Y_END]

const FRAME_DEPTH = 0.05 // profile depth, proud of the wall face (local X)
const FRAME_WIDTH = 0.055 // profile width as seen in elevation
const GLASS_INSET = 0.035
const GLASS_THICKNESS = 0.02

// `drillingCutting`'s cored PVC sleeve and `engineeringTesting`'s anchor
// bracket both sit at/behind this bay's rightmost glazing column (the last
// VERT_Z span, z 1.66..1.98 — see the module comment above on why the
// second mullion lands next to EngineeringTesting's own bracket). Neither
// is concealed by anything opaque here — a curtain wall doesn't slide open
// to let you see what's already visible through its own glass, so unlike
// ExteriorShell's solid-wall hotspots, the context-matched "reveal" for
// these two is emphasizing the real glazing/frame members already there,
// not fabricating a panel motion that wouldn't exist in reality.
const FACADE_HOTSPOT_GROUPS = new Set(['drillingCutting', 'engineeringTesting'])
const RIGHT_COLUMN_Z0 = 1.66
const RIGHT_COLUMN_Z1 = BAY_Z_END

/**
 * Static envelope: curtain-wall glazing bay.
 *
 * Phase 1 rebuild: a proper stick-frame system (perimeter frame + interior
 * mullions/transoms forming a 3x3 grid, individually inset glazing lites
 * with real thickness instead of one zero-thickness rotated plane, a
 * projecting sill/flashing at the base, and small anchor clips tying the
 * interior mullions back to the floor slabs) — replaces the prior single
 * pane + 5 flat horizontal bars.
 */
export default function Architecture({ activeGroup = null, hoveredGroup = null, visible = true }) {
  const isFacadeEmphasized = FACADE_HOTSPOT_GROUPS.has(activeGroup) || FACADE_HOTSPOT_GROUPS.has(hoveredGroup)

  const highlightGlassMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: glazingMaterial.color,
        transparent: true,
        opacity: isFacadeEmphasized ? 0.16 : glazingMaterial.opacity,
        roughness: glazingMaterial.roughness,
        metalness: glazingMaterial.metalness,
        emissive: isFacadeEmphasized ? COLORS.ember600 : '#000000',
        emissiveIntensity: isFacadeEmphasized ? 0.3 : 0,
        envMapIntensity: glazingMaterial.envMapIntensity,
        side: THREE.DoubleSide,
      }),
    [isFacadeEmphasized]
  )

  const highlightFrameMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: framingMaterial.color,
        roughness: framingMaterial.roughness,
        metalness: framingMaterial.metalness,
        emissive: isFacadeEmphasized ? COLORS.ember600 : '#000000',
        emissiveIntensity: isFacadeEmphasized ? 0.5 : 0,
      }),
    [isFacadeEmphasized]
  )

  const grid = useMemo(() => {
    const panels = []
    for (let r = 0; r < HORIZ_Y.length - 1; r += 1) {
      const y0 = HORIZ_Y[r]
      const y1 = HORIZ_Y[r + 1]
      for (let c = 0; c < VERT_Z.length - 1; c += 1) {
        const z0 = VERT_Z[c]
        const z1 = VERT_Z[c + 1]
        panels.push({
          key: `${r}-${c}`,
          y: (y0 + y1) / 2,
          z: (z0 + z1) / 2,
          h: y1 - y0 - GLASS_INSET * 2,
          w: z1 - z0 - GLASS_INSET * 2,
          isRightColumn: z0 === RIGHT_COLUMN_Z0 && z1 === RIGHT_COLUMN_Z1,
        })
      }
    }
    return panels
  }, [])

  const bayCenterZ = (BAY_Z_START + BAY_Z_END) / 2
  const bayHeight = BAY_Y_END - BAY_Y_START
  const bayWidth = BAY_Z_END - BAY_Z_START

  const anchorClipPositions = useMemo(
    () => [
      [HALF_W - 0.045, 1.2, 1.14],
      [HALF_W - 0.045, 2.4, 1.14],
      [HALF_W - 0.045, 1.2, 1.66],
      [HALF_W - 0.045, 2.4, 1.66],
    ],
    []
  )

  return (
    <group visible={visible}>
      {/* Glazing lites — thin boxes (real thickness) instead of a paper-flat
          plane, individually inset from the surrounding frame for a visible
          reveal, so the panel reads as glass set into a frame rather than a
          single sheet. */}
      {grid.map((p) => (
        <mesh
          key={p.key}
          position={[HALF_W, p.y, p.z]}
          material={p.isRightColumn ? highlightGlassMat : glazingMaterial}
          dispose={null}
          receiveShadow
        >
          <boxGeometry args={[GLASS_THICKNESS, p.h, p.w]} />
        </mesh>
      ))}

      {/* Vertical posts + interior mullions, full bay height. The two
          mullions bounding the rightmost lite column (z=1.66/BAY_Z_END) get
          the façade-emphasis material when drillingCutting/engineeringTesting
          is active/hovered — see FACADE_HOTSPOT_GROUPS above. */}
      {VERT_Z.map((z) => (
        <mesh
          key={`v-${z}`}
          position={[HALF_W + FRAME_DEPTH / 2 - 0.01, (BAY_Y_START + BAY_Y_END) / 2, z]}
          material={z === RIGHT_COLUMN_Z0 || z === RIGHT_COLUMN_Z1 ? highlightFrameMat : framingMaterial}
          dispose={null}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[FRAME_DEPTH, bayHeight, FRAME_WIDTH]} />
        </mesh>
      ))}

      {/* Horizontal transoms (perimeter top/bottom + floor-line concealment
          members), full bay width. */}
      {HORIZ_Y.map((y) => (
        <mesh
          key={`h-${y}`}
          position={[HALF_W + FRAME_DEPTH / 2 - 0.01, y, bayCenterZ]}
          material={framingMaterial}
          dispose={null}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[FRAME_DEPTH, FRAME_WIDTH, bayWidth]} />
        </mesh>
      ))}

      {/* Sill/flashing at the base — projects further out than the frame
          face and slightly wider than the bay, the real drip-edge detail
          that sheds water off the glazing instead of the frame ending flush
          with nothing beneath it. */}
      <mesh
        position={[HALF_W + 0.02, BAY_Y_START - 0.02, bayCenterZ]}
        material={galvanizedMaterial}
        dispose={null}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.1, 0.025, bayWidth + 0.06]} />
      </mesh>

      {/* Anchor clips tying the interior mullions back to the floor slabs
          at each upper floor line — the real fixed connection a curtain
          wall needs at every level it passes, not just a post standing on
          its own. */}
      <InstancedBoxes positions={anchorClipPositions} size={[0.05, 0.035, 0.03]} material={hardwareMaterial} />
    </group>
  )
}
