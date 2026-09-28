import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import {
  facadeMaterial,
  concreteDarkMaterial,
  panelCharcoalMaterial,
  timberMaterial,
  framingMaterial,
  glazingMaterial,
  hardwareMaterial,
  galvanizedMaterial,
  warmGlowMaterial,
  signPanelMaterial,
  signTextTexture,
  entranceGlassMaterial,
  interiorWallGlowMaterial,
  interiorSilhouetteMaterial,
} from '../buildingMaterials'
import { InstancedBoxes, InstancedCylinders } from '../buildingParts'

// A dedicated, slightly emissive material for the two "pop" plugs' metal
// inspection-port caps — deliberately not the shared, highly-reflective
// `hardwareMaterial` (used for bolts/brackets elsewhere), which under this
// scene's directional-key + environment lighting can render as a near-black
// disc at some view angles (very low diffuse contribution outside its
// narrow specular highlight, reflecting the dark night-sky Environment
// preset). A small constant emissive floor keeps it reading as a lit metal
// cap at every camera angle instead of an unintended dark hole.
// Round-highlight fix (screenshot-verified): at the original 0.55/0.3
// roughness/metalness, this small disc's specular response to the nearby
// warm entrance point light produced a bright, radially-symmetric highlight
// blob that read as a glowing BALL regardless of the flat/flush geometry it
// actually sits on (a point-light specular lobe is round on any surface,
// flat or curved) — confirmed by isolating this mesh and re-screenshotting.
// Flattened toward matte (less specular energy to concentrate into a round
// hotspot) and less metallic; emissive floor trimmed slightly to match.
const popCapMaterial = new THREE.MeshStandardMaterial({
  color: '#9AA0A6',
  roughness: 0.85,
  metalness: 0.08,
  emissive: '#2E3033',
  emissiveIntensity: 0.3,
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
// Massing pass: the old single `-2.7..-0.45` ground-band filler now carves a
// recessed main-entrance opening (u -1.55..-0.95, v0..1.0 — see
// `ENTRANCE_DOOR` below) out of its left portion, and hands its rightmost
// 0.5 units (`-0.95..-0.45`) to a dedicated dark accent pier
// (`ACCENT_PIER_RECT`, rendered separately below with
// `panelCharcoalMaterial` + a timber-slat overlay) instead of plain facade —
// this is purely a material/void change within the SAME outer footprint as
// before (still spans -2.7..-0.45, v0..2.15 in total), so none of the 7
// PANEL_DEFS openings elsewhere on this wall (all defined by their own,
// untouched rects) are affected.
//
// Reference-fidelity pass: the old single `-2.7..-1.55, v0..2.15` filler
// (plain, blank facade — the single biggest gap against the reference,
// which shows a real ground+first-floor window wall there) is now carved
// into a window surround (jambs/sill/spandrel/head, still `facadeMaterial`,
// still the exact same outer footprint) with two real recessed windows
// filled in by `FacadeWindowUnit` below (see `WINDOW_ZONE` / `WINDOW_JAMB`).
// Still entirely clear of every PANEL_DEFS rect (all defined independently,
// below) and of `mechanicalSupport`'s slide panel directly above it
// (v2.15..3.6, same u-range but non-overlapping v-range).
//
// Camera/massing pass ("wide/low/warm" rework): the left budget below
// mechanicalSupport's own fixed rect (u -2.7..-0.45, v2.15..3.6 — UNCHANGED,
// see the split-out upper-corner filler below) is re-split within its own
// v0..2.15 band only: corner filler shrinks from a full 0.3 to 0.15 (it was
// pure dead facade with no functional role beyond a chamfer margin), which
// is handed to the entrance (0.6 -> 0.8 wide) — the brief's single biggest
// front-facade complaint ("too narrow/weak"). Window zone keeps its old
// 1.15 total width (just shifted 0.15 left to -2.85..-1.70) but gets
// genuinely bigger GLASS via a thinner jamb (WINDOW_JAMB 0.15 -> 0.08) and
// taller openings (spandrel gap between floors shrunk, ground window grown)
// — "larger window openings" without needing more u-budget. The accent
// pier is effectively unchanged in width (-0.95..-0.4 -> -0.90..-0.4, i.e.
// 0.55 -> 0.50) since the entrance/window changes already consumed the
// freed-up corner-filler budget; its "wider" read instead comes from a
// substantially thicker/deeper timber screen within it (see
// `EntranceAssembly` below) and from `panelCharcoalMaterial`'s own contrast
// tune (buildingMaterials.js). Every boundary below is still contiguous
// (corner -> window -> entrance -> pier, summing to the same fixed 2.6
// units from -3 to -0.4), so nothing here can create a wall gap or overlap
// a PANEL_DEFS rect.
const WINDOW_ZONE_U0 = -2.85
const WINDOW_ZONE_U1 = -1.7
const WINDOW_JAMB = 0.08
const WINDOW_U0 = WINDOW_ZONE_U0 + WINDOW_JAMB // -2.77
const WINDOW_U1 = WINDOW_ZONE_U1 - WINDOW_JAMB // -1.78
const GROUND_WIN_V0 = 0.15
const GROUND_WIN_V1 = 1.15
const UPPER_WIN_V0 = 1.3
const UPPER_WIN_V1 = 2.0
const WINDOW_ZONE_V1 = 2.15

const FRONT_FILLERS = [
  // Corner filler, full height at its OLD -3..-2.7 boundary for the
  // v2.15..WALL_TOP band (matches mechanicalSupport's own fixed rect start
  // at u=-2.7 exactly — untouched), but narrowed to -3..-2.85 for the
  // v0..2.15 band below it, handing that freed 0.15 to the window zone's
  // own left jamb (see WINDOW_ZONE_U0 above).
  { u0: -3, u1: -2.7, v0: 2.15, v1: WALL_TOP },
  { u0: -3, u1: -2.85, v0: 0, v1: 2.15 },
  // Window-zone surround (jambs + sill + spandrel + head band) — the void
  // left in the middle at GROUND_WIN/UPPER_WIN is filled by real glazing in
  // `WindowZone` below, not by another facade filler.
  { u0: WINDOW_ZONE_U0, u1: WINDOW_U0, v0: 0, v1: WINDOW_ZONE_V1 },
  { u0: WINDOW_U1, u1: WINDOW_ZONE_U1, v0: 0, v1: WINDOW_ZONE_V1 },
  { u0: WINDOW_U0, u1: WINDOW_U1, v0: 0, v1: GROUND_WIN_V0 },
  { u0: WINDOW_U0, u1: WINDOW_U1, v0: GROUND_WIN_V1, v1: UPPER_WIN_V0 },
  { u0: WINDOW_U0, u1: WINDOW_U1, v0: UPPER_WIN_V1, v1: WINDOW_ZONE_V1 },
  { u0: -1.7, u1: -0.9, v0: 1.05, v1: 2.15 },
  // Sliver above the accent pier (see ACCENT_PIER_RECT below, -0.9..-0.4) —
  // only the v2.15..WALL_TOP portion is still needed here since the pier
  // itself now covers v0..2.15 across this same u-range.
  { u0: -0.45, u1: -0.4, v0: 2.15, v1: WALL_TOP },
  { u0: 0.75, u1: 0.8, v0: 0, v1: WALL_TOP },
  { u0: 0.8, u1: 2.3, v0: 0, v1: 0.3 },
  { u0: 0.8, u1: 2.3, v0: 3.3, v1: WALL_TOP },
  { u0: 2.3, u1: 3, v0: 0, v1: WALL_TOP },
]

// Dark accent pier immediately right of the entrance (reference: a charcoal
// panel band + timber-slat strip flanking the recessed entry) — same outer
// footprint the old single ground-band filler used to cover at this u-range,
// just split out to its own material instead of `facadeMaterial`.
//
// Reference-fidelity pass: widened from `-0.95..-0.45` to `-0.95..-0.4`
// (absorbing the old thin filler sliver that used to sit between the pier
// and the passiveFireProtection panel) — the reference's graphite band
// reads as roughly 1/4-1/3 of the whole facade width, far wider than a
// single 0.5-unit pier could ever be within this footprint's fixed hotspot
// layout. Paired with `PFP_CHARCOAL_BANDS` below (which tints the
// passiveFireProtection panel's own surrounding fillers, and the panel
// itself via its PANEL_DEFS `material`, the same charcoal) this pier now
// reads as one continuous dark cladding zone from the entrance to the
// technical panel — u -0.95..0.75, 1.7 of the front wall's 6 units (~28%),
// in the reference's target range — without moving any hotspot's own
// rect/position.
const ACCENT_PIER_RECT = { u0: -0.9, u1: -0.4, v0: 0, v1: 2.15 }

// The plain facade bands immediately above/below the passiveFireProtection
// panel (PANEL_DEFS rect u-0.4..0.75, v0.85..2.5) — rendered in
// `panelCharcoalMaterial` instead of `facadeMaterial` so they read as part
// of the same graphite zone the accent pier starts (see the comment above).
// Same footprint FRONT_FILLERS used to cover at this u-range before this
// pass; only the material changed.
const PFP_CHARCOAL_BANDS = [
  { u0: -0.4, u1: 0.75, v0: 0, v1: 0.85 },
  { u0: -0.4, u1: 0.75, v0: 2.5, v1: WALL_TOP },
]

// Recessed main entrance — a void in FRONT_FILLERS above (u -1.7..-0.9,
// v0..1.05), the frame/glass/canopy filling it are all static (non-hotspot)
// dressing, entirely clear of every PANEL_DEFS rect on this wall. Widened
// from -1.55..-0.95 (0.6) to -1.7..-0.9 (0.8) and the recess deepened (see
// ENTRANCE_RECESS) — the brief's top front-facade complaint ("too narrow/
// weak, needs a deeper recess").
const ENTRANCE_DOOR_RECT = { u0: -1.7, u1: -0.9, v0: 0, v1: 1.05 }
const ENTRANCE_RECESS = 0.2 // how far back from the wall face (z=HALF_D) the door plane sits (was 0.14)
const CANOPY_PROJECTION = 0.48 // how far the canopy slab projects past the wall face (was 0.4)

// --- Reference-fidelity pass: front-facade window wall -------------------
// Two real recessed, dark-aluminum-framed multi-pane windows (2x3 pane grid
// each) filling the void `FRONT_FILLERS` above now carves out of the
// window zone — matches the reference's ground-floor + first-floor office
// windows on the light-concrete section of the front facade. Static
// (non-hotspot) dressing, same as the entrance/canopy below.
const WINDOW_RECESS = 0.09
const WINDOW_FRAME_DEPTH = 0.045
const WINDOW_FRAME_WIDTH = 0.05
const WINDOW_GLASS_INSET = 0.025

// Cheap "stage set" behind a piece of visible glazing — a warm-washed back
// wall, a floor plane, and 1-2 flat furniture-block silhouettes, just deep
// enough behind the glass (`depthZ`) to read as a real room rather than a
// void or a flat texture (brief: "not a detailed interior, just not dead/
// empty"). `width`/`height`/`centerU`/`centerV` describe the opening this
// sits behind in the same wall-local (u,v) terms `rectToWorld` uses;
// `depthZ` is the absolute world Z the back wall plane sits at (always
// nearer to the building's own interior than the glass itself).
function InteriorGlowRoom({ centerU, centerV, width, height, depthZ, glassZ, blocks = [] }) {
  const backWallZ = depthZ
  const floorY = centerV - height / 2 + 0.03
  return (
    <group>
      <mesh position={[centerU, centerV, backWallZ]} material={interiorWallGlowMaterial} dispose={null}>
        <planeGeometry args={[width * 1.15, height * 1.1]} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerU, floorY, (backWallZ + glassZ) / 2]}
        material={interiorSilhouetteMaterial}
        dispose={null}
      >
        <planeGeometry args={[width * 0.95, Math.abs(glassZ - backWallZ)]} />
      </mesh>
      {blocks.map(([bx, bh, bw, bd], i) => (
        <mesh
          key={i}
          position={[centerU + bx, floorY + bh / 2, backWallZ + (glassZ - backWallZ) * 0.4]}
          material={interiorSilhouetteMaterial}
          dispose={null}
        >
          <boxGeometry args={[bw, bh, bd]} />
        </mesh>
      ))}
    </group>
  )
}

