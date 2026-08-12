import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { concreteMaterial, concreteDarkMaterial } from '../buildingMaterials'

// A dedicated, slightly emissive material for the two "pop" plugs' metal
// inspection-port caps — deliberately not the shared, highly-reflective
// `hardwareMaterial` (used for bolts/brackets elsewhere), which under this
// scene's directional-key + environment lighting can render as a near-black
// disc at some view angles (very low diffuse contribution outside its
// narrow specular highlight, reflecting the dark night-sky Environment
// preset). A small constant emissive floor keeps it reading as a lit metal
// cap at every camera angle instead of an unintended dark hole.
const popCapMaterial = new THREE.MeshStandardMaterial({
  color: '#9AA0A6',
  roughness: 0.55,
  metalness: 0.3,
  emissive: '#2E3033',
  emissiveIntensity: 0.5,
})

const HALF_W = 3
const HALF_D = 2
const WALL_TOP = 3.6
const THK = 0.16
const CHAMFER = 0.02
const CHAMFER_SMOOTHNESS = 2
// Same exponential-ease rate as Hero3DScene's CameraRig, so a panel's
// open/close motion reads as part of the same camera transition rather than
// a separately-timed animation competing with it.
const EASE_RATE = 6

// ---- wall-local (u,v) rect -> world position/size ------------------------
// `u` runs along each wall's own horizontal axis (world X for front/back,
// world Z for left/right); `v` is always world Y (height). Keeping every
// hole/filler authored in this local frame is what lets the same rect shape
// serve any of the four walls.
function rectToWorld(orientation, rect) {
  const cu = (rect.u0 + rect.u1) / 2
  const cv = (rect.v0 + rect.v1) / 2
  const su = rect.u1 - rect.u0
  const sv = rect.v1 - rect.v0
  switch (orientation) {
    case 'front':
      return { position: [cu, cv, HALF_D], size: [su, sv, THK] }
    case 'back':
      return { position: [cu, cv, -HALF_D], size: [su, sv, THK] }
    case 'left':
      return { position: [-HALF_W, cv, cu], size: [THK, sv, su] }
    case 'right':
      return { position: [HALF_W, cv, cu], size: [THK, sv, su] }
    default:
      throw new Error(`unknown wall orientation: ${orientation}`)
  }
}

function WallFiller({ orientation, rect, material }) {
  const { position, size } = rectToWorld(orientation, rect)
  return (
    <RoundedBox
      args={size}
      radius={CHAMFER}
      smoothness={CHAMFER_SMOOTHNESS}
      position={position}
      material={material}
      dispose={null}
      castShadow
      receiveShadow
    />
  )
}

// The permanent, always-solid part of each wall — everything except the 7
// context-aware openings below. Back/left/right content is relocated
// verbatim from the old Shell.jsx; front is new (this is what actually
// closes the permanent open-cutaway).
// Column boundaries below are wider than each system's own real footprint
// on purpose: each opening must line up with BOTH (a) where that system
// actually sits and (b) the point where that hotspot's fixed, unchangeable
// `cameraPosition`-to-`position` sightline actually crosses this wall plane
// (the two aren't always the same point once a camera looks at a shallow
// angle) — verified per-hotspot by projecting that exact ray against the
// z=HALF_D plane, not guessed.
const FRONT_FILLERS = [
  { u0: -3, u1: -2.7, v0: 0, v1: WALL_TOP },
  { u0: -2.7, u1: -0.45, v0: 0, v1: 2.15 },
  { u0: -0.45, u1: -0.4, v0: 0, v1: WALL_TOP },
  { u0: -0.4, u1: 0.75, v0: 0, v1: 0.85 },
  { u0: -0.4, u1: 0.75, v0: 2.5, v1: WALL_TOP },
  { u0: 0.75, u1: 0.8, v0: 0, v1: WALL_TOP },
  { u0: 0.8, u1: 2.3, v0: 0, v1: 0.3 },
  { u0: 0.8, u1: 2.3, v0: 3.3, v1: WALL_TOP },
  { u0: 2.3, u1: 3, v0: 0, v1: WALL_TOP },
]

