import { RoundedBox } from '@react-three/drei'
import { COLORS, hardwareMaterial } from '../buildingMaterials'
import { useSystemMaterial } from '../useSystemMaterial'
import { DetailedConcreteColumn, DetailedConcreteBeam, InstancedCylinders } from '../buildingParts'

const GROUP_ID = 'fireproofingSystems'
const COL_X = 1
const COL_Z = -1.6
const COL_BASE_Y = 0
const COL_TOP_Y = 3.6
// Coating stops short of the base plate and the top beam connection — real
// SFRM/board fireproofing is applied AFTER structural steel erection and
// deliberately leaves bolted connections exposed until they get their own
// separate fire-rated detailing, so a small band of bare steel at each end
// is correct, not a modeling gap.
const COATING_BOTTOM = COL_BASE_Y + 0.22
const COATING_TOP = COL_TOP_Y - 0.16

/**
 * Hotspot: fireproofingSystems. A real structural steel column (visible core
 * + base plate/anchor bolts) wrapped in a protective fireproofing coating at
 * realistic thickness, plus a short beam stub at its exposed top connection
 * — steel -> coating -> protected member reads as three distinct layers/
 * materials, not a bigger box floating around a smaller one.
 */
export default function FireproofingSystems({ activeGroup = null, hoveredGroup = null, visible = true }) {
  const coatingMat = useSystemMaterial(
    { color: COLORS.fireproofCoating, roughness: 0.9, metalness: 0.05, emissive: COLORS.amber500 },
    GROUP_ID,
    activeGroup,
    hoveredGroup
  )
  const steelMat = useSystemMaterial(
    { color: COLORS.steelDark, roughness: 0.4, metalness: 0.8, emissive: COLORS.amber500 },
    GROUP_ID,
    activeGroup,
    hoveredGroup
  )

  return (
    <group visible={visible}>
      {/* Steel core — the actual protected member, with a real base plate +
          anchor bolts at the foot. */}
      <DetailedConcreteColumn
        position={[COL_X, (COL_BASE_Y + COL_TOP_Y) / 2, COL_Z]}
        size={[0.16, COL_TOP_Y - COL_BASE_Y, 0.16]}
        chamferRadius={0.01}
        material={steelMat}
        basePlate
        plateMaterial={hardwareMaterial}
      />
      {/* Fireproofing coating jacket — visibly thicker than the steel core
          it wraps (0.3 vs 0.16), stopping short of both ends. */}
      <RoundedBox
        args={[0.3, COATING_TOP - COATING_BOTTOM, 0.3]}
        radius={0.02}
        smoothness={2}
        position={[COL_X, (COATING_BOTTOM + COATING_TOP) / 2, COL_Z]}
        material={coatingMat}
        dispose={null}
        castShadow
        receiveShadow
      />
      {/* Short beam stub at the exposed top connection — same steel/coating
          layering, oriented horizontally, meeting the column at a real
          bolted connection rather than the column standing alone. */}
      <DetailedConcreteBeam
        position={[COL_X + 0.34, COL_TOP_Y - 0.1, COL_Z]}
        size={[0.5, 0.14, 0.14]}
        chamferRadius={0.01}
        material={steelMat}
      />
      <RoundedBox
        args={[0.34, 0.24, 0.24]}
        radius={0.015}
        smoothness={2}
        position={[COL_X + 0.44, COL_TOP_Y - 0.1, COL_Z]}
        material={coatingMat}
        dispose={null}
        castShadow
        receiveShadow
      />
      {/* Bolted end-plate connection at the column, in the exposed steel
          band above the coating — the real fixed joint the beam stub lands
          on. */}
      <mesh position={[COL_X + 0.09, COL_TOP_Y - 0.1, COL_Z]} material={hardwareMaterial} dispose={null} castShadow>
        <boxGeometry args={[0.02, 0.22, 0.22]} />
      </mesh>
      <InstancedCylinders
        positions={[
          [COL_X + 0.1, COL_TOP_Y - 0.03, COL_Z - 0.07],
          [COL_X + 0.1, COL_TOP_Y - 0.03, COL_Z + 0.07],
          [COL_X + 0.1, COL_TOP_Y - 0.17, COL_Z - 0.07],
          [COL_X + 0.1, COL_TOP_Y - 0.17, COL_Z + 0.07],
        ]}
        radius={0.012}
        length={0.03}
        rotation={[0, 0, Math.PI / 2]}
        material={hardwareMaterial}
      />
    </group>
  )
}
