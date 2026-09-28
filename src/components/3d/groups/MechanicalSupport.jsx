import { COLORS, hardwareMaterial } from '../buildingMaterials'
import { useSystemMaterial } from '../useSystemMaterial'
import { DuctSegment, ThreadedRod, SupportChannel, Anchor } from '../buildingParts'

const GROUP_ID = 'mechanicalSupport'
const CEILING_Y = 3.6 // matches FLOOR_Y (Structure.jsx)
const DUCT_Y = 2.4
const DUCT_SIZE = [1.4, 0.45, 0.45]
const DUCT_TOP = DUCT_Y + DUCT_SIZE[1] / 2 // 2.625
const DUCT_BOTTOM = DUCT_Y - DUCT_SIZE[1] / 2 // 2.175
const DUCT_FRONT_Z = -1 + DUCT_SIZE[2] / 2 // -0.775
const DUCT_BACK_Z = -1 - DUCT_SIZE[2] / 2 // -1.225
const HANGER_XS = [-1.7, -0.7]
const CHANNEL_Y = DUCT_TOP + 0.021 // strut channel rests directly on the duct top

/**
 * Hotspot: mechanicalSupport — the most technically detailed reveal by
 * design (see the group brief): a full trapeze-hanger assembly, not just a
 * conduit with bare support boxes. Ceiling wedge anchors -> threaded hanger
 * rods (with nuts/washers) -> a horizontal strut channel resting on the
 * conduit -> a U-strap clamp wrapping the conduit from below and bolted back
 * up to the channel, all visibly connected to the building structure. The
 * conduit itself stays generic/unbranded MEP context (see the HVAC note
 * below) — the support hardware is the real AR Group service this hotspot
 * represents (docs/argroup-knowledge-base.md "Support & Fitting Systems" /
 * "Support Design").
 *
 * Deliberately NOT modeled as HVAC ductwork: no elbow/vertical riser
 * implying a connection to rooftop air-handling equipment, no supply-air
 * grille/register. AR Group does not offer HVAC as a service — see the
 * "IMPORTANT BUSINESS REQUIREMENT" note in .claude/agents/3d-modeling-agent.md.
 */
export default function MechanicalSupport({ activeGroup = null, hoveredGroup = null, visible = true }) {
  const conduitMat = useSystemMaterial(
    { color: COLORS.galvanized, roughness: 0.38, metalness: 0.6, emissive: COLORS.ember600 },
    GROUP_ID,
    activeGroup,
    hoveredGroup
  )
  const hangerMat = useSystemMaterial(
    { color: COLORS.metal, roughness: 0.45, metalness: 0.7, emissive: COLORS.ember600 },
    GROUP_ID,
    activeGroup,
    hoveredGroup
  )

  return (
    <group visible={visible}>
      <DuctSegment position={[-1.2, DUCT_Y, -1]} size={DUCT_SIZE} material={conduitMat} />

      {/* Horizontal strut channel spanning both hanger points, resting on
          the conduit's own top face — the real cross-member a trapeze
          hanger's rods actually land on, not rods that touch the conduit
          directly. */}
      <SupportChannel
        position={[(HANGER_XS[0] + HANGER_XS[1]) / 2, CHANNEL_Y, -1]}
        rotation={[0, 0, Math.PI / 2]}
        length={HANGER_XS[1] - HANGER_XS[0] + 0.3}
        material={hangerMat}
      />

      {HANGER_XS.map((x, i) => (
        <group key={i}>
          {/* Ceiling wedge anchor, pointing down into the slab it's
              embedded in. */}
          <Anchor position={[x, CEILING_Y, -1]} rotation={[Math.PI, 0, 0]} length={0.045} radius={0.009} material={hardwareMaterial} />
          {/* Threaded hanger rod, nutted top and bottom, from the ceiling
              anchor down to the strut channel. */}
          <ThreadedRod
            position={[x, (CEILING_Y + CHANNEL_Y) / 2, -1]}
            length={CEILING_Y - CHANNEL_Y}
            radius={0.011}
            material={hangerMat}
            nutTop
            nutBottom
          />
          {/* U-strap clamp wrapping the conduit from below, bolted back up
              to the channel — the "support" detail this hotspot is actually
              about, now a real strap instead of a flat bracket box. */}
          <mesh position={[x, (DUCT_TOP + DUCT_BOTTOM) / 2, DUCT_FRONT_Z]} material={hangerMat} dispose={null} castShadow>
            <boxGeometry args={[0.05, DUCT_TOP - DUCT_BOTTOM, 0.02]} />
          </mesh>
          <mesh position={[x, (DUCT_TOP + DUCT_BOTTOM) / 2, DUCT_BACK_Z]} material={hangerMat} dispose={null} castShadow>
            <boxGeometry args={[0.05, DUCT_TOP - DUCT_BOTTOM, 0.02]} />
          </mesh>
          <mesh position={[x, DUCT_BOTTOM - 0.015, -1]} material={hangerMat} dispose={null} castShadow>
            <boxGeometry args={[0.05, 0.03, DUCT_FRONT_Z - DUCT_BACK_Z + 0.02]} />
          </mesh>
          {/* Small bolt heads at the strap-to-channel connection. */}
          <mesh position={[x, DUCT_TOP + 0.012, DUCT_FRONT_Z]} rotation={[Math.PI / 2, 0, 0]} material={hardwareMaterial} dispose={null} castShadow>
            <cylinderGeometry args={[0.014, 0.014, 0.024, 6]} />
          </mesh>
          <mesh position={[x, DUCT_TOP + 0.012, DUCT_BACK_Z]} rotation={[Math.PI / 2, 0, 0]} material={hardwareMaterial} dispose={null} castShadow>
            <cylinderGeometry args={[0.014, 0.014, 0.024, 6]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