const BACK_FILLERS = [
  { u0: -3, u1: -2.75, v0: 0, v1: WALL_TOP },
  { u0: -2.75, u1: -2.25, v0: 0.5, v1: WALL_TOP },
  { u0: -2.25, u1: 3, v0: 0, v1: WALL_TOP },
]

const LEFT_FILLERS = [
  { u0: -2.0, u1: -1.75, v0: 0, v1: 0.2 },
  { u0: -2.0, u1: -1.75, v0: 3.4, v1: WALL_TOP },
  { u0: -1.75, u1: -1.4, v0: 0, v1: WALL_TOP },
  { u0: -1.4, u1: 0.2, v0: 0, v1: 0.7 },
  { u0: -1.4, u1: 0.2, v0: 1.6, v1: WALL_TOP },
  { u0: 0.2, u1: 2, v0: 0, v1: WALL_TOP },
]

const RIGHT_FILLERS = [
  { u0: -1.8, u1: -1.1, v0: 0, v1: 1.05 },
  { u0: -1.8, u1: -1.1, v0: 1.4, v1: WALL_TOP },
  { u0: -1.1, u1: 0.8, v0: 0, v1: WALL_TOP },
]

// ---- The 7 context-aware openings ----------------------------------------
// Mechanism is chosen per hotspot from what that hotspot's own group models
// (see groups/PassiveFireProtection.jsx etc.), not one panel reused
// everywhere:
//   - 'pop'   a small cored/drilled penetration plug pulls straight out
//             along the wall's own outward normal, like a removed core
//             sample — only for the two hotspots that really are a drilled
//             pipe/port through a wall (passiveFireProtection,
//             waterproofInjection share this because they're genuinely the
//             same real construction, just different sizes).
//   - 'slide' a removable access-panel section slides sideways or lifts —
//             used for the cable tray (a real removable tray-access panel),
//             the suspended conduit run (a service hatch in the upper wall
//             band), and the fireproofed column's own structural cutaway
//             (full member height, narrow width, lifts like a rolling
//             shutter — deliberately differently-proportioned and a
//             different axis than the other two so it doesn't read as "the
//             same panel again"). The acoustic strip gets its own small
//             slide-down "kick panel" variant since it's a low, thin,
//             floor-line detail, not a mid-wall section.
//   - 'hinge' the corner control/expansion joint isn't a penetration or a
//             panel — it peels open like a thin door hinged at the real
//             building corner, tracing the joint line itself.
const PANEL_DEFS = [
  {
    // Pops INWARD (away from its own fixed hotspot camera, which sits very
    // close to this wall face) rather than outward toward the viewer —
    // moving the plug toward the camera instead would fill the frame with
    // the plug's own bulk rather than clearing a view through to the pipe
    // riser behind it.
    id: 'passiveFireProtection',
    orientation: 'front',
    rect: { u0: -0.4, u1: 0.75, v0: 0.85, v1: 2.5 },
    kind: 'pop',
    axis: [0, 0, -1],
    distance: 0.5,
  },
  {
    // Same reasoning as passiveFireProtection above, mirrored for the back
    // wall: pops toward +Z (into the building), away from its own camera
    // which sits behind the building at z=-4.
    id: 'waterproofInjection',
    orientation: 'back',
    rect: { u0: -2.75, u1: -2.25, v0: 0, v1: 0.5 },
    kind: 'pop',
    axis: [0, 0, 1],
    distance: 0.35,
  },
  {
    id: 'fireproofingSystems',
    orientation: 'front',
    rect: { u0: 0.8, u1: 2.3, v0: 0.3, v1: 3.3 },
    kind: 'slide',
    axis: [0, 1, 0],
    distance: 3.0,
  },
  {
    id: 'mechanicalSupport',
    orientation: 'front',
    rect: { u0: -2.7, u1: -0.45, v0: 2.15, v1: 3.6 },
    kind: 'slide',
    axis: [1, 0, 0],
    distance: 2.25,
  },
  {
    id: 'cableProtection',
    orientation: 'left',
    rect: { u0: -1.4, u1: 0.2, v0: 0.7, v1: 1.6 },
    kind: 'slide',
    axis: [0, 0, 1],
    distance: 1.6,
  },
  {
    id: 'acousticInsulation',
    orientation: 'right',
    rect: { u0: -1.8, u1: -1.1, v0: 1.05, v1: 1.4 },
    kind: 'slide',
    axis: [0, -1, 0],
    distance: 0.35,
  },
  {
    id: 'jointSealing',
    orientation: 'left',
    rect: { u0: -2.0, u1: -1.75, v0: 0.2, v1: 3.4 },
    kind: 'hinge',
    angle: -1.3, // ~75 degrees, swinging outward/away from the building
  },
]

