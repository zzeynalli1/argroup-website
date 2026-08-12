import { useMemo } from 'react'
import { COLORS } from '../buildingMaterials'
import { useSystemMaterial } from '../useSystemMaterial'
import { DuctSegment, InstancedBoxes } from '../buildingParts'

const GROUP_ID = 'mechanicalSupport'

/**
 * Hotspot: mechanicalSupport. A generic MEP conduit run held up by hanger
 * rods with support clamps — the support hardware is the point of this
 * real AR Group service (see docs/argroup-knowledge-base.md "Support &
 * Fitting Systems" / "Support Design"), the conduit itself is just
 * unbranded context.
 *
 * Deliberately NOT modeled as HVAC ductwork: no elbow/vertical riser
 * implying a connection to rooftop air-handling equipment, no supply-air
 * grille/register. AR Group does not offer HVAC as a service — see the
 * "IMPORTANT BUSINESS REQUIREMENT" note in .claude/agents/3d-modeling-agent.md.
 */
export default function MechanicalSupport({ activeGroup = null, hoveredGroup = null, visible = true }) {
  const conduitMat = useSystemMaterial(
    { color: COLORS.galvanized, roughness: 0.38, metalness: 0.6, emissive: COLORS.ember600 },
    GROUP_ID,
    activeGroup,
    hoveredGroup
  )
  const hangerMat = useSystemMaterial(
    { color: COLORS.metal, roughness: 0.45, metalness: 0.7, emissive: COLORS.ember600 },
    GROUP_ID,
    activeGroup,
    hoveredGroup
  )

  const hangerPositions = useMemo(
    () => [
      [-1.7, 3.11, -1],
      [-0.7, 3.11, -1],
    ],
    []
  )
  // Top mounting flange for each hanger rod, right where it meets the
  // ceiling slab (rod top at y=3.60, matching FLOOR_Y) — the real bolted
  // connection point, not a rod that just visually stops at the slab.
  const flangePositions = useMemo(
    () => [
      [-1.7, 3.6, -1],
      [-0.7, 3.6, -1],
    ],
    []
  )
  const clampPositions = useMemo(
    () => [
      [-1.7, 2.62, -1],
      [-0.7, 2.62, -1],
    ],
    []
  )

  return (
    <group visible={visible}>
      <DuctSegment position={[-1.2, 2.4, -1]} size={[1.4, 0.45, 0.45]} material={conduitMat} />
      <InstancedBoxes positions={hangerPositions} size={[0.04, 0.98, 0.04]} material={hangerMat} />
      <InstancedBoxes positions={flangePositions} size={[0.12, 0.02, 0.12]} material={hangerMat} />
      {/* Clamp brackets where each hanger rod meets the conduit — the
          "support" detail this hotspot is actually about. */}
      <InstancedBoxes positions={clampPositions} size={[0.1, 0.05, 0.5]} material={hangerMat} />
    </group>
  )
}
