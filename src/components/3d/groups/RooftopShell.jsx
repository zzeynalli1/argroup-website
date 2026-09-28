import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import { galvanizedMaterial, concreteDarkMaterial, panelCharcoalMaterial } from '../buildingMaterials'
import { TechnicalRailing } from '../buildingParts'

const HALF_W = 3
const HALF_D = 2

// Roof slab (see Shell.jsx: last FLOOR_Y entry, 0.16 thick) top surface —
// 3.6 + half the slab thickness. Posts stand ON this, not floating above it.
const ROOF_SURFACE_Y = 3.68

// Perimeter parapet upstand + coping cap — reads as a real roof edge instead
// of the slab just stopping in mid-air. Flush with the wall plane (no x/z
// growth of the building's own footprint), only adds height: top of the
// coping sits at 4.00, comfortably under the raised stairwell-tower cap
// (Architecture.jsx, 4.15 — see hotspots3d.js's bounding-box note) so the
// tower still reads as rising above the main roofline like the reference.
// Screenshot-verified fix: 0.28 tall in the SAME `facadeMaterial` as the
// wall below it, with a coping cap on only one run, read as "no visible
// parapet at all" — there was no contrast between the upstand and the wall
// face beneath it from most angles. Raised slightly and given a darker,
// thicker coping cap (still modest, not a bulky cornice) on BOTH runs
// visible from the default 3/4 camera (front + right) so the roofline
// actually reads as a finished edge instead of blending into the wall.
// Screenshot-verified SECOND fix: even with a coping cap, the parapet at
// this camera distance still read as barely-there — a thin cap alone
// wasn't enough contrast. Raised further and the upstand itself switched to
// `concreteDarkMaterial` (a visibly different tone from the `facadeMaterial`
// wall directly below it) so there's a real tonal break at the roofline
// even before the coping cap's own contrast, not just relying on the cap.
const PARAPET_HEIGHT = 0.42
const PARAPET_THK = 0.14
const PARAPET_TOP = ROOF_SURFACE_Y + PARAPET_HEIGHT
const COPING_THK = 0.045

function Parapet() {
  const midY = ROOF_SURFACE_Y + PARAPET_HEIGHT / 2
  const runs = [
    { position: [0, midY, HALF_D - PARAPET_THK / 2], size: [HALF_W * 2, PARAPET_HEIGHT, PARAPET_THK] },
    { position: [0, midY, -HALF_D + PARAPET_THK / 2], size: [HALF_W * 2, PARAPET_HEIGHT, PARAPET_THK] },
    { position: [-HALF_W + PARAPET_THK / 2, midY, 0], size: [PARAPET_THK, PARAPET_HEIGHT, HALF_D * 2] },
    { position: [HALF_W - PARAPET_THK / 2, midY, 0], size: [PARAPET_THK, PARAPET_HEIGHT, HALF_D * 2] },
  ]
  return (
    <group>
      {runs.map((run, i) => (
        <RoundedBox
          key={i}
          args={run.size}
          radius={0.015}
          smoothness={2}
          position={run.position}
          material={concreteDarkMaterial}
          dispose={null}
          castShadow
          receiveShadow
        />
      ))}
      {/* Metal coping cap on the front + right runs — both visible at the
          default camera framing (the back/left runs are rarely in frame
          together, so kept to plain facade for triangle budget). Dark
          panel-charcoal (not galvanized) for real contrast against the
          light facade below it. */}
      <mesh position={[0, PARAPET_TOP + 0.012, HALF_D - PARAPET_THK / 2]} material={panelCharcoalMaterial} dispose={null} castShadow>
        <boxGeometry args={[HALF_W * 2, COPING_THK, PARAPET_THK + 0.03]} />
      </mesh>
      <mesh position={[HALF_W - PARAPET_THK / 2, PARAPET_TOP + 0.012, 0]} material={panelCharcoalMaterial} dispose={null} castShadow>
        <boxGeometry args={[PARAPET_THK + 0.03, COPING_THK, HALF_D * 2]} />
      </mesh>
    </group>
  )
}

