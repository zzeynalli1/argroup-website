import { concreteMaterial, hardwareMaterial, galvanizedMaterial, firestopStaticMaterial } from '../buildingMaterials'
import { DuctSegment, FirestopBoard } from '../buildingParts'

/**
 * Interior partitions/enclosures — construction inside the exterior
 * envelope that isn't itself load-bearing structure: the small ground-floor
 * mechanical/utility room shell and its generic wall-penetration firestop
 * demo. Relocated verbatim from the old Shell.jsx.
 *
 * Note: this room was only ever visible before because the building had no
 * front wall (the permanent open-cutaway). Now that ExteriorShell closes the
 * front, this room is properly concealed by default like the rest of the
 * interior — that's the intended effect of the camera-pivot brief, not a
 * regression; no hotspot targets this room, so it stays hidden.
 */
export default function InteriorArchitecture({ visible = true }) {
  return (
    <group visible={visible}>
      <mesh position={[1.8, 0.6, -1.25]} material={concreteMaterial} dispose={null} castShadow receiveShadow>
        <boxGeometry args={[0.08, 1.2, 1.5]} />
      </mesh>
      <mesh position={[2.4, 0.6, -0.55]} material={concreteMaterial} dispose={null} castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.2, 0.08]} />
      </mesh>
      <mesh position={[2.35, 0.35, -1]} material={hardwareMaterial} dispose={null} castShadow>
        <boxGeometry args={[0.3, 0.5, 0.2]} />
      </mesh>

      {/* Generic duct-through-wall firestop detail (visual enrichment, not a
          hotspot) — a plain penetration sleeve purely to show a firestop
          seal; never described or labeled as HVAC. */}
      <DuctSegment position={[2.3, 2.75, -1.85]} size={[0.35, 0.35, 0.3]} material={galvanizedMaterial} />
      <FirestopBoard position={[2.3, 2.75, -1.94]} size={[0.5, 0.5, 0.03]} material={firestopStaticMaterial} />
    </group>
  )
}
