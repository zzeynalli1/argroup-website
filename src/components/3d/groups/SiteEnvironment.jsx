import { useMemo } from 'react'
import { Instance, Instances, RoundedBox } from '@react-three/drei'
import {
  plazaMaterial,
  planterMaterial,
  foliageMaterial,
  foliageAccentMaterial,
  barkMaterial,
  concreteDarkMaterial,
  galvanizedMaterial,
  bollardLampMaterial,
} from '../buildingMaterials'
import { InstancedCylinders } from '../buildingParts'

const HALF_D = 2
const HALF_W = 3

/**
 * Minimal exterior site dressing around the entrance — NOT a hotspot group
 * (no `activeGroup`/`hoveredGroup` handling, nothing here highlights). Sits
 * alongside `architecture`/`rooftopShell` as static, always-visible context
 * that supports the building rather than competing with it (brief: ~80%
 * building / ~20% environment). Deliberately narrow in scope for this pass —
 * a paved entrance plaza + curb, a few empty concrete planter troughs (no
 * shrubs planted in them — see the planter block's own comment for why), a
 * handful of instanced bollard lights, and (reference-fidelity pass) a
 * flanking low retaining wall + a handful of background trees on each side
 * — per the "restrained, not a city" environment brief. Parking/service-
 * access/the full depth of the landscape strips from the larger reserved-
 * zone table are intentionally NOT built here; they stay available for a
 * later, explicitly-scoped pass.
 *
 * Everything here sits outside the building footprint (`x:-2..2, z:2..5`
 * roughly, per the reserved "entrance plaza" zone), so it never touches
 * HALF_W/HALF_D or any wall/hotspot coordinate.
 */
// Matches the "entrance plaza" reserved-zone table (`x:-2..2, z:2..5`) — see
// the surrounding-site-environment table.
const PLAZA_CENTER_Z = 3.5
const PLAZA_DEPTH = 3
const PLAZA_WIDTH = 5

// Reference-fidelity pass: a low stone/concrete retaining wall flanking the
// building with a handful of trees just beyond it on both sides — matches
// the reference's "trees behind a low stone/concrete retaining wall on both
// sides". Uses the "landscape strips" reserved zone (`x:-6..-3` and
// `x:3..6`, `z:0..6`) from the surrounding-site-environment table, kept to
// its near edge only (not the full 0..6 depth) to stay restrained per the
// 80/20 building/environment brief — a hint of landscape framing the
// building, not a park.
// Camera/massing pass: the LEFT side now has a real building mass out to
// x=-4.3 (groups/ExteriorShell.jsx's `LowWideWing` — that exact constant is
// duplicated here as `WING_X0` since the two groups are independent modules
// by design; keep both in sync if the wing's own width ever changes). The
// old single symmetric `LANDSCAPE_WALL_X` (HALF_W + 0.3 = 3.3) put the left
// retaining wall's centerline INSIDE the wing's own solid volume
// (-4.3..-3) — fixed by giving each side its own wall offset, measured from
// that side's real outer building edge (the wing on the left, HALF_W on the
// right) rather than one shared constant.
// Massing re-pass (round 3): WING_X0 widened to -6.6 in ExteriorShell.jsx
// (see that file's own comment) — kept in sync here. The left tree offset
// is trimmed from 2.3 to 1.5 (right side unchanged) so the trees still sit
// just beyond the wing's own now much-further-out edge as a backdrop,
// rather than drifting an extra ~2.3 units past it into a wide empty gap —
// screenshot-verified against the re-derived default camera below.
const WING_X0 = -6.6
const LEFT_WALL_X = WING_X0 - 0.3 // -6.9, clear of the wing's own outer face
const RIGHT_WALL_X = HALF_W + 0.3 // 3.3, unchanged
const LANDSCAPE_WALL_HEIGHT = 0.32
const LANDSCAPE_WALL_THK = 0.12
// Screenshot-verified fix: was 1.1 (trees at x +-4.4/4.7) — at this scene's
// default camera distance, that read as crowding right up against the
// building (and, on the right side, visually overlapping the glazed
// stairwell) rather than sitting back as a backdrop. Pushed further out and
// thinned from 3 trees/side to 2, spaced further apart. Left side trimmed
// again in the round-3 massing re-pass (see comment above) now that the
// wing itself reaches much further left.
const TREE_X_OFFSET = { left: 1.5, right: 2.3 }
// Screenshot-verified fix: this pass's default camera (much closer/lower,
// see hotspots3d.js) projects the old shared Z spacing almost directly over
// the new left-side wing's own most-visible front face, hiding it behind
// tree canopy. Left-side trees pulled toward the back corner (more negative
// Z) so they sit beside/behind the wing in screen space instead of in front
// of it; right side (no wing) keeps the original spacing.
const TREE_Z_POSITIONS = { left: [-1.3, 0.6], right: [0.3, 2.4] }

