/**
 * Fire Protection Systems' 3 real sub-services, grounded in
 * docs/argroup-knowledge-base.md (Fire Stop Systems, Fireproofing Systems,
 * Protecting Cables). `imagePosition` is an `object-position` value picking
 * a focal point on public/images/materials/wall-penetrations.jpg (see
 * src/data/materials.js for the same photo's hotspot zones) so each step
 * gets a thematically-matching crop without needing a separate image asset.
 */
export const fireProcessSteps = [
  { key: 'fireStopSystems', imagePosition: '80% 50%' },
  { key: 'fireproofingSystems', imagePosition: '65% 50%' },
  { key: 'cableProtection', imagePosition: '50% 50%' },
]

/**
 * The remaining 5 service categories from the KB "Services" section,
 * rendered as plain cards (not a process) since only Fire Protection has a
 * documented step-by-step flow.
 */
export const otherServices = [
  { key: 'testing', icon: 'Ruler' },
  { key: 'construction', icon: 'HardHat' },
  { key: 'industrial', icon: 'Factory' },
  { key: 'marine', icon: 'Anchor' },
  { key: 'designEngineering', icon: 'PenTool' },
]
