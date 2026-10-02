import { useMemo } from 'react'
import * as THREE from 'three'
import { Instance, Instances, RoundedBox } from '@react-three/drei'
import { hardwareMaterial, galvanizedMaterial } from './buildingMaterials'

/**
 * Small, reusable primitive components the building assembly (Building.jsx)
 * composes into pipe/duct/tray/firestop systems. Kept deliberately simple —
 * boxes/cylinders/spheres only, no boolean/CSG geometry — to stay cheap to
 * render and easy to reposition without touching the scene's existing
 * cameras, controls, or hotspot coordinates.
 *
 * Every mesh here takes a shared/external material instance via the
 * `material` prop rather than a JSX `<meshStandardMaterial>` child, on
 * purpose (see buildingMaterials.js: "reuse materials" perf note). R3F
 * auto-disposes objects it didn't create itself when the owning element
 * unmounts — since these materials are shared across many meshes,
 * `dispose={null}` is required everywhere, or one unmount would silently
 * break the material for every other mesh still using it.
 */

// A straight pipe run. Defaults to running along Y; pass `rotation` to
// orient horizontally.
export function Pipe({ position, rotation = [0, 0, 0], radius = 0.1, length = 1.8, material, segments = 14 }) {
  return (
    <mesh position={position} rotation={rotation} material={material} dispose={null} castShadow>
      <cylinderGeometry args={[radius, radius, length, segments]} />
    </mesh>
  )
}

// Fakes an elbow/joint as a sphere at the turn point — cheap stand-in for a
// swept-bend geometry, reads fine at this model's scale.
export function PipeElbow({ position, radius = 0.1, material, segments = 14 }) {
  return (
    <mesh position={position} material={material} dispose={null} castShadow>
      <sphereGeometry args={[radius * 1.05, segments, segments]} />
    </mesh>
  )
}

// A rectangular HVAC duct segment.
export function DuctSegment({ position, rotation = [0, 0, 0], size = [1.4, 0.45, 0.45], material }) {
  return (
    <mesh position={position} rotation={rotation} material={material} dispose={null} castShadow>
      <boxGeometry args={size} />
    </mesh>
  )
}

// Duct turn — a slightly larger box at the corner, same cheap-elbow trick as PipeElbow.
export function DuctElbow({ position, size = 0.5, material }) {
  return (
    <mesh position={position} material={material} dispose={null} castShadow>
      <boxGeometry args={[size, size, size]} />
    </mesh>
  )
}

