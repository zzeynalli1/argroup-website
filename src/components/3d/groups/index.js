import PassiveFireProtection from './PassiveFireProtection'
import FireproofingSystems from './FireproofingSystems'
import CableProtection from './CableProtection'
import MechanicalSupport from './MechanicalSupport'
import JointSealing from './JointSealing'
import AcousticInsulation from './AcousticInsulation'
import VibrationSolutions from './VibrationSolutions'
import WaterproofInjection from './WaterproofInjection'
import DrillingCutting from './DrillingCutting'
import EngineeringTesting from './EngineeringTesting'
import ExteriorShell from './ExteriorShell'
import Structure from './Structure'
import InteriorArchitecture from './InteriorArchitecture'
import Architecture from './Architecture'
import RooftopShell from './RooftopShell'
import FutureZone from './FutureZone'

/**
 * The single registry of every group in the building scene. `Building.jsx`
 * maps over this and renders each entry — adding a group later means adding
 * one file + one entry here, not touching existing groups.
 *
 * `id` doubles as the group key hotspots reference via `hotspot.group` (see
 * data/hotspots3d.js). For the 10 current hotspot-driven systems, `id`
 * equals that hotspot's own id 1:1, preserving exactly which meshes
 * highlight/dim together today (see the Phase 0 note in each group file for
 * why they aren't split further). `structure`/`interiorArchitecture` replace
 * the old flat `shell` group (redistributed per the camera-pivot/building-
 * closure rework — see Structure.jsx/InteriorArchitecture.jsx). `exteriorShell`
 * is the closed building envelope (front/back/left/right walls + per-hotspot
 * reveal panels); `architecture`/`rooftopShell` are unchanged throughout.
 *
 * Future groups render nothing yet (`FutureZone` is a no-op placeholder) —
 * they exist here so a future hotspot/layer can point at a real registry
 * entry without a code change beyond adding that hotspot and, when someone
 * actually models that discipline, swapping `FutureZone` for a real
 * component in this one line.
 */
export const SYSTEM_GROUPS = [
  // --- Current, fully-modeled, hotspot-driven systems ---
  { id: 'passiveFireProtection', Component: PassiveFireProtection, category: 'current', defaultVisible: true },
  { id: 'fireproofingSystems', Component: FireproofingSystems, category: 'current', defaultVisible: true },
  { id: 'cableProtection', Component: CableProtection, category: 'current', defaultVisible: true },
  { id: 'mechanicalSupport', Component: MechanicalSupport, category: 'current', defaultVisible: true },
  { id: 'jointSealing', Component: JointSealing, category: 'current', defaultVisible: true },
  { id: 'acousticInsulation', Component: AcousticInsulation, category: 'current', defaultVisible: true },
  { id: 'vibrationSolutions', Component: VibrationSolutions, category: 'current', defaultVisible: true },
  { id: 'waterproofInjection', Component: WaterproofInjection, category: 'current', defaultVisible: true },
  { id: 'drillingCutting', Component: DrillingCutting, category: 'current', defaultVisible: true },
  { id: 'engineeringTesting', Component: EngineeringTesting, category: 'current', defaultVisible: true },

  // --- Current, static envelope/structure geometry. ---
  { id: 'exteriorShell', Component: ExteriorShell, category: 'current', defaultVisible: true },
  { id: 'structure', Component: Structure, category: 'current', defaultVisible: true },
  { id: 'interiorArchitecture', Component: InteriorArchitecture, category: 'current', defaultVisible: true },
  { id: 'architecture', Component: Architecture, category: 'current', defaultVisible: true },
  { id: 'rooftopShell', Component: RooftopShell, category: 'current', defaultVisible: true },

  // --- Future, reserved-but-not-modeled groups (see the reserved-zone
  //     table in .claude/agents/3d-modeling-agent.md). Render nothing until
  //     a future phase actually models them. ---
  { id: 'interior', Component: FutureZone, category: 'future', defaultVisible: false },
  { id: 'exterior', Component: FutureZone, category: 'future', defaultVisible: false },
  { id: 'landscape', Component: FutureZone, category: 'future', defaultVisible: false },
  { id: 'facade', Component: FutureZone, category: 'future', defaultVisible: false },
  { id: 'electrical', Component: FutureZone, category: 'future', defaultVisible: false },
  { id: 'fireProtectionWet', Component: FutureZone, category: 'future', defaultVisible: false },
  { id: 'lighting', Component: FutureZone, category: 'future', defaultVisible: false },
]
