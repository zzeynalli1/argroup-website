import { COLORS } from '../buildingMaterials'
import { useSystemMaterial } from '../useSystemMaterial'
import { InstancedCylinders } from '../buildingParts'

const GROUP_ID = 'engineeringTesting'
const HALF_W = 3

/** Hotspot: engineeringTesting. Façade anchor bracket at the curtain-wall connection. */
export default function EngineeringTesting({ activeGroup = null, hoveredGroup = null, visible = true }) {
  const anchorMat = useSystemMaterial(
    { color: COLORS.steelDark, roughness: 0.4, metalness: 0.75, emissive: COLORS.ember600 },
    GROUP_ID,
    activeGroup,
    hoveredGroup
  )

  return (
    <group visible={visible}>
      <mesh position={[HALF_W - 0.05, 1.8, 1.68]} material={anchorMat} dispose={null} castShadow>
        <boxGeometry args={[0.12, 0.12, 0.06]} />
      </mesh>
      {/* Bolt heads (Phase 3) — the bracket reads as fixed to the structure,
          not a floating block. */}
      <InstancedCylinders
        positions={[
          [HALF_W - 0.09, 1.84, 1.68],
          [HALF_W - 0.09, 1.76, 1.68],
        ]}
        radius={0.012}
        length={0.03}
        rotation={[0, 0, Math.PI / 2]}
        material={anchorMat}
      />
    </group>
  )
}