// Supply/return grille face — a shallow box with a few recessed dark slats
// to read as a louvered grille without modeling individual fins.
export function Grille({ position, rotation = [0, 0, 0], size = [0.4, 0.4, 0.03], material }) {
  const [w, h] = size
  const slatCount = 4
  return (
    <group position={position} rotation={rotation}>
      <mesh material={material} dispose={null} castShadow>
        <boxGeometry args={size} />
      </mesh>
      {Array.from({ length: slatCount }, (_, i) => (
        <mesh key={i} position={[0, h / 2 - ((i + 0.5) * h) / slatCount, 0.02]}>
          <boxGeometry args={[w * 0.85, 0.015, 0.01]} />
          <meshStandardMaterial color="#2A2C2E" roughness={0.6} metalness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

// A firestop collar/sealant ring — the only geometry in the scene allowed to
// use the dark firestop-red material, and only ever placed directly at a
// real penetration point (wall/floor opening around a pipe). Optional
// `flange`: the visible steel mounting ring + screws a real intumescent
// collar is fixed to the substrate with — not just a bare sealant ring.
// `rotation` orients the whole assembly (wall vs. floor penetration) exactly
// as before; the flange/screws inherit it since they're children of the same
// rotated group, not separately rotated.
export function FirestopCollar({
  position,
  rotation = [0, 0, 0],
  radius = 0.13,
  thickness = 0.03,
  material,
  flange = false,
  flangeMaterial = hardwareMaterial,
}) {
  const flangeScrewCount = 4
  const flangeScrewRadius = radius + 0.03
  const flangeScrewPositions = flange
    ? Array.from({ length: flangeScrewCount }, (_, i) => {
        const a = (i / flangeScrewCount) * Math.PI * 2
        return [Math.cos(a) * flangeScrewRadius, Math.sin(a) * flangeScrewRadius, 0.01]
      })
    : []

  return (
    <group position={position} rotation={rotation}>
      {flange && (
        <mesh rotation={[Math.PI / 2, 0, 0]} material={flangeMaterial} dispose={null} castShadow>
          <cylinderGeometry args={[radius + 0.04, radius + 0.04, 0.015, 24]} />
        </mesh>
      )}
      <mesh material={material} dispose={null} castShadow>
        <torusGeometry args={[radius, thickness, 8, 24]} />
      </mesh>
      {flange && (
        <InstancedCylinders
          positions={flangeScrewPositions}
          radius={0.008}
          length={0.02}
          rotation={[Math.PI / 2, 0, 0]}
          material={flangeMaterial}
        />
      )}
    </group>
  )
}

// A flat firestop board/mortar patch sealing a multi-penetration opening.
// Optional `fasteners`: the corner screws a real board panel is fixed with.
export function FirestopBoard({
  position,
  rotation = [0, 0, 0],
  size = [0.4, 0.3, 0.04],
  material,
  fasteners = false,
  fastenerMaterial = hardwareMaterial,
}) {
  const [w, h, d] = size
  const inset = 0.04
  const fastenerPositions = fasteners
    ? [
        [w / 2 - inset, h / 2 - inset, d / 2 + 0.005],
        [-(w / 2 - inset), h / 2 - inset, d / 2 + 0.005],
        [w / 2 - inset, -(h / 2 - inset), d / 2 + 0.005],
        [-(w / 2 - inset), -(h / 2 - inset), d / 2 + 0.005],
      ]
    : []

  return (
    <group position={position} rotation={rotation}>
      <mesh material={material} dispose={null} castShadow>
        <boxGeometry args={size} />
      </mesh>
      {fasteners && (
        <InstancedCylinders
          positions={fastenerPositions}
          radius={0.008}
          length={0.015}
          rotation={[Math.PI / 2, 0, 0]}
          material={fastenerMaterial}
        />
      )}
    </group>
  )
}

// A sealant bead along a linear joint — bevelled edges for a tooled fillet
// profile instead of a razor-edged box, sits proud of the backer.
export function SealantBead({ position, rotation = [0, 0, 0], length = 3.6, material }) {
  return (
    <RoundedBox
      args={[0.05, length, 0.05]}
      radius={0.008}
      smoothness={2}
      position={position}
      rotation={rotation}
      material={material}
      dispose={null}
      castShadow
    />
  )
}

// Cable-tray side rail — a long thin bar; use two per tray run.
export function TrayRail({ position, rotation = [0, 0, 0], length = 1.6, material }) {
  return (
    <mesh position={position} rotation={rotation} material={material} dispose={null} castShadow>
      <boxGeometry args={[length, 0.05, 0.02]} />
    </mesh>
  )
}

// Instanced small hardware — hanger rods, tray rungs, pipe clamps, railing
// posts. One draw call for however many `positions` are given.
export function InstancedBoxes({ positions, size = [0.04, 0.2, 0.04], rotation, material = hardwareMaterial }) {
  return (
    <Instances limit={positions.length} castShadow material={material} dispose={null}>
      <boxGeometry args={size} />
      {positions.map((position, i) => (
        <Instance key={i} position={position} rotation={rotation} />
      ))}
    </Instances>
  )
}

export function InstancedCylinders({ positions, radius = 0.015, length = 0.6, rotation, material = hardwareMaterial }) {
  return (
    <Instances limit={positions.length} castShadow material={material} dispose={null}>
      <cylinderGeometry args={[radius, radius, length, 8]} />
      {positions.map((position, i) => (
        <Instance key={i} position={position} rotation={rotation} />
      ))}
    </Instances>
  )
}

// A structural concrete/steel beam with bevelled edges instead of a flat CAD
// box — a rolled/formed member has softened arrises, never a razor edge.
export function DetailedConcreteBeam({
  position,
  size = [5.7, 0.14, 0.2],
  chamferRadius = 0.012,
  chamferSmoothness = 2,
  material,
}) {
  return (
    <RoundedBox
      args={size}
      radius={chamferRadius}
      smoothness={chamferSmoothness}
      position={position}
      material={material}
      dispose={null}
      castShadow
      receiveShadow
    />
  )
}

// A structural column: bevelled edges, plus an optional steel base plate with
// embedded anchor bolts at the foot — the real connection point between a
// column and the foundation slab it lands on. The column's bottom face sits
// at its own local y=0 (unchanged from the existing coordinate system), so
// the plate sits right at that same reference and the bolts run downward
// into the slab beneath, exactly like a cast-in-place anchor bolt group.
export function DetailedConcreteColumn({
  position,
  size = [0.28, 3.6, 0.28],
  chamferRadius = 0.02,
  chamferSmoothness = 2,
  material,
  basePlate = false,
  plateMaterial = hardwareMaterial,
}) {
  const [w, h, d] = size
  const plateSize = [w + 0.14, 0.03, d + 0.14]
  const boltInset = 0.05
  const boltPositions = [
    [w / 2 - boltInset, -0.04, d / 2 - boltInset],
    [-(w / 2 - boltInset), -0.04, d / 2 - boltInset],
    [w / 2 - boltInset, -0.04, -(d / 2 - boltInset)],
    [-(w / 2 - boltInset), -0.04, -(d / 2 - boltInset)],
  ]

  return (
    <group position={position}>
      <RoundedBox
        args={size}
        radius={chamferRadius}
        smoothness={chamferSmoothness}
        material={material}
        dispose={null}
        castShadow
        receiveShadow
      />
      {basePlate && (
        <group position={[0, -h / 2, 0]}>
          <mesh position={[0, 0.015, 0]} material={plateMaterial} dispose={null} castShadow>
            <boxGeometry args={plateSize} />
          </mesh>
          <InstancedCylinders positions={boltPositions} radius={0.014} length={0.12} material={plateMaterial} />
        </group>
      )}
    </group>
  )
}

// A riser support: a split strap ring around a vertical pipe plus a short
// stand-off arm bolted to the floor slab immediately above — the real fixed
// point a vertical pipe run needs at each level it passes, not just the
// firestop collar where it happens to penetrate a wall/floor.
export function PipeSupport({ position, pipeRadius = 0.1, armLength = 0.15, material = hardwareMaterial }) {
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={material} dispose={null} castShadow>
        <torusGeometry args={[pipeRadius + 0.02, 0.015, 6, 16]} />
      </mesh>
      <mesh position={[0, armLength / 2, 0]} material={material} dispose={null} castShadow>
        <boxGeometry args={[0.04, armLength, 0.04]} />
      </mesh>
      <mesh position={[0, armLength, 0]} material={material} dispose={null} castShadow>
        <boxGeometry args={[0.1, 0.02, 0.1]} />
      </mesh>
    </group>
  )
}

// A generic technical/safety guard rail: posts standing on a real mounting
// surface (each with a base flange + anchor bolts, not floating mid-air),
// a solid kick plate (toe board) just above the deck, a mid-rail, and a top
// rail — the standard four elements of an engineered guard-rail run, not a
// bare top bar. `runs` describes one or more straight rail segments sharing
// the same post set; each run is `{ axis: 'x' | 'z', center: [x, z], length }`
// (axis = which world axis the run travels along). `postPositions` are the
// [x, z] foot locations on the mounting surface at `baseY`.
export function TechnicalRailing({
  postPositions,
  baseY,
  postHeight = 0.42,
  postRadius = 0.016,
  runs,
  material = galvanizedMaterial,
}) {
  const kickPlateHeight = 0.08
  const midRailY = baseY + postHeight * 0.52
  const topRailY = baseY + postHeight
  const kickPlateY = baseY + kickPlateHeight / 2 + 0.01
  const barThickness = postRadius * 1.7

  const postCylinders = postPositions.map(([x, z]) => [x, baseY + postHeight / 2, z])
  const baseFlangePositions = postPositions.map(([x, z]) => [x, baseY + 0.006, z])
  const boltOffsets = [
    [postRadius + 0.012, postRadius + 0.012],
    [-(postRadius + 0.012), postRadius + 0.012],
    [postRadius + 0.012, -(postRadius + 0.012)],
    [-(postRadius + 0.012), -(postRadius + 0.012)],
  ]
  const boltPositions = postPositions.flatMap(([x, z]) =>
    boltOffsets.map(([dx, dz]) => [x + dx, baseY + 0.012, z + dz])
  )

  return (
    <group>
      <InstancedCylinders positions={postCylinders} radius={postRadius} length={postHeight} material={material} />

      {/* Base flange + anchor bolts per post — the real fixed connection to
          the deck, instead of a post that just intersects the surface. */}
      <Instances limit={baseFlangePositions.length} castShadow receiveShadow material={material} dispose={null}>
        <cylinderGeometry args={[postRadius + 0.026, postRadius + 0.026, 0.012, 16]} />
        {baseFlangePositions.map((position, i) => (
          <Instance key={i} position={position} />
        ))}
      </Instances>
      <InstancedCylinders
        positions={boltPositions}
        radius={0.006}
        length={0.02}
        material={hardwareMaterial}
      />

      {runs.map((run, i) => {
        const [cx, cz] = run.center
        const size =
          run.axis === 'x' ? [run.length, barThickness, barThickness] : [barThickness, barThickness, run.length]
        const kickSize = run.axis === 'x' ? [run.length, kickPlateHeight, 0.012] : [0.012, kickPlateHeight, run.length]

        return (
          <group key={i}>
            <mesh position={[cx, topRailY, cz]} material={material} dispose={null} castShadow>
              <boxGeometry args={size} />
            </mesh>
            <mesh position={[cx, midRailY, cz]} material={material} dispose={null} castShadow>
              <boxGeometry args={size} />
            </mesh>
            <mesh position={[cx, kickPlateY, cz]} material={material} dispose={null} castShadow receiveShadow>
              <boxGeometry args={kickSize} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

// A trapeze hanger supporting a cable tray from the slab above: two drop
// rods plus a cross-channel the tray rails sit in — the real fixed point a
// tray run needs at intervals along its length, not just where it happens
// to pass through a wall.
export function CableTraySupport({ position, dropHeight = 0.3, span = 0.26, material = hardwareMaterial }) {
  const rodPositions = [
    [0, -dropHeight / 2, -span / 2],
    [0, -dropHeight / 2, span / 2],
  ]
  return (
    <group position={position}>
      <InstancedCylinders positions={rodPositions} radius={0.012} length={dropHeight} material={material} />
      <mesh position={[0, -dropHeight, 0]} material={material} dispose={null} castShadow>
        <boxGeometry args={[0.05, 0.03, span + 0.05]} />
      </mesh>
    </group>
  )
}

/**
 * Primitives for the hotspot-reveal assemblies. Same conventions as
 * everything above: no boolean/CSG geometry, external/shared materials
 * always get `dispose={null}`, local (non-shared) geometry built once via
 * `useMemo` doesn't need it. `ConcreteSection`/`FirestopSeal` use
 * `THREE.ExtrudeGeometry` on a `THREE.Shape` with a hole — genuine 3D bore
 * geometry (a real annular gap/cut edge), not a boolean subtraction, using a
 * standard three.js feature (shape-with-holes extrusion) rather than a CSG
 * library. Both rely on three.js's own `ExtrudeGeometry` material-group
 * convention: group 0 = the flat front/back cap faces, group 1 = every
 * extruded side face (the shape's own outer perimeter AND each hole's inner
 * wall) — physically correct here, since the outer edge and the bore wall
 * are both "cut substrate", the same material either way.
 */

// A local chunk of concrete/substrate with a real circular bore through it —
// the wall/slab section immediately around a penetration, not the building's
// whole wall (that's ExteriorShell's job; this is the close-up detail a
// hotspot reveal shows). Local hole axis runs along Z (shape drawn in the
// XY plane, matching `FirestopCollar`'s own default-rotation convention);
// pass `rotation={[Math.PI / 2, 0, 0]}` for a floor/ceiling penetration, same
// as every other penetration primitive in this file.
export function ConcreteSection({
  position,
  rotation = [0, 0, 0],
  size = [0.55, 0.55],
  depth = 0.2,
  holeRadius = 0.13,
  holeOffset = [0, 0],
  faceMaterial,
  edgeMaterial,
  segments = 28,
}) {
  const [w, h] = size
  const [holeOffsetX, holeOffsetY] = holeOffset
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-w / 2, -h / 2)
    shape.lineTo(w / 2, -h / 2)
    shape.lineTo(w / 2, h / 2)
    shape.lineTo(-w / 2, h / 2)
    shape.closePath()
    const hole = new THREE.Path()
    hole.absarc(holeOffsetX, holeOffsetY, holeRadius, 0, Math.PI * 2, true)
    shape.holes.push(hole)
    const geom = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: segments, steps: 1 })
    geom.translate(0, 0, -depth / 2)
    geom.computeVertexNormals()
    return geom
  }, [w, h, depth, holeRadius, holeOffsetX, holeOffsetY, segments])

  return (
    <mesh
      position={position}
      rotation={rotation}
      geometry={geometry}
      material={[faceMaterial, edgeMaterial ?? faceMaterial]}
      dispose={null}
      castShadow
      receiveShadow
    />
  )
}

// The firestop fill itself — a washer/annulus of sealant material genuinely
// occupying the gap between a penetrating service's OD (`innerRadius`) and
// the opening edge (`outerRadius`), built the same shape-with-hole-extrude
// way as `ConcreteSection` above, plus a proud surface bead ring at the
// visible face (the tooled tri-bead finish a real firestop application has
// at the exposed edge, distinct from a flush, invisible fill). Distinct from
// `FirestopCollar` (the mounting-flange/ring hardware a collar-type product
// is fixed to the substrate with) — a real assembly combines both: this is
// the fill, `FirestopCollar` is the visible hardware in front of it.
export function FirestopSeal({
  position,
  rotation = [0, 0, 0],
  innerRadius = 0.105,
  outerRadius = 0.14,
  depth = 0.2,
  fillMaterial,
  beadMaterial,
  segments = 28,
}) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false)
    const hole = new THREE.Path()
    hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true)
    shape.holes.push(hole)
    const geom = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: segments, steps: 1 })
    geom.translate(0, 0, -depth / 2)
    geom.computeVertexNormals()
    return geom
  }, [innerRadius, outerRadius, depth, segments])

  const beadRadius = (innerRadius + outerRadius) / 2
  const beadTube = Math.max(0.006, (outerRadius - innerRadius) * 0.24)

  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geometry} material={fillMaterial} dispose={null} castShadow receiveShadow />
      <mesh
        position={[0, 0, depth / 2 + 0.004]}
        rotation={[Math.PI / 2, 0, 0]}
        material={beadMaterial ?? fillMaterial}
        dispose={null}
        castShadow
      >
        <torusGeometry args={[beadRadius, beadTube, 8, segments]} />
      </mesh>
    </group>
  )
}

