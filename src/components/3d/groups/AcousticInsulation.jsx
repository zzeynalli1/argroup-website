import { COLORS, galvanizedMaterial, concreteDarkMaterial } from '../buildingMaterials'
import { useSystemMaterial } from '../useSystemMaterial'
import { SealantBead, InsulationLayer } from '../buildingParts'

const GROUP_ID = 'acousticInsulation'

/**
 * Hotspot: acousticInsulation. Two related details at the same right-wall
 * bay: (1) the original perimeter joint strip — a compressible mineral-wool
 * strip filling the floor/wall junction gap, faced, with a tooled acoustic
 * sealant bead each long edge — kept exactly as before; and (2) a genuine
 * layered wall build-up cutaway just above it, stacked along the wall's own
 * thickness axis (structural backup -> metal furring -> fibrous insulation
 * batt -> board panel -> finished facing), so this reads as a real acoustic
 * wall assembly, not a single insulation slab.
 */
export default function AcousticInsulation({ activeGroup = null, hoveredGroup = null, visible = true }) {
  const battMat = useSystemMaterial(
    { color: '#5B5F63', roughness: 0.95, metalness: 0.02, emissive: COLORS.ember600 },
    GROUP_ID,
    activeGroup,
    hoveredGroup
  )
  const facingMat = useSystemMaterial(
    { color: '#8A8D91', roughness: 0.6, metalness: 0.1, emissive: COLORS.ember600 },
    GROUP_ID,
    activeGroup,
    hoveredGroup
  )
  const sealantMat = useSystemMaterial(
    { color: COLORS.firestopSealant, roughness: 0.65, metalness: 0.1, emissive: COLORS.ember600 },
    GROUP_ID,
    activeGroup,
    hoveredGroup
  )
  const buildupBattMat = useSystemMaterial(
    { color: '#6B6459', roughness: 0.97, metalness: 0.01, emissive: COLORS.ember600 },
    GROUP_ID,
    activeGroup,
    hoveredGroup
  )

  // Wall-buildup cutaway, stacked along local X (the wall's own thickness
  // axis on this right-side bay) — each layer a distinct thin slab.
  const stackY = 1.42
  const stackZ = -1.9
  const stackH = 0.42
  const stackD = 0.3

  return (
    <group visible={visible}>
      {/* Compressible acoustic strip filling the junction gap. */}
      <mesh position={[2.9, 1.23, -1.9]} material={battMat} dispose={null} castShadow>
        <boxGeometry args={[0.5, 0.06, 0.08]} />
      </mesh>
      {/* Thin protective facing membrane on the strip's visible (+Z) face —
          a real acoustic strip is faced, not bare mineral wool left exposed. */}
      <mesh position={[2.9, 1.23, -1.855]} material={facingMat} dispose={null}>
        <boxGeometry args={[0.52, 0.07, 0.01]} />
      </mesh>
      {/* Acoustic sealant bead closing the reveal along the top and bottom
          long edges. */}
      <SealantBead position={[2.9, 1.2, -1.845]} length={0.5} rotation={[0, 0, Math.PI / 2]} material={sealantMat} />
      <SealantBead position={[2.9, 1.26, -1.845]} length={0.5} rotation={[0, 0, Math.PI / 2]} material={sealantMat} />

      {/* Structural backup wall face (innermost layer). */}
      <mesh position={[2.68, stackY, stackZ]} material={concreteDarkMaterial} dispose={null} castShadow receiveShadow>
        <boxGeometry args={[0.06, stackH, stackD]} />
      </mesh>
      {/* Metal furring channels the insulation batt sits between. */}
      <mesh position={[2.735, stackY, stackZ - stackD / 2 + 0.03]} material={galvanizedMaterial} dispose={null} castShadow>
        <boxGeometry args={[0.05, stackH, 0.03]} />
      </mesh>
      <mesh position={[2.735, stackY, stackZ + stackD / 2 - 0.03]} material={galvanizedMaterial} dispose={null} castShadow>
        <boxGeometry args={[0.05, stackH, 0.03]} />
      </mesh>
      {/* Fibrous insulation batt filling the cavity between the furring. */}
      <InsulationLayer position={[2.78, stackY, stackZ]} size={[0.05, stackH * 0.94, stackD * 0.7]} material={buildupBattMat} />
      {/* Board/panel layer. */}
      <mesh position={[2.825, stackY, stackZ]} material={facingMat} dispose={null} castShadow receiveShadow>
        <boxGeometry args={[0.018, stackH, stackD]} />
      </mesh>
      {/* Finished surface skin. */}
      <mesh position={[2.84, stackY, stackZ]} material={concreteDarkMaterial} dispose={null} castShadow>
        <boxGeometry args={[0.006, stackH, stackD]} />
      </mesh>
    </group>
  )
}