// Generic, unbranded rooftop service-equipment enclosure — background
// architectural context only (not a hotspot, not attributed to any AR Group
// service; see the business rule against modeling HVAC as an AR Group
// offering). Deliberately a plain cabinet with shallow reveal lines, no fan/
// coil/condenser styling. Placed clear of every reserved future-zone
// footprint (see the reserved-zone table) and clear of the
// `vibrationSolutions` hotspot's own rooftop unit at x 0.9..2.1, z -0.1..1.1.
const EQUIP_CENTER = [-2.35, 1.55]
const EQUIP_SIZE = [0.55, 0.4, 0.5]

function RooftopEquipmentEnclosure() {
  const [ex, ez] = EQUIP_CENTER
  const [ew, eh, ed] = EQUIP_SIZE
  const platformTop = ROOF_SURFACE_Y
  const boxCenterY = platformTop + eh / 2
  const reveal = Array.from({ length: 3 }, (_, i) => boxCenterY - eh / 2 + eh * ((i + 1) / 4))

  const postPositions = [
    [ex - ew / 2 - 0.1, ez - ed / 2 - 0.1],
    [ex + ew / 2 + 0.1, ez - ed / 2 - 0.1],
    [ex - ew / 2 - 0.1, ez + ed / 2 + 0.1],
    [ex + ew / 2 + 0.1, ez + ed / 2 + 0.1],
  ]
  const runs = [
    { axis: 'x', center: [ex, ez - ed / 2 - 0.1], length: ew + 0.2 },
    { axis: 'x', center: [ex, ez + ed / 2 + 0.1], length: ew + 0.2 },
  ]

  return (
    <group>
      <RoundedBox
        args={EQUIP_SIZE}
        radius={0.02}
        smoothness={2}
        position={[ex, boxCenterY, ez]}
        material={panelCharcoalMaterial}
        dispose={null}
        castShadow
        receiveShadow
      />
      {/* Shallow horizontal reveal lines only (cabinet panel joints) — never
          fins/louvers/condenser grille styling. */}
      {reveal.map((y, i) => (
        <mesh key={i} position={[ex, y, ez + ed / 2 + 0.001]} material={galvanizedMaterial} dispose={null}>
          <boxGeometry args={[ew - 0.04, 0.006, 0.004]} />
        </mesh>
      ))}
      <TechnicalRailing
        postPositions={postPositions}
        baseY={platformTop}
        postHeight={0.4}
        postRadius={0.014}
        runs={runs}
        material={galvanizedMaterial}
      />
    </group>
  )
}

/**
 * Static rooftop context — generic access/safety infrastructure and massing,
 * not tied to any hotspot.
 *
 * Phase 1: rebuilt the existing guard rail on the `TechnicalRailing`
 * primitive — posts now have a real base-flange + anchor-bolt connection to
 * the roof deck, plus a kick plate and mid-rail alongside the top rail.
 *
 * Massing pass: added a perimeter parapet (`Parapet`) so the roofline reads
 * as a finished edge rather than a slab that just stops, and a small
 * generic, unbranded rooftop equipment enclosure (`RooftopEquipmentEnclosure`)
 * on its own railed platform for background architectural realism — see
 * that component's own comment for why it's deliberately NOT HVAC-styled and
 * not a hotspot. Both are additive around the existing rail, which is left
 * exactly where it was (still the `vibrationSolutions` hotspot's own
 * rooftop-unit platform).
 */
export default function RooftopShell({ visible = true }) {
  const postPositions = useMemo(
    () => [
      [0.9, -0.1],
      [2.1, -0.1],
      [0.9, 1.1],
      [2.1, 1.1],
      [1.5, -0.1],
      [1.5, 1.1],
    ],
    []
  )

  const runs = useMemo(
    () => [
      { axis: 'x', center: [1.5, -0.1], length: 1.3 },
      { axis: 'x', center: [1.5, 1.1], length: 1.3 },
    ],
    []
  )

  return (
    <group visible={visible}>
      <Parapet />
      <RooftopEquipmentEnclosure />
      <TechnicalRailing
        postPositions={postPositions}
        baseY={ROOF_SURFACE_Y}
        postHeight={0.42}
        postRadius={0.015}
        runs={runs}
        material={galvanizedMaterial}
      />
    </group>
  )
}