function FacadeWindowUnit({ rect, debugColor = null }) {
  const cu = (rect.u0 + rect.u1) / 2
  const cv = (rect.v0 + rect.v1) / 2
  const w = rect.u1 - rect.u0
  const h = rect.v1 - rect.v0
  const glassZ = HALF_D - WINDOW_RECESS
  const recessMidZ = HALF_D - WINDOW_RECESS / 2

  if (debugColor) {
    return (
      <mesh position={[cu, cv, HALF_D + 0.3]}>
        <boxGeometry args={[w, h, 0.3]} />
        <meshBasicMaterial color={debugColor} />
      </mesh>
    )
  }

  return (
    <group>
      {/* Jamb/sill/head returns connecting the outer wall face back to the
          recessed glazing plane — a real reveal, not a floating frame. */}
      <mesh position={[rect.u0, cv, recessMidZ]} material={facadeMaterial} dispose={null} castShadow receiveShadow>
        <boxGeometry args={[0.02, h, WINDOW_RECESS]} />
      </mesh>
      <mesh position={[rect.u1, cv, recessMidZ]} material={facadeMaterial} dispose={null} castShadow receiveShadow>
        <boxGeometry args={[0.02, h, WINDOW_RECESS]} />
      </mesh>
      <mesh position={[cu, rect.v0, recessMidZ]} material={facadeMaterial} dispose={null} castShadow receiveShadow>
        <boxGeometry args={[w, 0.02, WINDOW_RECESS]} />
      </mesh>
      <mesh position={[cu, rect.v1, recessMidZ]} material={facadeMaterial} dispose={null} castShadow receiveShadow>
        <boxGeometry args={[w, 0.02, WINDOW_RECESS]} />
      </mesh>

      {/* Perimeter frame + 2x3 pane grid (1 vertical mullion, 2 horizontal
          transoms) — dark aluminum, matching the reference's frame color. */}
      <mesh position={[cu, rect.v0 + WINDOW_FRAME_WIDTH / 2, glassZ]} material={framingMaterial} dispose={null} castShadow>
        <boxGeometry args={[w, WINDOW_FRAME_WIDTH, WINDOW_FRAME_DEPTH]} />
      </mesh>
      <mesh position={[cu, rect.v1 - WINDOW_FRAME_WIDTH / 2, glassZ]} material={framingMaterial} dispose={null} castShadow>
        <boxGeometry args={[w, WINDOW_FRAME_WIDTH, WINDOW_FRAME_DEPTH]} />
      </mesh>
      <mesh position={[rect.u0 + WINDOW_FRAME_WIDTH / 2, cv, glassZ]} material={framingMaterial} dispose={null} castShadow>
        <boxGeometry args={[WINDOW_FRAME_WIDTH, h, WINDOW_FRAME_DEPTH]} />
      </mesh>
      <mesh position={[rect.u1 - WINDOW_FRAME_WIDTH / 2, cv, glassZ]} material={framingMaterial} dispose={null} castShadow>
        <boxGeometry args={[WINDOW_FRAME_WIDTH, h, WINDOW_FRAME_DEPTH]} />
      </mesh>
      <mesh position={[cu, cv, glassZ]} material={framingMaterial} dispose={null} castShadow>
        <boxGeometry args={[0.035, h, WINDOW_FRAME_DEPTH]} />
      </mesh>
      {[1 / 3, 2 / 3].map((f) => (
        <mesh key={f} position={[cu, rect.v0 + h * f, glassZ]} material={framingMaterial} dispose={null} castShadow>
          <boxGeometry args={[w, 0.03, WINDOW_FRAME_DEPTH]} />
        </mesh>
      ))}

      {/* Cheap interior "stage set" a little further behind the glass than
          the recess itself — a warm back wall + floor + a furniture-block
          silhouette (see `InteriorGlowRoom` above), the brief's "not dead/
          empty" fix. Sits behind the recessed glazing, well within the
          building's own solid interior volume, never poking through a wall. */}
      <InteriorGlowRoom
        centerU={cu}
        centerV={cv}
        width={w}
        height={h}
        glassZ={glassZ}
        depthZ={glassZ - 0.55}
        blocks={[[w * 0.18, 0.28, 0.14, 0.14]]}
      />

      {/* Glass — real thickness, inset within the frame, warm-lit interior
          impression via `glazingMaterial`'s own small emissive floor. */}
      <mesh position={[cu, cv, glassZ]} material={glazingMaterial} dispose={null} receiveShadow>
        <boxGeometry args={[w - WINDOW_GLASS_INSET * 2, h - WINDOW_GLASS_INSET * 2, 0.015]} />
      </mesh>
    </group>
  )
}

