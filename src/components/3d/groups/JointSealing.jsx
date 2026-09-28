import { COLORS, hardwareMaterial, concreteMaterial } from '../buildingMaterials'
import { useSystemMaterial } from '../useSystemMaterial'
import { SealantBead } from '../buildingParts'

const GROUP_ID = 'jointSealing'
const HALF_W = 3
const HALF_D = 2

/**
 * Hotspot: jointSealing. A real corner control joint at the building's own
 * left/back wall corner: two adjoining concrete wall-edge returns with a
 * visible gap between them (not just a bead floating between two flat
 * planes), a backer rod set into that gap, and the firestop sealant bead
 * tooled over it.
 */
export default function JointSealing({ activeGroup = null, hoveredGroup = null, visible = true }) {
  const jointMat = useSystemMaterial(
    { color: COLORS.firestopSealant, roughness: 0.65, metalness: 0.1, emissive: COLORS.ember600 },
    GROUP_ID,
    activeGroup,
    hoveredGroup
  )

  return (
    <group visible={visible}>
      {/* Adjoining concrete edge returns, one per wall face meeting at this
          corner — the real substrate either side of the joint gap, recessed
          just enough to leave a visible reveal before the backer rod. */}
      <mesh position={[-HALF_W + 0.03, 1.8, -HALF_D + 0.18]} material={concreteMaterial} dispose={null} castShadow receiveShadow>
        <boxGeometry args={[0.06, 3.6, 0.28]} />
      </mesh>
      <mesh position={[-HALF_W + 0.18, 1.8, -HALF_D + 0.03]} material={concreteMaterial} dispose={null} castShadow receiveShadow>
        <boxGeometry args={[0.28, 3.6, 0.06]} />
      </mesh>
      <mesh position={[-HALF_W, 1.8, -HALF_D]} material={hardwareMaterial} dispose={null} castShadow>
        <boxGeometry args={[0.08, 3.6, 0.08]} />
      </mesh>
      <SealantBead position={[-HALF_W + 0.06, 1.8, -HALF_D + 0.06]} length={3.6} material={jointMat} />
    </group>
  )
}
