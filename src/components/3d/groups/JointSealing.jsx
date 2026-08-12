import { COLORS, hardwareMaterial } from '../buildingMaterials'
import { useSystemMaterial } from '../useSystemMaterial'
import { SealantBead } from '../buildingParts'

const GROUP_ID = 'jointSealing'
const HALF_W = 3
const HALF_D = 2

/** Hotspot: jointSealing. Structural joint backer + firestop sealant bead. */
export default function JointSealing({ activeGroup = null, hoveredGroup = null, visible = true }) {
  const jointMat = useSystemMaterial(
    { color: COLORS.firestopSealant, roughness: 0.65, metalness: 0.1, emissive: COLORS.ember600 },
    GROUP_ID,
    activeGroup,
    hoveredGroup
  )

  return (
    <group visible={visible}>
      <mesh position={[-HALF_W, 1.8, -HALF_D]} material={hardwareMaterial} dispose={null} castShadow>
        <boxGeometry args={[0.08, 3.6, 0.08]} />
      </mesh>
      <SealantBead position={[-HALF_W + 0.06, 1.8, -HALF_D + 0.06]} length={3.6} material={jointMat} />
    </group>
  )
}