function WindowZone() {
  return (
    <group>
      <FacadeWindowUnit rect={{ u0: WINDOW_U0, u1: WINDOW_U1, v0: GROUND_WIN_V0, v1: GROUND_WIN_V1 }} />
      <FacadeWindowUnit rect={{ u0: WINDOW_U0, u1: WINDOW_U1, v0: UPPER_WIN_V0, v1: UPPER_WIN_V1 }} />
    </group>
  )
}

// --- Reference-fidelity pass: backlit "AR Group" wall sign ----------------
// Mounted on the right wall's own solid panel (x=HALF_W face, z centered at
// -0.15 — well inside the untouched `-1.1..0.8` RIGHT_FILLERS solid run,
// with a comfortable margin from both the glazed stairwell bay at z
// 0.82..1.98 and the far end of the solid run), immediately behind the
// glazed stairwell tower — the same real relationship the reference shows
// (sign at the corner just past the stairwell), placed on the side of that
// solid panel that actually has room in this footprint rather than the
// 0.02-unit sliver literally at the geometric corner. Lettering is a canvas
// texture (`signTextTexture`, buildingMaterials.js), not drei's `<Text>` —
// troika-three-text fetches its default glyph font from a remote CDN, which
// screenshot verification caught intermittently failing to resolve in time
// and leaving the sign blank (an unacceptable failure mode for an
// always-visible wall sign); a canvas texture drawn with the browser's own
// system font has zero network dependency and can never fail to render.
//
// Screenshot-verified bug fix: the previous panel (1.05 wide, centered at
// z=0.35) spanned z -0.175..0.875 — 0.055 PAST the solid wall's own
// z=0.8 edge and into the glazing bay's mullion zone, which is why it
// rendered as a dark rectangle overlapping the stairwell glass with no
// legible text (the panel/text geometry was fighting the glazing/mullion
// meshes at that shared boundary). Shrunk and moved well clear of that
// edge; also moved from the wall's raw exterior offset (barely proud) to
// a slightly larger standoff so it doesn't read as fighting the wall face.
const SIGN_CENTER = [HALF_W + THK / 2 + 0.02, 1.85, -0.15]
const SIGN_ROTATION = [0, Math.PI / 2, 0]
// Legibility pass (screenshot-verified: at SIGN_SCALE=1.35 the panel was
// genuinely hard to read even close up, one of the confirmed defects in this
// pass). Brief target was 2-2.5x the then-current 0.837x0.486 visible size
// (~1.7-2.1 x 1.0-1.2), but the sign's local X axis (box arg[0]/plane
// arg[0]) maps to world Z once rotated 90deg about Y, and this wall's own
// solid run is only 1.9 units wide (`-1.1..0.8`, RIGHT_FILLERS' third
// entry) before hitting the acoustic-insulation opening on one side and
// Architecture.jsx's real glazed stairwell bay (z=0.82..1.98) on the other
// — a full 2-2.5x jump (panel width ~1.6-2.0) would leave under 0.15 units
// of margin to the glazing bay, right back into the exact "panel spilling
// into the glazing/mullion zone" bug this file already fixed once (see the
// SIGN_CENTER comment above). Landed on 1.85x (panel 1.147x0.666, text
// 1.073x0.604) — a clearly legible ~2x jump from the old size while keeping
// a real ~0.3-unit margin on both sides of the solid run (centered at world
// z=-0.15: spans z -0.723..0.424, i.e. 0.377 clear of the u=-1.1 edge and
// 0.376 clear of the glazing bay at z=0.82).
const SIGN_SCALE = 1.85
const SIGN_PANEL_W = 0.62 * SIGN_SCALE
const SIGN_PANEL_H = 0.36 * SIGN_SCALE
const SIGN_TEXT_W = 0.58 * SIGN_SCALE
const SIGN_TEXT_H = 0.3263 * SIGN_SCALE