// Resolves each def's rest-state (closed) world transform once. For 'hinge'
// the pivot is the rect's own back edge (the real building corner the joint
// traces) rather than the rect's center, so rotating the group swings the
// plug like a door hinged at that corner; `localOffset` is where the visible
// plug geometry sits relative to that pivot.
function closedTransform(def) {
  const { position, size } = rectToWorld(def.orientation, def.rect)
  if (def.kind !== 'hinge') return { position, size }

  const hinge = rectToWorld(def.orientation, { ...def.rect, u1: def.rect.u0 })
  const halfWidth = (def.rect.u1 - def.rect.u0) / 2
  return { position: hinge.position, size, localOffset: [0, 0, halfWidth] }
}

// A panel group's rest transform is set exactly once, the moment its ref
// first attaches (never as a reactive JSX `position`/`rotation` prop) —
// `useFrame` below is the only thing that ever touches it afterward. Passing
// position/rotation as ordinary JSX props here would fight the animation,
// since React re-applies them on every re-render (e.g. every time
// `activeGroup` changes). The `ref={(el) => {...}}` below is written inline
// (not returned from a helper) so it reads as an ordinary React callback ref
// that runs at commit time, not render.
const OUTWARD_Z = { front: 1, back: -1 }

function PopPlug({ def, position, onRegister }) {
  const { size } = closedTransform(def)
  // Capped at a fixed, plausible inspection-port size rather than always
  // scaling with the plug's own footprint — passiveFireProtection's plug
  // is sized to cover two different anchor points (see FRONT_FILLERS
  // above) and is noticeably bigger than the port itself would be.
  const capRadius = Math.min(0.32, Math.min(size[0], size[1]) / 2 - 0.08)
  // The visible port cap always sits on the wall's PUBLIC-facing side,
  // independent of which way the plug itself slides (see PANEL_DEFS: both
  // 'pop' plugs deliberately slide inward, away from their own close-up
  // camera, not toward the face the cap should read on).
  const capSign = OUTWARD_Z[def.orientation] ?? 1
  return (
    <group
      ref={(el) => {
        if (el && !el.userData.initialized) {
          el.position.set(...position)
          el.userData.initialized = true
          el.userData.base = position
          el.userData.offset = 0
        }
        onRegister(def.id, el)
      }}
    >
      <RoundedBox
        args={size}
        radius={CHAMFER}
        smoothness={CHAMFER_SMOOTHNESS}
        material={concreteMaterial}
        dispose={null}
        castShadow
        receiveShadow
      />
      {/* Metal inspection-port cap on the outer face — the visual cue that
          this plug is a serviceable cored penetration, not decoration. */}
      <mesh
        position={[0, 0, capSign * (THK / 2 + 0.02)]}
        rotation={[Math.PI / 2, 0, 0]}
        material={popCapMaterial}
        dispose={null}
        castShadow
      >
        <cylinderGeometry args={[capRadius, capRadius, 0.04, 20]} />
      </mesh>
    </group>
  )
}

function SlidePlug({ def, position, onRegister }) {
  const { size } = closedTransform(def)
  return (
    <group
      ref={(el) => {
        if (el && !el.userData.initialized) {
          el.position.set(...position)
          el.userData.initialized = true
          el.userData.base = position
          el.userData.offset = 0
        }
        onRegister(def.id, el)
      }}
    >
      <RoundedBox
        args={size}
        radius={CHAMFER}
        smoothness={CHAMFER_SMOOTHNESS}
        material={concreteMaterial}
        dispose={null}
        castShadow
        receiveShadow
      />
    </group>
  )
}

