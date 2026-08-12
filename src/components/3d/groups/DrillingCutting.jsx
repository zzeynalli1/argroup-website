import { COLORS, hardwareMaterial } from '../buildingMaterials'
import { useSystemMaterial } from '../useSystemMaterial'
import { Pipe, FirestopCollar, PipeSupport } from '../buildingParts'

const GROUP_ID = 'drillingCutting'

/**
 * Hotspot: drillingCutting. Cored hole (neutral ring — the concrete
 * substrate edge) + PVC pipe sleeve + firestop collar — all three kept in
 * one group exactly as today, since they all shared the same
 * `useSystemMaterial` key.
 */
export default function DrillingCutting({ activeGroup = null, hoveredGroup = null, visible = true }) {
  const pvcMat = useSystemMaterial(
    { color: COLORS.amber500, roughness: 0.6, metalness: 0.05, emissive: COLORS.ember600 },
    GROUP_ID,
    activeGroup,
    hoveredGroup
  )
  const drillHoleMat = useSystemMaterial(
    { color: COLORS.neutral600, roughness: 0.7, metalness: 0.2, emissive: COLORS.ember600 },
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

  return (
    <group visible={visible}>
      <Pipe position={[1.6, 1.2, -1]} radius={0.09} length={1.8} material={pvcMat} />
      <FirestopCollar position={[1.6, 1.2, -1.92]} radius={0.13} thickness={0.02} material={drillHoleMat} />
      <FirestopCollar position={[1.6, 1.2, -1.88]} radius={0.15} thickness={0.03} material={collarMat} flange />
      {/* Riser support (Phase 3): the sleeved pipe run needs its own fixed
          point above the penetration, clear of the collar detail. */}
      <PipeSupport position={[1.6, 1.7, -1]} pipeRadius={0.09} armLength={0.13} material={hardwareMaterial} />
    </group>
  )
}