function ARGroupSign() {
  return (
    <group position={SIGN_CENTER} rotation={SIGN_ROTATION}>
      <mesh position={[0, 0, -0.012]} material={signPanelMaterial} dispose={null} castShadow receiveShadow>
        <boxGeometry args={[SIGN_PANEL_W, SIGN_PANEL_H, 0.02]} />
      </mesh>
      <mesh position={[0, 0, 0.001]} dispose={null}>
        <planeGeometry args={[SIGN_TEXT_W, SIGN_TEXT_H]} />
        <meshBasicMaterial map={signTextTexture} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      {/* Small downlight fixtures grazing the sign, matching the reference's
          spot-lit backlit sign — repositioned to flank the enlarged panel
          (same relative placement, scaled by `SIGN_SCALE`); fixture size
          itself is left as-is (a real downlight product isn't sized to the
          sign it lights). */}
      <InstancedBoxes
        positions={[
          [-0.18 * SIGN_SCALE, 0.25 * SIGN_SCALE, 0.04],
          [0.14 * SIGN_SCALE, 0.25 * SIGN_SCALE, 0.04],
        ]}
        size={[0.025, 0.04, 0.025]}
        material={galvanizedMaterial}
      />
    </group>
  )
}

// The middle run used to leave a v0..0.5 notch open for the waterproofInjection
// pop-plug (removed — no corresponding AR Group service; see hotspots3d.js).
// Closed to a full-height run like its neighbors, same outer footprint.
const BACK_FILLERS = [
  { u0: -3, u1: -2.75, v0: 0, v1: WALL_TOP },
  { u0: -2.75, u1: -2.25, v0: 0, v1: WALL_TOP },
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
//             sample — used for passiveFireProtection, the one remaining
//             hotspot that's really a drilled pipe/port through a wall
//             (waterproofInjection used to share this kind but was removed —
//             see hotspots3d.js).
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
    // Reference-fidelity pass: tinted to match the surrounding charcoal
    // cladding band (see FRONT_FILLERS' now-charcoal bands around this same
    // rect) — reads as one continuous dark graphite zone with a flush
    // technical access port in it, the same way the accent pier does,
    // instead of a plain facade-colored patch. Purely a closed-state tint;
    // the panel's own open/slide mechanism is untouched.
    material: panelCharcoalMaterial,
  },
  {
    // Screenshot-verified fix: this panel (1.5 wide x 3.0 tall, plain
    // `facadeMaterial`) was one of the two confirmed "large blank facade
    // panel with no joints/rhythm/depth" defects — a single flat RoundedBox
    // spanning most of the wall's height with nothing on it. `joints: true`
    // adds real precast-style reveal lines (see `PanelJoints` below); purely
    // cosmetic surface detail on the SAME opening/slide mechanism.
    id: 'fireproofingSystems',
    orientation: 'front',
    rect: { u0: 0.8, u1: 2.3, v0: 0.3, v1: 3.3 },
    kind: 'slide',
    axis: [0, 1, 0],
    distance: 3.0,
    joints: true,
  },
  {
    // Second confirmed "large blank panel" defect (2.25 wide x 1.45 tall,
    // exceeding the brief's "no flat surface > ~1/3 of the facade's visible
    // width with nothing on it" threshold on its own). Same `PanelJoints`
    // treatment.
    id: 'mechanicalSupport',
    orientation: 'front',
    rect: { u0: -2.7, u1: -0.45, v0: 2.15, v1: 3.6 },
    kind: 'slide',
    axis: [1, 0, 0],
    distance: 2.25,
    joints: true,
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

function PopPlug({ def, position, onRegister, material = facadeMaterial }) {
  const { size } = closedTransform(def)
  // Capped at a fixed, plausible inspection-port size rather than always
  // scaling with the plug's own footprint — passiveFireProtection's plug
  // is sized to cover two different anchor points (see FRONT_FILLERS
  // above) and is noticeably bigger than the port itself would be. Bug fix
  // (screenshot-verified): this used to cap at 0.32, a 0.64-diameter disc —
  // roughly the size of a manhole cover — reading as a large floating grey
  // circle on the facade with nothing like it in the reference. A real
  // firestop inspection port is on the order of 10-15cm; 0.09 is the right
  // physical scale.
  // Screenshot-verified SECOND fix: shrinking/flattening the bare disc alone
  // (see the comment below) didn't fix the "stray ball near the entrance"
  // read — a small isolated circle on an otherwise blank dark panel reads as
  // a knob/button purely from its SILHOUETTE, independent of how flat or how
  // matte its material is (confirmed: swapping in a flat unlit test material
  // produced the identical round silhouette). The actual fix is contextual:
  // a smaller disc set into a labeled rectangular backing plate with corner
  // fasteners (see the assembly below) reads as "access-cover hardware",
  // not "an unexplained round bump", the same way a real firestop
  // inspection port is never just a bare circle in isolation.
  const capRadius = Math.min(0.05, Math.min(size[0], size[1]) / 2 - 0.09)
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
        material={material}
        dispose={null}
        castShadow
        receiveShadow
      />
      {/* Metal inspection-port ACCESS PANEL on the outer face — the visual
          cue that this plug is a serviceable cored penetration, not
          decoration.
          Screenshot-verified bug fix (two rounds): a bare circular cap here
          — first a 0.09-radius puck, then a flattened/matted 0.09-radius
          disc — read as a stray pale-grey BALL floating on the facade at
          this scene's default camera framing, right beside this hotspot's
          own marker, looking like a second doorknob next to the real
          entrance door (confirmed both times by isolating the mesh and
          re-screenshotting; flattening/de-glossing it alone didn't help,
          since an isolated circle reads as a knob from its SILHOUETTE
          regardless of depth or material). Fixed by giving it real context
          instead: a small rectangular galvanized backing plate with 4
          corner fasteners and a smaller recessed disc set into it — the
          standard look of an actual firestop inspection access panel,
          which is never just a bare circle in isolation. */}
      <group position={[0, 0, capSign * (THK / 2 + 0.006)]}>
        <RoundedBox
          args={[capRadius * 3.4, capRadius * 2.6, 0.014]}
          radius={0.006}
          smoothness={2}
          material={galvanizedMaterial}
          dispose={null}
          castShadow
        />
        <mesh position={[0, 0, capSign * 0.011]} rotation={[Math.PI / 2, 0, 0]} material={popCapMaterial} dispose={null} castShadow>
          <cylinderGeometry args={[capRadius, capRadius, 0.01, 20]} />
        </mesh>
        {/* Recessed slot, sunk just below the disc's own face — the detail
            that reads as "fastened cover", not decoration. */}
        <mesh position={[0, 0, capSign * 0.0165]} material={concreteDarkMaterial} dispose={null}>
          <boxGeometry args={[capRadius * 1.2, 0.012, 0.004]} />
        </mesh>
        {/* Corner fasteners on the backing plate — the detail that reads
            "fixed hardware plate", not "loose circle". */}
        <InstancedCylinders
          positions={[
            [capRadius * 1.3, capRadius * 0.95, capSign * 0.011],
            [-capRadius * 1.3, capRadius * 0.95, capSign * 0.011],
            [capRadius * 1.3, -capRadius * 0.95, capSign * 0.011],
            [-capRadius * 1.3, -capRadius * 0.95, capSign * 0.011],
          ]}
          radius={0.007}
          length={0.014}
          rotation={[Math.PI / 2, 0, 0]}
          material={hardwareMaterial}
        />
      </group>
    </group>
  )
}

