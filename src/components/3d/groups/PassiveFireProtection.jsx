import { COLORS, steelMaterial, hardwareMaterial } from '../buildingMaterials'
import { useSystemMaterial } from '../useSystemMaterial'
import { Pipe, PipeElbow, FirestopCollar, PipeSupport } from '../buildingParts'

const GROUP_ID = 'passiveFireProtection'

/**
 * Hotspot: passiveFireProtection. Pipe riser + sprinkler branch + both
 * firestop collars (wall + floor) — kept as one group exactly as today's
 * flat code did (all of it shared a single `useSystemMaterial` key), so
 * selecting this hotspot highlights/dims the whole assembly together, not
 * just the collar.
 */
export default function PassiveFireProtection({ activeGroup = null, hoveredGroup = null, visible = true }) {
  const pipeMat = useSystemMaterial(
    { color: COLORS.steelDark, roughness: 0.35, metalness: 0.8, emissive: COLORS.ember600 },
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
      <Pipe position={[0, 1.2, -1]} radius={0.1} length={1.8} material={pipeMat} />
      <PipeElbow position={[0, 2.1, -1]} radius={0.1} material={steelMaterial} />
      <Pipe position={[0.35, 2.1, -1]} rotation={[0, 0, Math.PI / 2]} radius={0.08} length={0.7} material={steelMaterial} />
      <PipeElbow position={[0.7, 2.1, -1]} radius={0.06} material={hardwareMaterial} />
      <Pipe position={[0.7, 2.0, -1]} radius={0.04} length={0.22} material={hardwareMaterial} />
      <mesh position={[0.7, 1.885, -1]} material={hardwareMaterial} dispose={null}>
        <sphereGeometry args={[0.03, 10, 10]} />
      </mesh>
      <FirestopCollar position={[0, 1.2, -1.92]} radius={0.14} thickness={0.035} material={collarMat} flange />
      <FirestopCollar
        position={[0, 1.285, -1]}
        rotation={[Math.PI / 2, 0, 0]}
        radius={0.14}
        thickness={0.03}
        material={collarMat}
        flange
      />
      {/* Riser support (Phase 3): strap ring + stand-off arm bolted into the
          floor slab immediately above, instead of a bare unsupported ring. */}
      <PipeSupport position={[0, 1.05, -1]} pipeRadius={0.1} armLength={0.15} material={hardwareMaterial} />
    </group>
  )
}
