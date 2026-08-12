import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import { concreteMaterial, concreteDarkMaterial, steelMaterial, hardwareMaterial } from '../buildingMaterials'
import { InstancedCylinders } from '../buildingParts'

const HALF_W = 3
const HALF_D = 2
const FLOOR_Y = [0, 1.2, 2.4, 3.6]
const SLAB_HALF_THICK = 0.08
const CHAMFER = 0.02
const CHAMFER_SMOOTHNESS = 2
// Progressive z-offsets proud of the open face (z=HALF_D), each layer
// sitting slightly further forward than the last so the cut-edge "poche"
// band, the steel nosing, and its bolt heads read as distinct, deliberately
// stacked layers of detail instead of coplanar faces fighting for z-order.
const POCHE_Z = HALF_D + 0.006
const NOSING_Z = HALF_D + 0.04
const BOLT_Z = HALF_D + 0.075
const POST_Z = HALF_D + 0.04

const NOSING_BOLT_COUNT = 6

/**
 * The building's default presentation: the same three enclosing walls
 * (back/left/right) as the very first version of this scene, permanently
 * open on the front face — restored per the design-review rollback of the
 * closed-building "Increment C" (see ExteriorShell.jsx, now present in the
 * registry but hidden by default rather than deleted, so a future project
 * decision can re-enable a closed/reveal presentation without rebuilding
 * it). Reuses the current realistic PBR concrete material (unchanged from
 * the architectural-realism pass) — this rollback is about which geometry
 * shows, not a return to flat/prototype materials.
 *
 * Polish pass (post-rollback): every previously bare slab edge at the open
 * face now gets a two-layer cut-edge detail instead of just ending —
 * exactly the convention real architectural section models/drawings use to
 * show "this material was deliberately cut," not "this wall is missing":
 *   1. a darker concrete "poche" band flush with the slab's own cut face
 *      (concreteDarkMaterial — already this scene's established language
 *      for joints/reveals, not a new color), reading as the sectioned
 *      material itself;
 *   2. a steel drip-edge nosing proud of that, with its own visible anchor
 *      bolts (the same "real fastener, not decoration" language already
 *      used on every column base plate and curtain-wall anchor clip in this
 *      scene) — an applied engineered trim, not a floating bar.
 * The same two-layer language is mirrored vertically along the left wall's
 * exposed edge (a poche strip + the steel post), with small corner brackets
 * where the vertical post meets the top/bottom nosings, so the whole open
 * boundary reads as one continuous, designed frame rather than three
 * unrelated edges.
 */
export default function OpenCutawayShell({ visible = true }) {
  const nosingBoltPositions = useMemo(
    () =>
      FLOOR_Y.flatMap((y) => {
        const by = y - SLAB_HALF_THICK - 0.035
        return Array.from({ length: NOSING_BOLT_COUNT }, (_, i) => {
          const x = -HALF_W + 0.35 + i * ((HALF_W * 2 - 0.7) / (NOSING_BOLT_COUNT - 1))
          return [x, by, BOLT_Z]
        })
      }),
    []
  )

  return (
    <group visible={visible}>
      <RoundedBox
        args={[HALF_W * 2, 3.6, 0.16]}
        radius={CHAMFER}
        smoothness={CHAMFER_SMOOTHNESS}
        position={[0, 1.8, -HALF_D]}
        material={concreteMaterial}
        dispose={null}
        castShadow
        receiveShadow
      />
      <RoundedBox
        args={[0.16, 3.6, HALF_D * 2]}
        radius={CHAMFER}
        smoothness={CHAMFER_SMOOTHNESS}
        position={[-HALF_W, 1.8, 0]}
        material={concreteMaterial}
        dispose={null}
        castShadow
        receiveShadow
      />
      <RoundedBox
        args={[0.16, 3.6, HALF_D * 2 - 1.4]}
        radius={CHAMFER}
        smoothness={CHAMFER_SMOOTHNESS}
        position={[HALF_W, 1.8, -0.5]}
        material={concreteMaterial}
        dispose={null}
        castShadow
        receiveShadow
      />

      {/* Vertical expansion-joint reveal on the back wall (unchanged from
          every prior pass). */}
      <mesh position={[0.9, 1.8, -1.9]} material={concreteDarkMaterial} dispose={null}>
        <boxGeometry args={[0.025, 3.6, 0.02]} />
      </mesh>

      {/* Slab cut-edge detail, one per floor level (including the roof) —
          see the file-level note above for the two-layer poche+nosing
          reasoning. */}
      {FLOOR_Y.map((y) => (
        <group key={y}>
          <mesh position={[0, y, POCHE_Z]} material={concreteDarkMaterial} dispose={null} castShadow receiveShadow>
            <boxGeometry args={[HALF_W * 2, SLAB_HALF_THICK * 2 + 0.02, 0.03]} />
          </mesh>
          <mesh
            position={[0, y - SLAB_HALF_THICK - 0.035, NOSING_Z]}
            material={steelMaterial}
            dispose={null}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[HALF_W * 2 + 0.1, 0.07, 0.07]} />
          </mesh>
        </group>
      ))}
      <InstancedCylinders
        positions={nosingBoltPositions}
        radius={0.014}
        length={0.03}
        rotation={[Math.PI / 2, 0, 0]}
        material={hardwareMaterial}
      />

      {/* Left wall's exposed edge: the same poche+trim language, oriented
          vertically, tracing the wall's own cut face full-height. The right
          edge needs no separate treatment — the curtain-wall bay's own
          perimeter frame (Architecture.jsx) already caps that side. */}
      <mesh position={[-HALF_W, 1.8, POCHE_Z]} material={concreteDarkMaterial} dispose={null} castShadow receiveShadow>
        <boxGeometry args={[0.18, 3.6, 0.03]} />
      </mesh>
      <mesh position={[-HALF_W, 1.84, POST_Z]} material={steelMaterial} dispose={null} castShadow receiveShadow>
        <boxGeometry args={[0.1, 3.76, 0.07]} />
      </mesh>

      {/* Corner brackets where the vertical post meets the top/bottom
          nosings — reads as one integrated frame rather than three
          unrelated bars meeting by coincidence. */}
      <mesh position={[-HALF_W, 3.6, BOLT_Z + 0.02]} material={hardwareMaterial} dispose={null} castShadow>
        <boxGeometry args={[0.16, 0.16, 0.05]} />
      </mesh>
      <mesh position={[-HALF_W, 0, BOLT_Z + 0.02]} material={hardwareMaterial} dispose={null} castShadow>
        <boxGeometry args={[0.16, 0.16, 0.05]} />
      </mesh>
    </group>
  )
}