const CABLE_LAYOUT_AXES = {
  x: (a, b) => [0, a, b],
  y: (a, b) => [a, 0, b],
  z: (a, b) => [a, b, 0],
}
const CABLE_INSTANCE_ROTATION = {
  x: [0, 0, Math.PI / 2],
  y: [0, 0, 0],
  z: [Math.PI / 2, 0, 0],
}

// A bundle of N individual thin cables at a tray cross-section — each with a
// small seeded position jitter so the bundle reads as installed individual
// conductors laid by hand, not a perfect factory-stamped array. `axis` is
// which world/local axis the cables RUN along (their length); the jitter
// grid fills the other two. One `Instances` draw call regardless of count.
export function CableBundle({
  position,
  rotation,
  axis = 'x',
  count = 6,
  spacing = 0.045,
  radius = 0.013,
  length = 1.6,
  material,
  seed = 1,
}) {
  const positions = useMemo(() => {
    const perRow = Math.ceil(Math.sqrt(count))
    const layout = CABLE_LAYOUT_AXES[axis]
    const result = []
    let s = (seed * 9301 + 49297) % 233280
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / perRow)
      const col = i % perRow
      s = (s * 9301 + 49297) % 233280
      const jitterA = (s / 233280 - 0.5) * spacing * 0.3
      s = (s * 9301 + 49297) % 233280
      const jitterB = (s / 233280 - 0.5) * spacing * 0.3
      const a = col * spacing - ((perRow - 1) * spacing) / 2 + jitterA
      const b = row * spacing - ((perRow - 1) * spacing) / 2 + jitterB
      result.push(layout(a, b))
    }
    return result
  }, [axis, count, spacing, seed])

  return (
    <group position={position} rotation={rotation}>
      <Instances limit={positions.length} castShadow material={material} dispose={null}>
        <cylinderGeometry args={[radius, radius, length, 8]} />
        {positions.map((p, i) => (
          <Instance key={i} position={p} rotation={CABLE_INSTANCE_ROTATION[axis]} />
        ))}
      </Instances>
    </group>
  )
}

