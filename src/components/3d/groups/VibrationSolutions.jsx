import { useMemo } from 'react'
import { COLORS } from '../buildingMaterials'
import { useSystemMaterial } from '../useSystemMaterial'
import { InstancedCylinders } from '../buildingParts'

const GROUP_ID = 'vibrationSolutions'

/** Hotspot: vibrationSolutions. Rooftop mechanical unit on isolation pads. */
export default function VibrationSolutions({ activeGroup = null, hoveredGroup = null, visible = true }) {
  const roofUnitMat = useSystemMaterial(
    { color: COLORS.metal, roughness: 0.4, metalness: 0.5, emissive: COLORS.ember600 },
    GROUP_ID,
    activeGroup,
    hoveredGroup
  )
  const isoPadMat = useSystemMaterial(
    { color: COLORS.neutral600, roughness: 0.8, metalness: 0.2, emissive: COLORS.ember600 },
    GROUP_ID,
    activeGroup,
    hoveredGroup
  )

  const isoPadPositions = useMemo(
    () => [
      [1.15, 3.7, 0.15],
      [1.85, 3.7, 0.15],
      [1.15, 3.7, 0.85],
      [1.85, 3.7, 0.85],
    ],
    []
  )

  return (
    <group visible={visible}>
      <mesh position={[1.5, 3.925, 0.5]} material={roofUnitMat} dispose={null} castShadow>
        <boxGeometry args={[0.8, 0.5, 0.6]} />
      </mesh>
      <InstancedCylinders positions={isoPadPositions} radius={0.05} length={0.05} material={isoPadMat} />
    </group>
  )
}
