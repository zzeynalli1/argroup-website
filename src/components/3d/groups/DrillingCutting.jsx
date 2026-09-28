import { COLORS, hardwareMaterial, concreteMaterial } from '../buildingMaterials'
import { useSystemMaterial } from '../useSystemMaterial'
import { Pipe, FirestopCollar, PipeSupport, ConcreteSection } from '../buildingParts'

const GROUP_ID = 'drillingCutting'

/**
 * Hotspot: drillingCutting. A real cored concrete section (genuine circular
 * bore geometry with a visible cut-edge surface, not a decal ring) + PVC
 * pipe sleeve + firestop collar — all sharing the same `useSystemMaterial`
 * key so selecting this hotspot highlights/dims the whole assembly together.
 */
export default function DrillingCutting({ activeGroup = null, hoveredGroup = null, visible = true }) {
  const pvcMat = useSystemMaterial(
    { color: COLORS.amber500, roughness: 0.6, metalness: 0.05, emissive: COLORS.ember600 },
    GROUP_ID,
    activeGroup,
    hoveredGroup
  )
  const drillHoleMat = useSystemMaterial(
    { color: COLORS.neutral600, roughness: 0.9, metalness: 0.08, emissive: COLORS.ember600 },
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
      {/* Real cored concrete section — genuine circular bore geometry
          (`ConcreteSection`'s extruded-shape-with-hole), the cut edge itself
          the emphasized "drilling/cutting" hero material, the surrounding
          face left as plain, static concrete context. */}
      <ConcreteSection
        position={[1.6, 1.2, -1.94]}
        size={[0.6, 0.6]}
        depth={0.18}
        holeRadius={0.15}
        faceMaterial={concreteMaterial}
        edgeMaterial={drillHoleMat}
      />
      <FirestopCollar position={[1.6, 1.2, -1.88]} radius={0.15} thickness={0.03} material={collarMat} flange />
      {/* Riser support: the sleeved pipe run needs its own fixed point above
          the penetration, clear of the collar detail. */}
      <PipeSupport position={[1.6, 1.7, -1]} pipeRadius={0.09} armLength={0.13} material={hardwareMaterial} />
    </group>
  )
}
