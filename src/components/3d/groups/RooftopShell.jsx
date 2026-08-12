import { useMemo } from 'react'
import { galvanizedMaterial } from '../buildingMaterials'
import { TechnicalRailing } from '../buildingParts'

// Roof slab (see Shell.jsx: last FLOOR_Y entry, 0.16 thick) top surface —
// 3.6 + half the slab thickness. Posts stand ON this, not floating above it.
const ROOF_SURFACE_Y = 3.68

/**
 * Static rooftop guard rail — generic access/safety infrastructure, not
 * tied to a hotspot. Also the shell a future renewable-energy or additional
 * rooftop equipment reservation would sit inside.
 *
 * Phase 1: rebuilt on the `TechnicalRailing` primitive — posts now have a
 * real base-flange + anchor-bolt connection to the roof deck (previously
 * they started 0.075 above the actual roof surface with nothing visibly
 * anchoring them), plus a kick plate and mid-rail alongside the existing
 * top rail. Galvanized finish (exterior, weather-exposed) instead of the
 * generic indoor hardware tone.
 */
export default function RooftopShell({ visible = true }) {
  const postPositions = useMemo(
    () => [
      [0.9, -0.1],
      [2.1, -0.1],
      [0.9, 1.1],
      [2.1, 1.1],
      [1.5, -0.1],
      [1.5, 1.1],
    ],
    []
  )

  const runs = useMemo(
    () => [
      { axis: 'x', center: [1.5, -0.1], length: 1.3 },
      { axis: 'x', center: [1.5, 1.1], length: 1.3 },
    ],
    []
  )

  return (
    <group visible={visible}>
      <TechnicalRailing
        postPositions={postPositions}
        baseY={ROOF_SURFACE_Y}
        postHeight={0.42}
        postRadius={0.015}
        runs={runs}
        material={galvanizedMaterial}
      />
    </group>
  )
}