// Screenshot-verified SECOND fix: the "cluster of small offset spheres"
// rebuild above still read as a stacked cluster of round green balls (a
// "broccoli/cauliflower" silhouette) at this scene's default camera distance
// — six same-radius-family spheres all centered on roughly the same point
// never stops reading as spherical no matter how they're offset, since the
// SILHOUETTE (what a viewer actually reads at a glance) is still the union
// of several near-identical circles. Rebuilt with a genuinely different
// silhouette instead: a tapered stack of three flattened, progressively
// smaller/offset spheroids (scaled non-uniformly on Y so each lobe reads as
// a squashed drift of foliage, not a ball) plus one small conical evergreen
// accent per cluster — a cone is a shape with zero spherical family
// membership, which is what actually breaks the "row of green balls" tell.
function Tree({ position, scale = 1, accent = false }) {
  const primary = accent ? foliageAccentMaterial : foliageMaterial
  const secondary = accent ? foliageMaterial : foliageAccentMaterial
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.42, 0]} material={barkMaterial} dispose={null} castShadow>
        <cylinderGeometry args={[0.032, 0.05, 0.84, 6]} />
      </mesh>
      {/* Tapered deciduous canopy — three flattened, laterally-drifted
          spheroids stacked with decreasing radius, reading as an irregular
          mass of foliage rather than a sphere. */}
      <mesh position={[0.05, 0.92, -0.03]} scale={[0.42, 0.3, 0.4]} material={primary} dispose={null} castShadow>
        <sphereGeometry args={[1, 8, 6]} />
      </mesh>
      <mesh position={[-0.08, 1.08, 0.06]} scale={[0.34, 0.26, 0.32]} material={secondary} dispose={null} castShadow>
        <sphereGeometry args={[1, 8, 6]} />
      </mesh>
      <mesh position={[0.02, 1.22, -0.04]} scale={[0.24, 0.2, 0.24]} material={primary} dispose={null} castShadow>
        <sphereGeometry args={[1, 7, 6]} />
      </mesh>
      {/* Small conical evergreen accent beside the main canopy — a distinct
          silhouette family from the spheroids above so the cluster doesn't
          read as one shape repeated. */}
      <mesh position={[-0.26, 0.62, 0.16]} material={secondary} dispose={null} castShadow>
        <coneGeometry args={[0.16, 0.62, 7]} />
      </mesh>
    </group>
  )
}

