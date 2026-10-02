import { COLORS, steelMaterial, hardwareMaterial, concreteMaterial, concreteWeatheredMaterial } from '../buildingMaterials'
import { useSystemMaterial } from '../useSystemMaterial'
import { Pipe, PipeElbow, FirestopCollar, FirestopSeal, ConcreteSection, PipeSupport, Clamp } from '../buildingParts'

const GROUP_ID = 'passiveFireProtection'

/**
 * Hotspot: passiveFireProtection. Pipe riser + sprinkler branch + both
 * firestop-sealed penetrations (wall + floor) — kept as one group exactly as
 * today's flat code did (all of it shared a single `useSystemMaterial` key),
 * so selecting this hotspot highlights/dims the whole assembly together, not
 * just the collar.
 *
 * Each penetration is a real local substrate section (`ConcreteSection`, a
 * genuine bored opening, not a decal) with the firestop material actually
 * occupying the annular gap (`FirestopSeal`) between the pipe OD and the
 * opening edge, plus `FirestopCollar` as the visible mounting-flange
 * hardware in front of the fill — collar = hardware, seal = the fill.
 * AR/ember red stays a subtle
 * emissive-on-select accent (via `useSystemMaterial`), not the dominant tone:
 * the seal's own base color is the dark firestop red, only glowing brighter
 * when this hotspot is active/hovered.
 */
export default function PassiveFireProtection({ activeGroup = null, hoveredGroup = null, visible = true }) {
  const pipeMat = useSystemMaterial(
    { color: COLORS.steelDark, roughness: 0.35, metalness: 0.8, emissive: COLORS.ember600 },
    GROUP_ID,
    activeGroup,
    hoveredGroup
  )
  const sealMat = useSystemMaterial(
    { color: COLORS.firestop, roughness: 0.68, metalness: 0.08, emissive: COLORS.ember600 },
    GROUP_ID,
    activeGroup,
    hoveredGroup
  )
  const collarMat = useSystemMaterial(
    { color: COLORS.firestopSealant, roughness: 0.5, metalness: 0.2, emissive: COLORS.ember600 },
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

      {/* Wall penetration — a real bored substrate section with the fill
          occupying the annular gap, and the collar's mounting flange kept as
          the visible surface hardware. */}
      <ConcreteSection
        position={[0, 1.2, -1.92]}
        size={[0.6, 0.6]}
        depth={0.22}
        holeRadius={0.145}
        faceMaterial={concreteMaterial}
        edgeMaterial={concreteWeatheredMaterial}
      />
      <FirestopSeal position={[0, 1.2, -1.92]} innerRadius={0.108} outerRadius={0.145} depth={0.22} fillMaterial={sealMat} />
      <FirestopCollar position={[0, 1.2, -1.92]} radius={0.14} thickness={0.03} material={collarMat} flange />

      {/* Floor penetration — same treatment, rotated so the bore axis runs
          vertically through the slab. */}
      <ConcreteSection
        position={[0, 1.285, -1]}
        rotation={[Math.PI / 2, 0, 0]}
        size={[0.6, 0.6]}
        depth={0.17}
        holeRadius={0.145}
        faceMaterial={concreteMaterial}
        edgeMaterial={concreteWeatheredMaterial}
      />
      <FirestopSeal
        position={[0, 1.285, -1]}
        rotation={[Math.PI / 2, 0, 0]}
        innerRadius={0.108}
        outerRadius={0.145}
        depth={0.17}
        fillMaterial={sealMat}
      />
      <FirestopCollar
        position={[0, 1.285, -1]}
        rotation={[Math.PI / 2, 0, 0]}
        radius={0.14}
        thickness={0.03}
        material={collarMat}
        flange
      />

      {/* Riser support: strap ring + stand-off arm bolted into the floor
          slab immediately above, instead of a bare unsupported ring. */}
      <PipeSupport position={[0, 1.05, -1]} pipeRadius={0.1} armLength={0.15} material={hardwareMaterial} />
      {/* Mid-run clamp on the branch line — a real fixed point, not a pipe
          that just floats between its two elbows. */}
      <Clamp position={[0.53, 2.1, -1]} rotation={[0, 0, Math.PI / 2]} pipeRadius={0.08} material={hardwareMaterial} />
    </group>
  )
}
