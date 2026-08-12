import { COLORS } from '../buildingMaterials'
import { useSystemMaterial } from '../useSystemMaterial'
import { DetailedConcreteColumn } from '../buildingParts'

const GROUP_ID = 'fireproofingSystems'

/** Hotspot: fireproofingSystems. The fireproofed structural column. */
export default function FireproofingSystems({ activeGroup = null, hoveredGroup = null, visible = true }) {
  const columnMat = useSystemMaterial(
    { color: COLORS.fireproofCoating, roughness: 0.9, metalness: 0.05, emissive: COLORS.amber500 },
    GROUP_ID,
    activeGroup,
    hoveredGroup
  )

  return (
    <group visible={visible}>
      {/* Bevelled edges (Phase 2), no exposed base plate — the fireproofing
          coating itself is what protects this column's connections, so a
          separate bare-steel plate would misrepresent the product. */}
      <DetailedConcreteColumn
        position={[1, 1.8, -1.6]}
        size={[0.3, 3.6, 0.3]}
        chamferRadius={0.02}
        material={columnMat}
      />
    </group>
  )
}