// Real precast-panel-style reveal lines (thin, slightly proud dark strips —
// same "proud thin box" trick already used for the back wall's own
// expansion-joint reveal below) — fixes the "large blank facade panel with
// no joints/rhythm/depth" defect on the two big `SlidePlug` panels flagged
// `joints: true` above, without touching their open/slide mechanism (these
// render as ordinary children of the same animated group). `orientation`
// picks which local axes are "width" (the wall's own u-direction) vs
// "height" (always world Y) vs "thickness", matching `rectToWorld`'s own
// per-orientation layout so the lines land on the correct faces for a
// front/back OR left/right panel.
function PanelJoints({ size, orientation }) {
  const isFrontBack = orientation === 'front' || orientation === 'back'
  const outwardZ = orientation === 'back' ? -1 : 1
  const outwardX = orientation === 'left' ? -1 : 1
  const [width, height, thickness] = isFrontBack ? size : [size[2], size[1], size[0]]

  // 2 vertical reveals dividing the panel into thirds (breaks up width),
  // 1-2 horizontal reveals dividing it into roughly equal bands (breaks up
  // height) — skipped on whichever axis is too small to need it.
  const vCount = width > 1.0 ? 2 : 0
  const hCount = height > 1.4 ? Math.floor(height / 1.1) : 0
  const vOffsets = Array.from({ length: vCount }, (_, i) => (width * (i + 1)) / (vCount + 1) - width / 2)
  const hOffsets = Array.from({ length: hCount }, (_, i) => (height * (i + 1)) / (hCount + 1) - height / 2)
  const faceOffset = thickness / 2 + 0.004

  if (isFrontBack) {
    return (
      <>
        {vOffsets.map((x, i) => (
          <mesh key={`v-${i}`} position={[x, 0, faceOffset * outwardZ]} material={concreteDarkMaterial} dispose={null}>
            <boxGeometry args={[0.016, height * 0.95, 0.012]} />
          </mesh>
        ))}
        {hOffsets.map((y, i) => (
          <mesh key={`h-${i}`} position={[0, y, faceOffset * outwardZ]} material={concreteDarkMaterial} dispose={null}>
            <boxGeometry args={[width * 0.95, 0.016, 0.012]} />
          </mesh>
        ))}
      </>
    )
  }

  return (
    <>
      {vOffsets.map((z, i) => (
        <mesh key={`v-${i}`} position={[faceOffset * outwardX, 0, z]} material={concreteDarkMaterial} dispose={null}>
          <boxGeometry args={[0.012, height * 0.95, 0.016]} />
        </mesh>
      ))}
      {hOffsets.map((y, i) => (
        <mesh key={`h-${i}`} position={[faceOffset * outwardX, y, 0]} material={concreteDarkMaterial} dispose={null}>
          <boxGeometry args={[0.012, 0.016, width * 0.95]} />
        </mesh>
      ))}
    </>
  )
}

function SlidePlug({ def, position, onRegister, material = facadeMaterial }) {
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
        material={material}
        dispose={null}
        castShadow
        receiveShadow
      />
      {def.joints && <PanelJoints size={size} orientation={def.orientation} />}
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
        material={facadeMaterial}
        dispose={null}
        castShadow
        receiveShadow
      />
    </group>
  )
}

// --- Camera/massing pass: low wide wing ---
// The building's own footprint (HALF_W/HALF_D) can't change, so width comes
// from a low, single-story massing extension beyond the left wall instead
// (brief: "reads narrow/tall/box-like... get width from added non-
// engineering massing... matching the shell's material language"). Sits
// entirely at x < -3 (outside HALF_W), full building depth (z -2..2, flush
// with the front/back wall planes), capped at 1.37 total height (well under
// every floor line) so it reads as a clearly subordinate single-story
// element, not a second building.
//
// Massing re-pass (round 3): the wing was still reading as "a thin strip"
// against the main box (old WING_X0=-4.3 -> only 1.3 units wide, ~22% of the
// main box's own 6-unit width) — widened to WING_X0=-6.6 (3.6 units wide,
// 60% of the main box's width), giving a total footprint 9.6 units wide
// against the building's ~4.15 max height (ratio ~2.31:1, the "width
// dominates height" target). See `WingBayBreak` below for the added
// facade rhythm this width now needs (a material break + more window bays)
// so it doesn't read as one long uninterrupted block.
//
// Hotspot-sightline re-check (per the brief's "verify against every
// hotspot's cameraPosition->position ray before finalizing placement", redone
// against the new, much wider span): every one of the 9 current hotspots was
// checked, not just the ones previously flagged. Six never approach x<-3 at
// all (passiveFireProtection, fireproofingSystems, acousticInsulation,
// vibrationSolutions, drillingCutting, engineeringTesting — all have both
// endpoints at x>=0). The three whose rays do cross x<-3:
//   - `cableProtection` (cam [-4.5,2.2,3] -> pos [-2,1.05,-1.3]): the ray's
//     x only ever ranges from -4.5 (at the camera) to -2 (at the target), so
//     it's within the wing's span (-6.6..-3) only for the sub-segment
//     t=[0,0.6] (parametrizing cam->pos as t=0..1); of that, only t=[0.233,
//     0.6] also falls inside the wing's z-footprint (-2..2). Across that
//     sub-range y falls from 1.93 to 1.51 — always above the wing's 1.37
//     cap, clearing by >=0.14 at the tightest point (t=0.6, the wing's own
//     near edge at x=-3 — unchanged by extending the FAR edge further left,
//     since the ray never reaches past x=-4.5 anyway).
//   - `mechanicalSupport` (cam [-3.5,4.2,4] -> pos [-1.2,2.4,-1]): the only
//     sub-segment with x<-3 is t=[0,0.217] (x from -3.5 to -3), where z runs
//     4.0->2.91 — always outside the wing's z<=2 footprint, so this ray
//     never actually enters the wing's volume at all, unaffected by the
//     width change.
//   - `jointSealing` (cam [-6,3,1] -> pos [-3,1.8,-1.95]): x ranges -6..-3
//     for the ENTIRE ray (t=0..1), now entirely inside the wider wing's
//     x-span (-6.6..-3, since -6 > -6.6) for its whole length — a real
//     change from the old wing (which only reached -4.3, so previously just
//     the tail end of this ray crossed it). z ranges 1..-1.95, within the
//     wing's -2..2 footprint for the whole ray too. But y ranges 3.0 down to
//     1.8 (monotonic, minimum at the target itself) — still always >= 1.8,
//     clearing the wing's 1.37 cap by >=0.43 at every point along the ray,
//     camera included. No clearance problem despite now overlapping the
//     wing's footprint for the ray's full length instead of just its tail.
// Net result: no hotspot `position`/`cameraPosition` value needed to change
// for the wider wing — every ray clears on height alone, and height didn't
// change. (Re-verified with the same scripted ray-parametrization method as
// this file's prior passes, not eyeballed.)
const WING_X0 = -6.6
const WING_X1 = -HALF_W // -3, flush with the real left wall plane
const WING_Z0 = -HALF_D
const WING_Z1 = HALF_D
const WING_PLINTH_H = 0.22
const WING_BODY_TOP = 1.22
const WING_PARAPET_H = 0.12
const WING_COPING_H = 0.03
// Real highest point (parapet coping top) = 1.22 + 0.12 + 0.03 = 1.37 —
// screenshot-verified bump from an initial 1.30 (the wing read as too low/
// thin to register against the foreground landscaping at the new, much
// closer default camera). Still comfortably under the tightest sightline
// margin found above (cableProtection's ray never dips below y=1.51 while
// crossing the wing's x-span — 0.14 of real clearance at 1.37, re-verified
// with the same scripted projection check, not just this written note).
// Bay break: splits the now much-wider wing into two unequal bays with a
// visible material/plane change at the seam (a shallow-recessed vertical
// reveal, same "proud/recessed thin strip" language as PanelJoints/the back
// wall's own expansion joint elsewhere in this file) so a 3.6-unit-wide
// single-story mass doesn't read as one uninterrupted block. The break sits
// closer to the main building (a shorter "connector" bay in the darker
// accent tone next to the tower) with a longer primary bay (lighter facade
// tone, more windows) further out — echoes the main building's own
// light-facade / dark-accent-pier relationship at wing scale.
const WING_BREAK_X = WING_X0 + (WING_X1 - WING_X0) * 0.62

