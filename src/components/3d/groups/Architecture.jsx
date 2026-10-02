import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import {
  COLORS,
  curtainWallGlassMaterial,
  framingMaterial,
  hardwareMaterial,
  galvanizedMaterial,
  stairTreadMaterial,
  panelCharcoalMaterial,
} from '../buildingMaterials'
import { InstancedBoxes, InstancedCylinders } from '../buildingParts'

const HALF_W = 3

// The curtain-wall bay fills the building's open front-right corner (see
// Shell.jsx's right wall: solid panel runs z -1.8..0.8, nothing beyond
// that). Sits fully within the real footprint (z 0.82..1.98), flush against
// the solid wall's own end and inset from the slab edge.
const BAY_Z_START = 0.82
const BAY_Z_END = 1.98
const BAY_Y_START = 0.08
// Rises above the main roofline (parapet top 3.96 — see RooftopShell.jsx's
// `Parapet`) so this bay reads as a glazed stairwell tower. Everything below
// (grid rows, transoms, anchor clips at y=1.2/2.4) is computed off this
// constant or off the untouched 1.2/2.4 floor lines, so changing it only
// stretches the top glazing row (2.4..BAY_Y_END) taller — no existing
// anchor moves.
const BAY_Y_END = 4.0
// Pitched dark enclosure capping the tower — two tilted slabs meeting at a
// ridge, rather than a flat cap. Apex/ridge geometry is tuned so the mesh's
// real highest point stays at/under 4.15, the value both camera presets in
// hotspots3d.js are verified against — don't raise this without
// re-deriving those. The slab's own half-thickness projects a little
// further vertically at the ridge (see the inline math below), and the
// ridge flashing bar sits on top of that — both accounted for so the mesh's
// real highest point lands at/under 4.15, not just this centerline number.
const TOWER_RIDGE_RISE = 0.11
const TOWER_SLAB_THK = 0.045

// Perimeter posts (bay edges) + 2 interior mullions splitting the bay into
// 3 vertical lites. The second interior mullion (z=1.66) lands right next
// to the EngineeringTesting group's fixed curtain-wall anchor bracket at
// x=2.95, z=1.68 (see groups/EngineeringTesting.jsx) — so that bracket reads
// as fixed to a real mullion instead of floating mid-panel.
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
 * Static envelope: curtain-wall glazing bay. A proper stick-frame system —
 * perimeter frame + interior mullions/transoms forming a 3x3 grid,
 * individually inset glazing lites with real thickness, a projecting
 * sill/flashing at the base, and small anchor clips tying the interior
 * mullions back to the floor slabs.
 */