// A threaded hanger rod with a hex nut at each end (and an optional washer
// under each nut) — the standard MEP support-rod hardware, reads convincingly
// at this scale as a nut + washer rather than actual helical thread geometry.
// Local axis Y, matching every other vertical-member primitive in this file.
export function ThreadedRod({
  position,
  rotation = [0, 0, 0],
  length = 0.4,
  radius = 0.012,
  material = hardwareMaterial,
  nutTop = true,
  nutBottom = true,
  washerTop = false,
  washerBottom = false,
}) {
  const nutRadius = radius * 2.1
  const nutHeight = radius * 1.6
  const washerRadius = radius * 2.6
  const washerHeight = radius * 0.5

  return (
    <group position={position} rotation={rotation}>
      <mesh material={material} dispose={null} castShadow>
        <cylinderGeometry args={[radius, radius, length, 10]} />
      </mesh>
      {nutTop && (
        <mesh position={[0, length / 2 - nutHeight / 2, 0]} material={material} dispose={null} castShadow>
          <cylinderGeometry args={[nutRadius, nutRadius, nutHeight, 6]} />
        </mesh>
      )}
      {nutBottom && (
        <mesh position={[0, -length / 2 + nutHeight / 2, 0]} material={material} dispose={null} castShadow>
          <cylinderGeometry args={[nutRadius, nutRadius, nutHeight, 6]} />
        </mesh>
      )}
      {washerTop && (
        <mesh position={[0, length / 2 - nutHeight - washerHeight / 2, 0]} material={material} dispose={null} castShadow>
          <cylinderGeometry args={[washerRadius, washerRadius, washerHeight, 12]} />
        </mesh>
      )}
      {washerBottom && (
        <mesh position={[0, -length / 2 + nutHeight + washerHeight / 2, 0]} material={material} dispose={null} castShadow>
          <cylinderGeometry args={[washerRadius, washerRadius, washerHeight, 12]} />
        </mesh>
      )}
    </group>
  )
}

