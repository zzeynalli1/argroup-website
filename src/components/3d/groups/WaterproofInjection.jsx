import { COLORS } from '../buildingMaterials'
import { useSystemMaterial } from '../useSystemMaterial'

const GROUP_ID = 'waterproofInjection'

/** Hotspot: waterproofInjection. Injection port + gasket at the wall/floor junction. */
export default function WaterproofInjection({ activeGroup = null, hoveredGroup = null, visible = true }) {
  const injectionMat = useSystemMaterial(
    { color: COLORS.neutral600, roughness: 0.4, metalness: 0.5, emissive: COLORS.ember600 },
    GROUP_ID,
    activeGroup,
    hoveredGroup
  )

  return (
    <group visible={visible}>
      <mesh position={[-2.5, 0.25, -1.9]} rotation={[Math.PI / 2, 0, 0]} material={injectionMat} dispose={null} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.1, 12]} />
      </mesh>
      <mesh position={[-2.5, 0.25, -1.87]} rotation={[Math.PI / 2, 0, 0]} material={injectionMat} dispose={null}>
        <torusGeometry args={[0.06, 0.012, 6, 16]} />
      </mesh>
    </group>
  )
}
