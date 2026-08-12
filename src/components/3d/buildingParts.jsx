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
// posts. One draw call for however many `positions` are given, per the perf
// brief's "use instancing for repeated supports" note.
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
