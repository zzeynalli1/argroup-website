import { COLORS } from '../buildingMaterials'
import { useSystemMaterial } from '../useSystemMaterial'

const GROUP_ID = 'acousticInsulation'

/** Hotspot: acousticInsulation. Insulation strip at the floor-wall junction. */
export default function AcousticInsulation({ activeGroup = null, hoveredGroup = null, visible = true }) {
  const acousticMat = useSystemMaterial(
    { color: '#5B5F63', roughness: 0.95, metalness: 0.02, emissive: COLORS.ember600 },
    GROUP_ID,
    activeGroup,
    hoveredGroup
  )

  return (
    <group visible={visible}>
      <mesh position={[2.9, 1.23, -1.9]} material={acousticMat} dispose={null} castShadow>
        <boxGeometry args={[0.5, 0.06, 0.08]} />
      </mesh>
    </group>
  )
}