// A strut/support-channel profile (real MEP hanger hardware, e.g. Unistrut-
// style): a back web + two side walls + two inward lips at the open face —
// built from primitive boxes (no extrude needed at this fidelity), reads as
// a real C-section rather than a bare square tube thanks to the open slot +
// lips. Local axis Y (a vertical drop/post channel); rotate for a horizontal
// cross-member.
export function SupportChannel({ position, rotation = [0, 0, 0], length = 0.4, width = 0.041, wall = 0.0025, material = galvanizedMaterial }) {
  const half = width / 2
  const lipWidth = width * 0.22
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -half + wall / 2]} material={material} dispose={null} castShadow>
        <boxGeometry args={[width, length, wall]} />
      </mesh>
      <mesh position={[-half + wall / 2, 0, 0]} material={material} dispose={null} castShadow>
        <boxGeometry args={[wall, length, width]} />
      </mesh>
      <mesh position={[half - wall / 2, 0, 0]} material={material} dispose={null} castShadow>
        <boxGeometry args={[wall, length, width]} />
      </mesh>
      <mesh position={[-half + lipWidth / 2, 0, half - wall / 2]} material={material} dispose={null} castShadow>
        <boxGeometry args={[lipWidth, length, wall]} />
      </mesh>
      <mesh position={[half - lipWidth / 2, 0, half - wall / 2]} material={material} dispose={null} castShadow>
        <boxGeometry args={[lipWidth, length, wall]} />
      </mesh>
    </group>
  )
}