export default function Architecture({ activeGroup = null, hoveredGroup = null, visible = true }) {
  const isFacadeEmphasized = FACADE_HOTSPOT_GROUPS.has(activeGroup) || FACADE_HOTSPOT_GROUPS.has(hoveredGroup)

  // Base tint/opacity now comes from `curtainWallGlassMaterial` (see that
  // material's own comment: this bay used to share the shared, brighter
  // `glazingMaterial`, which is what made it read as a blown-out white wall
  // and overpower the front facade) — only the emissive highlight on
  // select/hover still comes from this per-mesh material, same as before.
  const highlightGlassMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: curtainWallGlassMaterial.color,
        transparent: true,
        opacity: isFacadeEmphasized ? 0.16 : curtainWallGlassMaterial.opacity,
        roughness: curtainWallGlassMaterial.roughness,
        metalness: curtainWallGlassMaterial.metalness,
        emissive: isFacadeEmphasized ? COLORS.ember600 : curtainWallGlassMaterial.emissive,
        emissiveIntensity: isFacadeEmphasized ? 0.3 : curtainWallGlassMaterial.emissiveIntensity,
        envMapIntensity: curtainWallGlassMaterial.envMapIntensity,
        side: THREE.DoubleSide,
      }),
    [isFacadeEmphasized]
  )
  // These two materials are handed to meshes via a plain `material={...}`
  // prop (not a JSX `<meshStandardMaterial>` child), so R3F never takes
  // ownership of them for auto-dispose — only each mesh's own fiber unmount
  // would trigger that, which doesn't happen here (these meshes are
  // static/always mounted). Without this, every time `isFacadeEmphasized`
  // flips (each drillingCutting/engineeringTesting hover or select) recreated
  // a brand new material above and left the previous one's compiled GPU
  // program/uniforms resident with nothing left referencing it — same leak
  // `useSystemMaterial.js` already guards against for every other group.
  useEffect(() => () => highlightGlassMat.dispose(), [highlightGlassMat])

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
  useEffect(() => () => highlightFrameMat.dispose(), [highlightFrameMat])

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
          material={p.isRightColumn ? highlightGlassMat : curtainWallGlassMaterial}
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

      {/* Small, slightly pitched dark cap over the tower's own footprint,
          raising this corner above the main roofline (parapet top 3.96 —
          RooftopShell.jsx) so it reads as a stairwell tower with its own
          roof. Two tilted slabs meeting at a shared ridge point, each
          derived from its own two real endpoints (its base corner and the
          shared ridge point) via `atan2`/distance below — geometrically
          guaranteed to make both slabs meet exactly at the same ridge point
          with mirrored angles, rather than relying on eyeballed offsets. */}
      {(() => {
        const towerCenterX = HALF_W - 0.5
        const halfSpan = 0.5 // tower footprint half-width (1.0 total, same as before)
        const slabZ = bayWidth + 0.3
        const ridgeOverlap = 0.04 // small extra length past the ridge point so the two slabs visibly overlap/close the seam, covered by the ridge cap below
        const ridgeX = towerCenterX
        const ridgeY = BAY_Y_END + TOWER_RIDGE_RISE

        // Returns { center:[x,y], length, angle } for a slab running from
        // (x0,y0) to (x1,y1) in the local X-Y (cross-section) plane,
        // extended by `overlap` past (x1,y1) — verified by construction:
        // the slab's own end (local x = +length/2, before the overlap
        // extension) lands exactly on (x1,y1), and (local x = -length/2)
        // lands exactly on (x0,y0), for ANY angle, since `angle` is derived
        // directly from the two points via atan2 rather than assumed.
        function slopeSlab(x0, y0, x1, y1, overlap) {
          const dx = x1 - x0
          const dy = y1 - y0
          const baseLen = Math.sqrt(dx * dx + dy * dy)
          const ux = dx / baseLen
          const uy = dy / baseLen
          const length = baseLen + overlap
          return {
            center: [x0 + ux * (length / 2), y0 + uy * (length / 2)],
            length,
            angle: Math.atan2(dy, dx),
          }
        }

        const left = slopeSlab(towerCenterX - halfSpan, BAY_Y_END, ridgeX, ridgeY, ridgeOverlap)
        const right = slopeSlab(towerCenterX + halfSpan, BAY_Y_END, ridgeX, ridgeY, ridgeOverlap)

        return (
          <>
            <mesh
              position={[left.center[0], left.center[1], bayCenterZ]}
              rotation={[0, 0, left.angle]}
              material={panelCharcoalMaterial}
              dispose={null}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[left.length, TOWER_SLAB_THK, slabZ]} />
            </mesh>
            <mesh
              position={[right.center[0], right.center[1], bayCenterZ]}
              rotation={[0, 0, right.angle]}
              material={panelCharcoalMaterial}
              dispose={null}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[right.length, TOWER_SLAB_THK, slabZ]} />
            </mesh>
            {/* Ridge flashing bar along the apex, centered on the shared
                ridge point both slabs actually meet at. */}
            <mesh position={[ridgeX, ridgeY, bayCenterZ]} material={galvanizedMaterial} dispose={null} castShadow>
              <boxGeometry args={[0.08, 0.022, slabZ]} />
            </mesh>
          </>
        )
      })()}

      {/* Interior stair, visible through the glazing bay — individual
          stepped treads (not the old two continuous flat ramps, which read
          from outside as one big opaque diagonal mass that made the whole
          bay look like solid wall rather than glass with stairs behind it).
          Three short flights (one per floor gap) with a landing slab at the
          top of each, plus a simple sloped guardrail — enough real "stair"
          silhouette to read correctly at this camera distance, without
          pretending to be a fully-detailed switchback (this bay is too
          shallow in X for a real return flight). */}
      {(() => {
        const stairX = HALF_W - 0.28
        const z0 = 1.0
        const z1 = 1.85
        const stepCount = 6
        const stepDepth = (z1 - z0) / stepCount + 0.02
        const flights = [
          { y0: 0.25, y1: 1.1 },
          { y0: 1.35, y1: 2.2 },
          { y0: 2.45, y1: 3.3 },
        ]
        const treadPositions = flights.flatMap(({ y0, y1 }) =>
          Array.from({ length: stepCount }, (_, i) => {
            const t = (i + 0.5) / stepCount
            return [stairX, y0 + (y1 - y0) * t, z0 + (z1 - z0) * t]
          })
        )
        const railPostPositions = flights.flatMap(({ y0, y1 }) =>
          [0.15, 0.5, 0.85].map((t) => [stairX, y0 + (y1 - y0) * t + 0.42, z0 + (z1 - z0) * t])
        )
        return (
          <>
            <InstancedBoxes positions={treadPositions} size={[0.34, 0.04, stepDepth]} material={stairTreadMaterial} />
            {flights.map(({ y1 }, i) => (
              <mesh key={i} position={[stairX, y1 + 0.02, z1 + 0.02]} material={hardwareMaterial} dispose={null} castShadow receiveShadow>
                <boxGeometry args={[0.4, 0.035, 0.34]} />
              </mesh>
            ))}
            {/* Simple sloped guardrail: posts following each flight's rise,
                capped with a top rail per flight. */}
            <InstancedCylinders positions={railPostPositions} radius={0.012} length={0.8} material={hardwareMaterial} />
            {flights.map(({ y0, y1 }, i) => {
              const dz = z1 - z0
              const dy = y1 - y0
              // Rotation around X maps local +Y (the rail box's own length
              // axis, args[1]) to world (0, cos(angle), sin(angle)) — so
              // angle must be atan2(dz, dy), not atan2(dy, dz), to align
              // that axis with the actual (dy, dz) rise/run direction.
              const railAngle = Math.atan2(dz, dy)
              const railLength = Math.sqrt(dy * dy + dz * dz)
              return (
                <mesh
                  key={i}
                  position={[stairX, (y0 + y1) / 2 + 0.42, (z0 + z1) / 2]}
                  rotation={[railAngle, 0, 0]}
                  material={hardwareMaterial}
                  dispose={null}
                  castShadow
                >
                  <boxGeometry args={[0.02, railLength, 0.02]} />
                </mesh>
              )
            })}
          </>
        )
      })()}
    </group>
  )
}
