import { useMemo } from 'react'
import { COLORS, hardwareMaterial } from '../buildingMaterials'
import { useSystemMaterial } from '../useSystemMaterial'
import { Isolator } from '../buildingParts'

const GROUP_ID = 'vibrationSolutions'

// Roof deck top surface (RooftopShell.jsx's `ROOF_SURFACE_Y`, duplicated here
// since the two groups are independent modules by design — keep in sync if
// the roof slab's own thickness ever changes) — the isolators sit ON this,
// the equipment unit sits ON the isolators, neither floats nor clips through
// the other.
const ROOF_SURFACE_Y = 3.68
const PLATE_HEIGHT = 0.012
const PLATE_RADIUS = 0.075
// Spring free-length between the two bearing plates — sized so the total
// stack height (roof surface -> bottom plate -> spring -> top plate) is
// unchanged from the prior pad-based build (0.062 total), keeping the
// equipment unit's own resting height exactly where hotspots3d.js's
// `vibrationSolutions.position` (y=3.99) was solved against.
const ISO_HEIGHT = 0.038
const ISO_RADIUS = 0.055
const UNIT_SIZE = [0.8, 0.5, 0.6]

/**
 * Hotspot: vibrationSolutions. Rooftop mechanical unit on real coil-spring
 * isolators — a mechanically legible compression spring (via `Isolator`,
 * a swept-tube coil) between top/bottom steel bearing plates, structurally
 * connected to the roof deck below and the equipment mass above, replacing
 * the previous bare rubber-puck cylinders.
 */
export default function VibrationSolutions({ activeGroup = null, hoveredGroup = null, visible = true }) {
  const roofUnitMat = useSystemMaterial(
    { color: COLORS.metal, roughness: 0.4, metalness: 0.5, emissive: COLORS.ember600 },
    GROUP_ID,
    activeGroup,
    hoveredGroup
  )
  const isoSpringMat = useSystemMaterial(
    { color: '#4E5257', roughness: 0.35, metalness: 0.85, emissive: COLORS.ember600 },
    GROUP_ID,
    activeGroup,
    hoveredGroup
  )

  const padXZ = useMemo(
    () => [
      [1.15, 0.15],
      [1.85, 0.15],
      [1.15, 0.85],
      [1.85, 0.85],
    ],
    []
  )

  const isoCenterY = ROOF_SURFACE_Y + PLATE_HEIGHT + ISO_HEIGHT / 2
  const topPlateTopY = isoCenterY + ISO_HEIGHT / 2 + PLATE_HEIGHT
  const unitCenterY = topPlateTopY + UNIT_SIZE[1] / 2

  return (
    <group visible={visible}>
      {padXZ.map(([x, z], i) => (
        <Isolator
          key={i}
          position={[x, isoCenterY, z]}
          type="spring"
          radius={ISO_RADIUS}
          height={ISO_HEIGHT}
          turns={4}
          tube={0.007}
          material={isoSpringMat}
          plateMaterial={hardwareMaterial}
          plateRadius={PLATE_RADIUS}
          plateHeight={PLATE_HEIGHT}
        />
      ))}
      {/* Equipment unit — rests exactly on the isolators' top plates, no gap
          or overlap. */}
      <mesh position={[1.5, unitCenterY, 0.5]} material={roofUnitMat} dispose={null} castShadow>
        <boxGeometry args={UNIT_SIZE} />
      </mesh>
    </group>
  )
}
