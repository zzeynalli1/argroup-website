import { COLORS, hardwareMaterial } from '../buildingMaterials'
import { useSystemMaterial } from '../useSystemMaterial'
import { InstancedCylinders, Pipe } from '../buildingParts'

const GROUP_ID = 'engineeringTesting'
const HALF_W = 3
const ANCHOR_X = HALF_W - 0.05
const ANCHOR_Y = 1.8
const ANCHOR_Z = 1.68
// Gauge unit mounted just below the anchor, on the SAME mullion — kept at
// (nearly) the anchor's own x/z rather than projecting outward toward the
// glazing plane (x=HALF_W, would poke through Architecture.jsx's curtain-
// wall glass) or inward toward the interior stair (Architecture.jsx's own
// stair sits at x=HALF_W-0.28=2.72, tread half-width 0.17, i.e. reaching
// x=2.89 — anything here stays at x>=2.91, clear by a real margin, not
// eyeballed: verified against that stair's own documented x/width). Only Y
// varies, so this can never intersect either neighbor.
const GAUGE_Y = ANCHOR_Y - 0.18
const ROD_TOP_Y = ANCHOR_Y - 0.06 // anchor box's own bottom face (0.12 tall, centered at ANCHOR_Y)
const ROD_BOTTOM_Y = GAUGE_Y + 0.045 // gauge housing's own top face (0.09 tall, centered at GAUGE_Y)

/**
 * Hotspot: engineeringTesting. A measurement setup against the real façade
 * anchor bracket at the curtain-wall connection (see
 * docs/argroup-knowledge-base.md's Pull-Out Test / Support Design / Load
 * Analysis / Design Engineering bundle this hotspot represents). The anchor
 * bracket alone would read as a bare connection point, not "testing" — a
 * small gauge/readout unit is clamped to the same mullion just below the
 * anchor, connected by a short measurement rod, so the assembly reads as an
 * instrumented test setup rather than an unmonitored bracket. Kept compact
 * and vertically-oriented (see the constants above) specifically to avoid
 * clipping either the glazing plane or the interior stair immediately
 * nearby — a wider horizontal rig was tried and rejected for exactly that
 * reason. The anchor bracket/bolt geometry itself is unchanged.
 */
export default function EngineeringTesting({ activeGroup = null, hoveredGroup = null, visible = true }) {
  const anchorMat = useSystemMaterial(
    { color: COLORS.steelDark, roughness: 0.4, metalness: 0.75, emissive: COLORS.ember600 },
    GROUP_ID,
    activeGroup,
    hoveredGroup
  )

  return (
    <group visible={visible}>
      {/* Façade anchor bracket — unchanged. */}
      <mesh position={[ANCHOR_X, ANCHOR_Y, ANCHOR_Z]} material={anchorMat} dispose={null} castShadow>
        <boxGeometry args={[0.12, 0.12, 0.06]} />
      </mesh>
      {/* Bolt heads — the bracket reads as fixed to the structure, not a
          floating block. */}
      <InstancedCylinders
        positions={[
          [ANCHOR_X - 0.04, ANCHOR_Y + 0.04, ANCHOR_Z],
          [ANCHOR_X - 0.04, ANCHOR_Y - 0.04, ANCHOR_Z],
        ]}
        radius={0.012}
        length={0.03}
        rotation={[0, 0, Math.PI / 2]}
        material={anchorMat}
      />

      {/* Measurement rod running from the anchor's own underside down to the
          gauge housing's own top face — real endpoints, no gap or overlap. */}
      <Pipe
        position={[ANCHOR_X, (ROD_TOP_Y + ROD_BOTTOM_Y) / 2, ANCHOR_Z]}
        radius={0.008}
        length={ROD_TOP_Y - ROD_BOTTOM_Y}
        material={anchorMat}
      />
      {/* Mounting base plate — the gauge/anchor assembly's own real fixed
          connection back to the mullion, instead of both blocks just
          touching the structure with no visible fixing. */}
      <mesh position={[ANCHOR_X - 0.028, (ANCHOR_Y + GAUGE_Y) / 2, ANCHOR_Z]} material={hardwareMaterial} dispose={null} castShadow>
        <boxGeometry args={[0.014, 0.5, 0.1]} />
      </mesh>

      {/* Gauge housing + a small dial face with an indicator needle, for a
          readable "instrumented" silhouette (no fabricated numeric readout —
          just the physical form of a measurement device). */}
      <mesh position={[ANCHOR_X, GAUGE_Y, ANCHOR_Z]} material={hardwareMaterial} dispose={null} castShadow>
        <boxGeometry args={[0.08, 0.09, 0.06]} />
      </mesh>
      <mesh position={[ANCHOR_X, GAUGE_Y, ANCHOR_Z + 0.031]} material={anchorMat} dispose={null}>
        <circleGeometry args={[0.026, 16]} />
      </mesh>
      <mesh
        position={[ANCHOR_X, GAUGE_Y, ANCHOR_Z + 0.033]}
        rotation={[0, 0, Math.PI / 5]}
        material={hardwareMaterial}
        dispose={null}
      >
        <boxGeometry args={[0.003, 0.018, 0.001]} />
      </mesh>
    </group>
  )
}
