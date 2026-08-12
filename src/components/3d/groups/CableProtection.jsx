import { useMemo } from 'react'
import { COLORS, hardwareMaterial, firestopStaticMaterial } from '../buildingMaterials'
import { useSystemMaterial } from '../useSystemMaterial'
import { Pipe, TrayRail, FirestopCollar, FirestopBoard, InstancedBoxes, InstancedCylinders, CableTraySupport } from '../buildingParts'

const GROUP_ID = 'cableProtection'

/**
 * Hotspot: cableProtection. Cable tray (cylinders, rails, rungs, vertical
 * riser) + its firestop collar, plus the adjacent multiple-cable
 * penetration/board detail (static — was never dynamically highlighted, but
 * lives here since it's the same visual neighborhood).
 */
export default function CableProtection({ activeGroup = null, hoveredGroup = null, visible = true }) {
  const trayMat = useSystemMaterial(
    { color: '#2E3033', roughness: 0.5, metalness: 0.4, emissive: COLORS.ember600 },
    GROUP_ID,
    activeGroup,
    hoveredGroup
  )
  const trayRailMat = useSystemMaterial(
    { color: COLORS.steelDark, roughness: 0.4, metalness: 0.7, emissive: COLORS.ember600 },
    GROUP_ID,
    activeGroup,
    hoveredGroup
  )
  const collarMat = useSystemMaterial(
    { color: COLORS.firestop, roughness: 0.6, metalness: 0.15, emissive: COLORS.ember600 },
    GROUP_ID,
    activeGroup,
    hoveredGroup
  )

  const rungPositions = useMemo(() => Array.from({ length: 5 }, (_, i) => [-2.75 + i * 0.35, 0.85, -1.3]), [])
  const multiCablePositions = useMemo(
    () => [
      [-2.15, 1.35, -1.7],
      [-2.05, 1.35, -1.7],
      [-1.95, 1.35, -1.7],
      [-1.85, 1.35, -1.7],
    ],
    []
  )

  return (
    <group visible={visible}>
      {[0, 1, 2].map((i) => (
        <Pipe
          key={i}
          position={[-2, 0.95 + i * 0.1, -1.3]}
          rotation={[0, 0, Math.PI / 2]}
          radius={0.04}
          length={1.6}
          material={trayMat}
        />
      ))}
      <TrayRail position={[-2, 0.82, -1.42]} length={1.8} material={trayRailMat} />
      <TrayRail position={[-2, 0.82, -1.18]} length={1.8} material={trayRailMat} />
      <InstancedBoxes positions={rungPositions} size={[0.02, 0.02, 0.3]} material={trayRailMat} />
      <TrayRail position={[-1.15, 1.6, -1.42]} rotation={[0, 0, Math.PI / 2]} length={0.8} material={trayRailMat} />
      <TrayRail position={[-1.15, 1.6, -1.18]} rotation={[0, 0, Math.PI / 2]} length={0.8} material={trayRailMat} />
      {/* Trapeze hanger (Phase 3): the horizontal run's real fixed point to
          the slab above, clear of the rung positions. */}
      <CableTraySupport position={[-1.9, 1.12, -1.3]} dropHeight={0.3} span={0.26} material={hardwareMaterial} />
      <FirestopCollar
        position={[-2, 0.95, -1.92]}
        rotation={[0, 0, Math.PI / 2]}
        radius={0.16}
        thickness={0.03}
        material={collarMat}
        flange
      />

      {/* Multiple-cable penetration sealed with a firestop board — static
          (was never hotspot-highlighted), but part of this visual neighborhood. */}
      <FirestopBoard position={[-2, 1.35, -1.92]} size={[0.5, 0.3, 0.04]} material={firestopStaticMaterial} fasteners />
      <InstancedCylinders positions={multiCablePositions} radius={0.015} length={0.5} material={hardwareMaterial} />
    </group>
  )
}