// A small recessed window unit at wing scale — same frame/glass language as
// the wing's original two windows, factored out so both bays below can place
// several without repeating the JSX.
function WingWindow({ x, y, z, w = 0.42, h = 0.5 }) {
  return (
    <group position={[x, y, z]}>
      <mesh material={framingMaterial} dispose={null} castShadow>
        <boxGeometry args={[w, h, 0.04]} />
      </mesh>
      <mesh position={[0, 0, -0.012]} material={glazingMaterial} dispose={null}>
        <boxGeometry args={[w - 0.09, h - 0.09, 0.015]} />
      </mesh>
    </group>
  )
}

function LowWideWing() {
  const depth = WING_Z1 - WING_Z0
  const centerZ = (WING_Z0 + WING_Z1) / 2
  const bodyH = WING_BODY_TOP - WING_PLINTH_H
  const bodyCenterY = WING_PLINTH_H + bodyH / 2
  const parapetMidY = WING_BODY_TOP + WING_PARAPET_H / 2
  const copingY = WING_BODY_TOP + WING_PARAPET_H + WING_COPING_H / 2
  const winY = WING_PLINTH_H + bodyH * 0.58

  // Two bays either side of WING_BREAK_X (see that const's own comment):
  // a longer, light-facade OUTER bay (further from the main building, more
  // windows — reads as the wing's primary occupied volume) and a shorter,
  // dark-accent CONNECTOR bay next to the main box (echoes the main
  // building's own light-facade/dark-accent-pier relationship at wing
  // scale, and visually ties the wing back to the tower/entrance's charcoal
  // tone instead of butting a plain light box straight into it).
  const outerWidth = WING_BREAK_X - WING_X0
  const outerCenterX = (WING_X0 + WING_BREAK_X) / 2
  const connectorWidth = WING_X1 - WING_BREAK_X
  const connectorCenterX = (WING_BREAK_X + WING_X1) / 2
  const fullWidth = WING_X1 - WING_X0
  const fullCenterX = (WING_X0 + WING_X1) / 2

  // 3 evenly-spaced windows across the wide outer bay (was 1 window per
  // this whole zone before the widening) plus 1 narrower clerestory-style
  // window in the connector bay — proportional articulation for the new
  // width instead of stretching the old 2-window rhythm over 2.75x the
  // span.
  const outerWinPositions = [-0.32, 0, 0.32].map((f) => outerCenterX + outerWidth * f)

  return (
    <group>
      {/* Darker base course grounds the wing against the plaza/yard, same
          material language as the main building's own weathered ground-
          floor tone. Kept as one continuous run under both bays — a real
          plinth course doesn't break at a cladding seam. */}
      <RoundedBox
        args={[fullWidth, WING_PLINTH_H, depth]}
        radius={CHAMFER}
        smoothness={CHAMFER_SMOOTHNESS}
        position={[fullCenterX, WING_PLINTH_H / 2, centerZ]}
        material={concreteDarkMaterial}
        dispose={null}
        castShadow
        receiveShadow
      />
      {/* Outer bay body — light facade tone, the wing's primary volume. */}
      <RoundedBox
        args={[outerWidth, bodyH, depth]}
        radius={CHAMFER}
        smoothness={CHAMFER_SMOOTHNESS}
        position={[outerCenterX, bodyCenterY, centerZ]}
        material={facadeMaterial}
        dispose={null}
        castShadow
        receiveShadow
      />
      {/* Connector bay body — dark accent tone, ties back to the main
          building's own charcoal accent pier/tower massing. */}
      <RoundedBox
        args={[connectorWidth, bodyH, depth]}
        radius={CHAMFER}
        smoothness={CHAMFER_SMOOTHNESS}
        position={[connectorCenterX, bodyCenterY, centerZ]}
        material={panelCharcoalMaterial}
        dispose={null}
        castShadow
        receiveShadow
      />
      {/* Vertical reveal at the bay seam — a real recessed control joint,
          not just a material edge butting flush, so the break reads as an
          intentional architectural seam (same "proud/recessed thin strip"
          language as PanelJoints/the back wall's own expansion joint). */}
      <mesh position={[WING_BREAK_X, bodyCenterY, WING_Z1 - 0.01]} material={concreteDarkMaterial} dispose={null} castShadow>
        <boxGeometry args={[0.03, bodyH * 0.98, 0.02]} />
      </mesh>
      {/* Small parapet + coping on the front run only (the run actually
          visible at the default camera framing) — same tonal-break
          treatment as RooftopShell.jsx's main parapet, scaled down. Kept as
          one continuous cap over both bays, the same way a real parapet
          doesn't step at a cladding seam. */}
      <mesh position={[fullCenterX, parapetMidY, WING_Z1 - 0.06]} material={concreteDarkMaterial} dispose={null} castShadow receiveShadow>
        <boxGeometry args={[fullWidth, WING_PARAPET_H, 0.12]} />
      </mesh>
      <mesh position={[fullCenterX, copingY, WING_Z1 - 0.06]} material={panelCharcoalMaterial} dispose={null} castShadow>
        <boxGeometry args={[fullWidth + 0.02, WING_COPING_H, 0.15]} />
      </mesh>
      {/* Outer bay: 3 evenly-spaced recessed windows — real proportional
          rhythm for a 2.2+-unit-wide light-facade run instead of 1 window
          stretched across it. */}
      {outerWinPositions.map((wx, i) => (
        <WingWindow key={`outer-${i}`} x={wx} y={winY} z={WING_Z1} />
      ))}
      {/* Connector bay: 1 narrower, taller clerestory-style window on the
          dark accent tone — distinct proportion from the outer bay's
          windows so the two bays read as different zones, not just
          different paint. */}
      <WingWindow x={connectorCenterX} y={winY + 0.04} z={WING_Z1} w={0.3} h={0.62} />
      {/* Thin fascia overhang along the front edge, echoing the entrance
          canopy's material/proportion language at wing scale — full width,
          continuous over both bays. */}
      <mesh position={[fullCenterX, WING_BODY_TOP + 0.01, WING_Z1 + 0.09]} material={framingMaterial} dispose={null} castShadow receiveShadow>
        <boxGeometry args={[fullWidth + 0.08, 0.03, 0.3]} />
      </mesh>
    </group>
  )
}