// A split pipe/duct clamp band — two arced half-loops (torus segments, each
// leaving a real gap) bridged by two bolt lugs at the split points, instead
// of one unbroken decorative ring. Local axis matches `PipeSupport`'s own
// strap-ring convention (band lies in the XY plane, wraps a Y-axis pipe).
export function Clamp({ position, rotation = [0, 0, 0], pipeRadius = 0.1, material = hardwareMaterial, boltMaterial = hardwareMaterial }) {
  const bandRadius = pipeRadius + 0.014
  const tube = 0.012
  const lugOffset = bandRadius + tube
  return (
    <group position={position} rotation={rotation}>
      <mesh rotation={[Math.PI / 2, 0, Math.PI * 0.04]} material={material} dispose={null} castShadow>
        <torusGeometry args={[bandRadius, tube, 8, 20, Math.PI * 0.92]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, Math.PI * 1.04]} material={material} dispose={null} castShadow>
        <torusGeometry args={[bandRadius, tube, 8, 20, Math.PI * 0.92]} />
      </mesh>
      <mesh position={[lugOffset, 0, 0]} material={boltMaterial} dispose={null} castShadow>
        <boxGeometry args={[0.024, 0.05, 0.02]} />
      </mesh>
      <mesh position={[-lugOffset, 0, 0]} material={boltMaterial} dispose={null} castShadow>
        <boxGeometry args={[0.024, 0.05, 0.02]} />
      </mesh>
    </group>
  )
}