export default function SiteEnvironment({ visible = true }) {
  const plazaY = 0.006 // just above the ground plane/ContactShadows, avoids z-fighting

  // Camera/massing pass: the old two small square planters (0.5x0.5) read as
  // sparse, scattered accents on an otherwise empty plaza — swapped for
  // longer rectangular planters running along the walkway toward the
  // entrance (brief: "longer rectangular planters... reduce visible empty
  // ground"), each carrying a short row of shrubs instead of one round
  // blob. Positions flank the (now-widened) entrance at its real center
  // (~x=-1.3) rather than the old asymmetric spots.
  const planterDefs = useMemo(
    () => [
      { center: [-2.15, plazaY, 3.0], length: 1.3 },
      { center: [-0.35, plazaY, 3.15], length: 1.6 },
    ],
    [plazaY]
  )

  const bollardPositions = useMemo(
    () => [
      [-1.85, HALF_D + 1.2],
      [1.85, HALF_D + 1.2],
      [-1.5, HALF_D + 2.7],
      [1.5, HALF_D + 2.7],
    ],
    []
  )

  const bollardPostPositions = bollardPositions.map(([x, z]) => [x, 0.19, z])
  const bollardCapPositions = bollardPositions.map(([x, z]) => [x, 0.39, z])

  return (
    <group visible={visible}>
      {/* Paved entrance plaza — a distinct lighter/smoother finish than the
          yard slab beyond it (see buildingMaterials.js: `plazaMaterial`). */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, plazaY, PLAZA_CENTER_Z]} material={plazaMaterial} dispose={null} receiveShadow>
        <planeGeometry args={[PLAZA_WIDTH, PLAZA_DEPTH]} />
      </mesh>
      {/* Curb edge separating the plaza from the yard beyond it — stone-tone
          concrete (was `galvanizedMaterial`, a metal finish that read as a
          harder mismatch at this seam than a real curb would). */}
      <mesh position={[0, 0.05, PLAZA_CENTER_Z + PLAZA_DEPTH / 2]} material={concreteDarkMaterial} dispose={null} castShadow receiveShadow>
        <boxGeometry args={[PLAZA_WIDTH, 0.1, 0.1]} />
      </mesh>

      {/* Paver joint lines — a light soldier-course suggestion (a handful of
          shallow, dark recessed lines in both directions) rather than
          per-tile geometry, cheap enough to keep the plaza reading as
          jointed pavers instead of one flat slab. */}
      {Array.from({ length: 5 }, (_, i) => {
        const x = -PLAZA_WIDTH / 2 + (PLAZA_WIDTH / 5) * (i + 0.5)
        return (
          <mesh key={`joint-z-${i}`} position={[x, plazaY + 0.003, PLAZA_CENTER_Z]} material={concreteDarkMaterial} dispose={null}>
            <boxGeometry args={[0.012, 0.004, PLAZA_DEPTH]} />
          </mesh>
        )
      })}
      {Array.from({ length: 3 }, (_, i) => {
        const z = PLAZA_CENTER_Z - PLAZA_DEPTH / 2 + (PLAZA_DEPTH / 3) * (i + 0.5)
        return (
          <mesh key={`joint-x-${i}`} position={[0, plazaY + 0.003, z]} material={concreteDarkMaterial} dispose={null}>
            <boxGeometry args={[PLAZA_WIDTH, 0.004, 0.012]} />
          </mesh>
        )
      })}

      {/* Long rectangular planters flanking the entrance walk — plain
          concrete-tone troughs, oriented along the walkway (world Z).
          Deliberately left empty (no shrubs planted in them): the previous
          round/spherical shrub meshes here were rejected (no ball-shaped
          vegetation anywhere in this scene) and not replaced, so the
          entrance reads as clean/architectural — the trough itself is an
          architectural element on its own, not a plant container that needs
          filling. */}
      {planterDefs.map(({ center, length }, i) => (
        <RoundedBox
          key={i}
          args={[0.38, 0.36, length]}
          radius={0.02}
          smoothness={2}
          position={[center[0], 0.18, center[2]]}
          material={planterMaterial}
          dispose={null}
          castShadow
          receiveShadow
        />
      ))}

      {/* Low retaining walls flanking both sides of the building, trees just
          beyond them — background landscape framing, not a park (see the
          const-block comment above). */}
      {[-1, 1].map((side) => {
        const wallX = side === -1 ? LEFT_WALL_X : RIGHT_WALL_X
        const treeZs = side === -1 ? TREE_Z_POSITIONS.left : TREE_Z_POSITIONS.right
        const treeXOffset = side === -1 ? TREE_X_OFFSET.left : TREE_X_OFFSET.right
        return (
          <group key={side}>
            <mesh
              position={[wallX, LANDSCAPE_WALL_HEIGHT / 2, 1.6]}
              material={concreteDarkMaterial}
              dispose={null}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[LANDSCAPE_WALL_THK, LANDSCAPE_WALL_HEIGHT, 3.6]} />
            </mesh>
            {treeZs.map((z, i) => (
              <Tree
                key={z}
                position={[wallX + Math.sign(wallX) * (treeXOffset + (i % 2) * 0.4), 0, z]}
                scale={0.8 + (i % 2) * 0.15}
                accent={i % 2 === 0}
              />
            ))}
          </group>
        )
      })}

      {/* Bollard lights along the plaza edges — post + a visibly glowing
          lamp head, one draw call each via instancing. Screenshot-verified
          fix: the old flat 0.05-tall box cap read as a bare grey nub with
          no visible glow — a slightly larger sphere (a lamp head silhouette
          reads more clearly than a box) with a much higher emissive
          intensity than `warmGlowMaterial`'s scene-default actually shows
          up as a lit point at this camera distance. */}
      <InstancedCylinders positions={bollardPostPositions} radius={0.025} length={0.38} material={galvanizedMaterial} />
      <Instances limit={bollardCapPositions.length} material={bollardLampMaterial} dispose={null}>
        <sphereGeometry args={[0.045, 10, 8]} />
        {bollardCapPositions.map((position, i) => (
          <Instance key={i} position={position} />
        ))}
      </Instances>
    </group>
  )
}