// Static (non-hotspot) massing dressing at the entrance: the dark accent
// pier + timber-slat screen, and the recessed door + slim cantilevered
// canopy. All fixed geometry — nothing here animates or reads `activeGroup`.
function EntranceAssembly() {
  const doorCu = (ENTRANCE_DOOR_RECT.u0 + ENTRANCE_DOOR_RECT.u1) / 2
  const doorWidth = ENTRANCE_DOOR_RECT.u1 - ENTRANCE_DOOR_RECT.u0
  const doorHeight = ENTRANCE_DOOR_RECT.v1 - ENTRANCE_DOOR_RECT.v0
  const doorPlaneZ = HALF_D - ENTRANCE_RECESS
  const recessMidZ = HALF_D - ENTRANCE_RECESS / 2

  // Timber slats overlay the accent pier's outer face — proud of the wall
  // plane by a hair so they read as an applied screen, not a texture swap.
  // Camera/massing pass: brief flagged this as "too small/thin" (6 slats,
  // 0.032 wide) — widened per-slat (0.046, +44%), given real proud depth
  // (0.055, was 0.03) so each slat actually casts a visible shadow line
  // onto the charcoal backing instead of reading as a flat painted stripe,
  // and the zone itself widened slightly (0.35 -> 0.38) within the pier's
  // own (now -0.9..-0.4) footprint. Count trimmed 6 -> 5 to keep a real,
  // legible gap ratio (~39%) at the new wider slat size rather than
  // shrinking the gaps back down.
  // Screenshot-verified second fix: at 5 slats/0.046 wide, the gap (0.03)
  // was narrower than the slat's own proud depth (0.055) — at this pass's
  // ~34deg off-normal default camera azimuth, a gap has to exceed roughly
  // `depth * tan(offAxisAngle)` (~0.037 here) to stay visually open from an
  // oblique angle, or each slat's own side face fully occludes the gap next
  // to it (exactly what the screenshot showed: one solid plank, no visible
  // gaps at all). Fewer, thinner slats with a wider gap (0.06, safely past
  // that threshold) fixes it while keeping the same overall zone width.
  const slatZoneU0 = -0.88
  const slatZoneU1 = -0.5
  const slatCount = 4
  const slatWidth = 0.035
  const slatDepth = 0.055
  const slatPitch = (slatZoneU1 - slatZoneU0) / slatCount
  const slatPositions = Array.from({ length: slatCount }, (_, i) => {
    const x = slatZoneU0 + slatPitch * (i + 0.5)
    return [x, 1.075, HALF_D + THK / 2 + 0.035]
  })

  // Canopy/hanger/sconce anchors deliberately do NOT derive from
  // `doorCu +/- doorWidth/2` any more (screenshot-verified bug: at this
  // pass's widened door, that formula placed the left-side fixtures past
  // WINDOW_U1 and back into the ground-floor window's own glass span — the
  // exact occlusion bug already fixed once before for the old, narrower
  // door). Explicit anchors instead, each independently checked against
  // WINDOW_U1 (-1.78) and the pier's own right edge (-0.4):
  //   - `entranceLeftClearX` sits inside the window zone's own right-hand
  //     jamb (WINDOW_U1..WINDOW_ZONE_U1, a solid 0.08-wide facade strip),
  //     comfortably clear of the actual glass.
  //   - The canopy widens asymmetrically toward the pier side (safe, static
  //     dark cladding) rather than symmetrically around the door center,
  //     so its wider brief-driven footprint never creeps back toward the
  //     window no matter how the door itself is resized later.
  const entranceLeftClearX = WINDOW_U1 + 0.04 // -1.74
  const canopyLeftX = entranceLeftClearX
  const canopyRightX = -0.62
  const canopyWidth = canopyRightX - canopyLeftX
  const canopyCenterX = (canopyLeftX + canopyRightX) / 2
  const canopyY = ENTRANCE_DOOR_RECT.v1 + 0.1
  const canopyCenterZ = HALF_D + CANOPY_PROJECTION / 2
  const hangerPositions = [
    [canopyLeftX + 0.06, canopyY - 0.06, HALF_D + CANOPY_PROJECTION - 0.12],
    [canopyRightX - 0.06, canopyY - 0.06, HALF_D + CANOPY_PROJECTION - 0.12],
  ]

  return (
    <group>
      {/* Dark accent pier (charcoal panel) replacing plain facade at this
          bay — same footprint/chamfer treatment as every other WallFiller. */}
      <WallFiller orientation="front" rect={ACCENT_PIER_RECT} material={panelCharcoalMaterial} />
      <InstancedBoxes positions={slatPositions} size={[slatWidth, 1.75, slatDepth]} material={timberMaterial} />

      {/* Recessed entrance: two jamb returns + a soffit connect the main
          wall face back to the recessed glazed door plane, so the recess
          reads as a real reveal instead of the door floating in a hole. */}
      <mesh
        position={[ENTRANCE_DOOR_RECT.u0, doorHeight / 2, recessMidZ]}
        material={facadeMaterial}
        dispose={null}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.02, doorHeight, ENTRANCE_RECESS]} />
      </mesh>
      <mesh
        position={[ENTRANCE_DOOR_RECT.u1, doorHeight / 2, recessMidZ]}
        material={facadeMaterial}
        dispose={null}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.02, doorHeight, ENTRANCE_RECESS]} />
      </mesh>
      <mesh position={[doorCu, doorHeight + 0.01, recessMidZ]} material={facadeMaterial} dispose={null} castShadow receiveShadow>
        <boxGeometry args={[doorWidth, 0.02, ENTRANCE_RECESS]} />
      </mesh>

      {/* Cheap lobby "stage set" behind the entrance glass — same
          InteriorGlowRoom treatment as the facade windows, just larger and
          with two furniture blocks (a reception-desk-scale block + a
          slimmer plant-scale silhouette) since the entrance is the widest
          glazed opening on the front facade. */}
      <InteriorGlowRoom
        centerU={doorCu}
        centerV={doorHeight / 2}
        width={doorWidth}
        height={doorHeight}
        glassZ={doorPlaneZ}
        depthZ={doorPlaneZ - 0.7}
        blocks={[
          [-doorWidth * 0.2, 0.34, 0.32, 0.18],
          [doorWidth * 0.28, 0.42, 0.1, 0.1],
        ]}
      />

      {/* Glazed double door + frame, set back at the recess plane. Uses the
          dedicated `entranceGlassMaterial` (dark aluminum-framed glass),
          NOT the shared `glazingMaterial` the windows use — see that
          material's own comment for why (screenshot-verified bug fix: the
          door used to read as a solid orange/wood panel). */}
      <mesh position={[doorCu, doorHeight / 2, doorPlaneZ]} material={entranceGlassMaterial} dispose={null} receiveShadow>
        <boxGeometry args={[doorWidth - 0.06, doorHeight - 0.04, 0.02]} />
      </mesh>
      {/* Horizontal transom splitting the door into upper/lower lites — more
          dark-frame coverage relative to glass, matching the reference's
          frame-dominant read. */}
      <mesh position={[doorCu, doorHeight * 0.62, doorPlaneZ]} material={framingMaterial} dispose={null} castShadow>
        <boxGeometry args={[doorWidth - 0.06, 0.03, 0.045]} />
      </mesh>
      <mesh position={[doorCu, doorHeight / 2, doorPlaneZ]} material={framingMaterial} dispose={null} castShadow>
        <boxGeometry args={[0.03, doorHeight, 0.045]} />
      </mesh>
      <mesh position={[doorCu - doorWidth / 2 + 0.02, doorHeight / 2, doorPlaneZ]} material={framingMaterial} dispose={null} castShadow>
        <boxGeometry args={[0.03, doorHeight, 0.045]} />
      </mesh>
      <mesh position={[doorCu + doorWidth / 2 - 0.02, doorHeight / 2, doorPlaneZ]} material={framingMaterial} dispose={null} castShadow>
        <boxGeometry args={[0.03, doorHeight, 0.045]} />
      </mesh>
      <InstancedBoxes
        positions={[
          [doorCu - 0.06, doorHeight / 2, doorPlaneZ + 0.03],
          [doorCu + 0.06, doorHeight / 2, doorPlaneZ + 0.03],
        ]}
        size={[0.02, 0.16, 0.02]}
        material={hardwareMaterial}
      />

      {/* Slim cantilevered entrance canopy + hanger rods back to the wall
          above the door — no support posts (a real slim canopy is hung/
          cantilevered, not columned), matching the reference's entrance.
          Screenshot-verified bug fix: was `galvanizedMaterial` (light,
          cool-metallic), which under this scene's warm key light picked up
          a strong warm specular and read as a light tan/beige wedge rather
          than a flat black slab — the reference is explicitly a thin BLACK
          canopy, so this now reuses `framingMaterial` (the same near-black
          finish as the window/door frames), which stays dark under the same
          lighting instead of blowing out warm. */}
      <mesh position={[canopyCenterX, canopyY, canopyCenterZ]} material={framingMaterial} dispose={null} castShadow receiveShadow>
        <boxGeometry args={[canopyWidth, 0.04, CANOPY_PROJECTION]} />
      </mesh>
      {/* Thin underside fascia strip, slightly darker/flatter than the top
          face, so the slab reads as having real (if slim) depth rather than
          a paper-thin plane when viewed close to edge-on. */}
      <mesh position={[canopyCenterX, canopyY - 0.021, canopyCenterZ]} material={framingMaterial} dispose={null} receiveShadow>
        <boxGeometry args={[canopyWidth - 0.03, 0.002, CANOPY_PROJECTION - 0.03]} />
      </mesh>
      <InstancedBoxes
        positions={hangerPositions}
        size={[0.02, 0.12, 0.02]}
        material={hardwareMaterial}
      />

      {/* Recessed canopy downlights (reference: "recessed downlights,
          visible warm light wash on the wall below") — small flush emissive
          fixtures on the canopy underside, no extra shadow-casting light per
          fixture (see Hero3DScene.jsx's single shared entrance point light
          for the actual illumination; these are the visible fixture only). */}
      <InstancedBoxes
        positions={[
          [doorCu - 0.32, canopyY - 0.025, canopyCenterZ],
          [doorCu + 0.32, canopyY - 0.025, canopyCenterZ],
        ]}
        size={[0.05, 0.012, 0.05]}
        material={warmGlowMaterial}
      />

      {/* Wall sconces flanking the door at handle height (reference detail)
          — mounted proud of the wall's OUTER face (HALF_D + THK/2, same
          convention as the timber slats above; HALF_D alone is the wall's
          centerline and would embed the fixture inside the solid wall) just
          outside the recess jambs. Left sconce anchored to
          `entranceLeftClearX` (the window zone's own solid right-hand jamb,
          see that const's comment above), not a doorWidth-derived offset —
          the same occlusion-bug class already fixed once for the canopy. */}
      <InstancedBoxes
        positions={[
          [entranceLeftClearX, 1.0, HALF_D + THK / 2 + 0.02],
          [-0.46, 1.0, HALF_D + THK / 2 + 0.02],
        ]}
        size={[0.05, 0.09, 0.035]}
        material={warmGlowMaterial}
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
        <WallFiller key={`front-${i}`} orientation="front" rect={rect} material={facadeMaterial} />
      ))}
      {BACK_FILLERS.map((rect, i) => (
        <WallFiller key={`back-${i}`} orientation="back" rect={rect} material={facadeMaterial} />
      ))}
      {LEFT_FILLERS.map((rect, i) => (
        <WallFiller key={`left-${i}`} orientation="left" rect={rect} material={facadeMaterial} />
      ))}
      {RIGHT_FILLERS.map((rect, i) => (
        <WallFiller key={`right-${i}`} orientation="right" rect={rect} material={facadeMaterial} />
      ))}

      <WindowZone />
      <ARGroupSign />
      {PFP_CHARCOAL_BANDS.map((rect, i) => (
        <WallFiller key={`pfp-charcoal-${i}`} orientation="front" rect={rect} material={panelCharcoalMaterial} />
      ))}

      {/* Vertical expansion-joint reveal on the back wall (relocated
          verbatim from Shell.jsx) — clear of the waterproofInjection
          opening (u -2.75..-2.25). */}
      <mesh position={[0.9, 1.8, -1.9]} material={concreteDarkMaterial} dispose={null}>
        <boxGeometry args={[0.025, 3.6, 0.02]} />
      </mesh>

      <EntranceAssembly />
      <LowWideWing />

      {PANEL_DEFS.map((def) => {
        const { position } = closedTransform(def)
        if (def.kind === 'pop')
          return (
            <PopPlug key={def.id} def={def} position={position} onRegister={registerPanel} material={def.material} />
          )
        if (def.kind === 'hinge')
          return <HingePlug key={def.id} def={def} position={position} onRegister={registerPanel} />
        return (
          <SlidePlug key={def.id} def={def} position={position} onRegister={registerPanel} material={def.material} />
        )
      })}
    </group>
  )
}