// A concrete wedge/expansion anchor: an exposed bolt shaft + hex head +
// washer, protruding from the substrate face at local y=0 (the embedded
// portion inside the concrete isn't modeled — only what a real inspection
// would ever see). Local axis Y, pointing away from the substrate it's
// anchored into; rotate to match the surface (e.g. `[Math.PI, 0, 0]` for a
// ceiling-mounted anchor pointing down).
export function Anchor({ position, rotation = [0, 0, 0], length = 0.05, radius = 0.008, material = hardwareMaterial }) {
  const headRadius = radius * 2.3
  const headHeight = radius * 1.8
  const washerRadius = radius * 2.8
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, length / 2, 0]} material={material} dispose={null} castShadow>
        <cylinderGeometry args={[radius, radius, length, 8]} />
      </mesh>
      <mesh position={[0, length + headHeight / 2, 0]} material={material} dispose={null} castShadow>
        <cylinderGeometry args={[headRadius, headRadius, headHeight, 6]} />
      </mesh>
      <mesh position={[0, length + 0.002, 0]} material={material} dispose={null} castShadow>
        <cylinderGeometry args={[washerRadius, washerRadius, 0.004, 12]} />
      </mesh>
    </group>
  )
}

// A thin, soft/fibrous-looking insulation layer — a plain box (the "cheap on
// purpose" fallback: matte, high-roughness
// material tuning rather than a new noise-texture pipeline for one small
// layer). Named/parametric so a wall build-up reads as a deliberate layer,
// not an unlabeled inline mesh.
export function InsulationLayer({ position, rotation = [0, 0, 0], size = [0.5, 0.08, 0.06], material }) {
  return (
    <mesh position={position} rotation={rotation} material={material} dispose={null} castShadow receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  )
}

// A real coil-spring curve, swept into a tube — cheap (one TubeGeometry, one
// draw call) and mechanically legible as an actual compression spring rather
// than a decorative cylinder.
class SpringCurve extends THREE.Curve {
  constructor(radius, height, turns) {
    super()
    this.radius = radius
    this.height = height
    this.turns = turns
  }
  getPoint(t, target = new THREE.Vector3()) {
    const angle = t * Math.PI * 2 * this.turns
    const y = t * this.height - this.height / 2
    return target.set(Math.cos(angle) * this.radius, y, Math.sin(angle) * this.radius)
  }
}

// A vibration isolator: bottom bearing plate -> isolation element (a real
// coil spring, or an elastomer block for the `'pad'` variant) -> top bearing
// plate, self-contained (the plates a real isolator assembly always has, not
// separate meshes the caller has to place). Local axis Y.
export function Isolator({
  position,
  rotation = [0, 0, 0],
  type = 'spring',
  radius = 0.06,
  height = 0.09,
  turns = 5,
  tube = 0.008,
  material,
  plateMaterial = hardwareMaterial,
  plateRadius,
  plateHeight = 0.012,
}) {
  const curve = useMemo(() => new SpringCurve(radius, height, turns), [radius, height, turns])
  const pr = plateRadius ?? radius + 0.02

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, -height / 2 - plateHeight / 2, 0]} material={plateMaterial} dispose={null} castShadow>
        <cylinderGeometry args={[pr, pr, plateHeight, 20]} />
      </mesh>
      {type === 'spring' ? (
        <mesh material={material} dispose={null} castShadow>
          <tubeGeometry args={[curve, turns * 10, tube, 6, false]} />
        </mesh>
      ) : (
        <mesh material={material} dispose={null} castShadow>
          <boxGeometry args={[radius * 1.7, height, radius * 1.7]} />
        </mesh>
      )}
      <mesh position={[0, height / 2 + plateHeight / 2, 0]} material={plateMaterial} dispose={null} castShadow>
        <cylinderGeometry args={[pr, pr, plateHeight, 20]} />
      </mesh>
    </group>
  )
}