function HingePlug({ def, position, onRegister }) {
  const { size, localOffset } = closedTransform(def)
  return (
    <group
      ref={(el) => {
        if (el && !el.userData.initialized) {
          el.position.set(...position)
          el.rotation.y = 0
          el.userData.initialized = true
          el.userData.base = position
          el.userData.offset = 0
        }
        onRegister(def.id, el)
      }}
    >
      <RoundedBox
        args={size}
        radius={CHAMFER}
        smoothness={CHAMFER_SMOOTHNESS}
        position={localOffset}
        material={concreteMaterial}
        dispose={null}
        castShadow
        receiveShadow
      />
    </group>
  )
}

/**
 * The building's exterior envelope: back/left/right walls (relocated
 * verbatim from the old Shell.jsx) plus a new front wall that finally closes
 * the permanent open-cutaway — the building reads as a complete, realistic
 * exterior by default now (see the camera-pivot brief). Each of the 7
 * solid-wall hotspots gets its own locally-scoped opening (PANEL_DEFS above)
 * shaped/sized/animated to match what that specific system actually is,
 * driven directly off the already-threaded `activeGroup` prop — no changes
 * needed anywhere else in the scene for this to work (Building.jsx already
 * passes `activeGroup` to every group; reset already clears it through the
 * existing `resetCamera()` path).
 *
 * `drillingCutting`/`engineeringTesting` are NOT here — both sit at/behind
 * the existing curtain-wall glazing (Architecture.jsx), so there's nothing
 * opaque to open; `vibrationSolutions` needs nothing here either (roof,
 * already exterior-visible).
 */
export default function ExteriorShell({ activeGroup = null, visible = true }) {
  const panelRefs = useRef({})
  // Stable identity across renders — a plain function prop passed to each
  // Plug component's inline ref callback, rather than passing the mutable
  // `panelRefs` ref object itself down as a prop for a child to write into.
  const registerPanel = (id, el) => {
    panelRefs.current[id] = el
  }

  useFrame((_, delta) => {
    // Hidden by default now (see groups/index.js) — skip the per-frame lerp
    // work entirely while dormant rather than animating invisible panels.
    if (!visible) return

    const t = 1 - Math.exp(-delta * EASE_RATE)
    PANEL_DEFS.forEach((def) => {
      const obj = panelRefs.current[def.id]
      if (!obj) return
      const isOpen = activeGroup === def.id

      if (def.kind === 'hinge') {
        const target = isOpen ? def.angle : 0
        obj.rotation.y = THREE.MathUtils.lerp(obj.rotation.y, target, t)
        return
      }

      const target = isOpen ? def.distance : 0
      const next = THREE.MathUtils.lerp(obj.userData.offset ?? 0, target, t)
      obj.userData.offset = next
      const [bx, by, bz] = obj.userData.base
      obj.position.set(bx + def.axis[0] * next, by + def.axis[1] * next, bz + def.axis[2] * next)
    })
  })

  return (
    <group visible={visible}>
      {FRONT_FILLERS.map((rect, i) => (
        <WallFiller key={`front-${i}`} orientation="front" rect={rect} material={concreteMaterial} />
      ))}
      {BACK_FILLERS.map((rect, i) => (
        <WallFiller key={`back-${i}`} orientation="back" rect={rect} material={concreteMaterial} />
      ))}
      {LEFT_FILLERS.map((rect, i) => (
        <WallFiller key={`left-${i}`} orientation="left" rect={rect} material={concreteMaterial} />
      ))}
      {RIGHT_FILLERS.map((rect, i) => (
        <WallFiller key={`right-${i}`} orientation="right" rect={rect} material={concreteMaterial} />
      ))}

      {/* Vertical expansion-joint reveal on the back wall (relocated
          verbatim from Shell.jsx) — clear of the waterproofInjection
          opening (u -2.75..-2.25). */}
      <mesh position={[0.9, 1.8, -1.9]} material={concreteDarkMaterial} dispose={null}>
        <boxGeometry args={[0.025, 3.6, 0.02]} />
      </mesh>

      {PANEL_DEFS.map((def) => {
        const { position } = closedTransform(def)
        if (def.kind === 'pop')
          return <PopPlug key={def.id} def={def} position={position} onRegister={registerPanel} />
        if (def.kind === 'hinge')
          return <HingePlug key={def.id} def={def} position={position} onRegister={registerPanel} />
        return <SlidePlug key={def.id} def={def} position={position} onRegister={registerPanel} />
      })}
    </group>
  )
}
