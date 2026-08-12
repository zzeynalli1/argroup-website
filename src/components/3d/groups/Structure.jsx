import { RoundedBox } from '@react-three/drei'
import { concreteMaterial, concreteDarkMaterial, concreteWeatheredMaterial, steelMaterial } from '../buildingMaterials'
import { DetailedConcreteBeam, DetailedConcreteColumn } from '../buildingParts'

const HALF_W = 3
const HALF_D = 2
const FLOOR_Y = [0, 1.2, 2.4, 3.6]

// Same small chamfer as ExteriorShell's walls — a large flat concrete panel
// never has a razor-sharp arris in reality.
const CHAMFER = 0.02
const CHAMFER_SMOOTHNESS = 2

/**
 * Load-bearing structure: floor slabs, embedded beams, the two corner
 * columns, and the ground-floor control joint — relocated verbatim from the
 * old Shell.jsx. Deliberately separate from ExteriorShell (the envelope):
 * none of this was ever dynamically highlighted or hidden by a hotspot, and
 * it should stay that way — a future "structural layer" toggle can target
 * this group on its own without touching the envelope's open/close state.
 */
export default function Structure({ visible = true }) {
  return (
    <group visible={visible}>
      {FLOOR_Y.map((y) => (
        <RoundedBox
          key={y}
          args={[HALF_W * 2, 0.16, HALF_D * 2]}
          radius={CHAMFER}
          smoothness={CHAMFER_SMOOTHNESS}
          position={[0, y, 0]}
          castShadow
          receiveShadow
          material={y === 0 ? concreteWeatheredMaterial : concreteMaterial}
          dispose={null}
        />
      ))}

      {/* Ground-floor control joint, clear of the pipe/PVC risers (x=0, x=1.6)
          and the cable tray (x=-2..-2.8). */}
      <mesh position={[-0.6, 0.085, 0]} material={concreteDarkMaterial} dispose={null}>
        <boxGeometry args={[0.02, 0.015, HALF_D * 2 - 0.2]} />
      </mesh>

      {/* Embedded steel beams, one per upper floor level. */}
      {[1.2, 2.4, 3.6].map((y) => (
        <DetailedConcreteBeam
          key={y}
          position={[0, y - 0.18, -1.4]}
          size={[HALF_W * 2 - 0.3, 0.14, 0.2]}
          material={steelMaterial}
        />
      ))}

      {/* Corner columns: bevelled edges plus a steel base plate with anchor
          bolts embedded into the ground-floor slab beneath. */}
      <DetailedConcreteColumn
        position={[-2.2, 1.8, -1.7]}
        size={[0.28, 3.6, 0.28]}
        chamferRadius={CHAMFER}
        chamferSmoothness={CHAMFER_SMOOTHNESS}
        material={concreteDarkMaterial}
        basePlate
      />
      <DetailedConcreteColumn
        position={[2.2, 1.8, -1.7]}
        size={[0.28, 3.6, 0.28]}
        chamferRadius={CHAMFER}
        chamferSmoothness={CHAMFER_SMOOTHNESS}
        material={concreteDarkMaterial}
        basePlate
      />
    </group>
  )
}
