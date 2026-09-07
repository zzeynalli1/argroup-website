/**
 * Service taxonomy for the Services system: 6 primary categories, each with
 * zero or more routable sub-services. Categories 01-03 have verified detail
 * content (docs/argroup-knowledge-base.md "Services" section) and get full
 * /services/:slug detail pages. Categories 04-06 (Industrial, Marine, Design
 * Engineering) have no body copy in the knowledge base — they render as
 * short shell blocks (title + verified-wording intro + CTA) with no
 * sub-services and no detail routes. Category 06 instead cross-links to the
 * three engineering-flavored sub-services already filed under category 03
 * (Support Design, Load Analysis, Vibration Solutions) rather than
 * duplicating them under its own routes.
 *
 * Display copy for every category/sub-service/detail-page lives in
 * locales/<locale>/services.json — this file is structural data only,
 * mirroring the products.js / servicesDetail.js split already used
 * elsewhere in the project.
 */
export const serviceCategories = [
  {
    id: 1,
    key: 'passiveFireProtection',
    number: '01',
    icon: 'ShieldCheck',
    subServices: [
      {
        key: 'fireStopSystems',
        slug: 'firestop-systems',
        icon: 'ShieldCheck',
        imageSlots: {
          hero: 'Firestop penetration system in concrete wall',
          overview: 'Fire compartmentalization detail',
          workProcess: 'Work process — Fire Stop Systems',
        },
      },
      {
        key: 'fireproofingSystems',
        slug: 'fireproofing-systems',
        icon: 'Flame',
        imageSlots: {
          hero: 'Protected structural steel surface',
          overview: 'Fireproofing coating / partition system detail',
          workProcess: 'Work process — Fireproofing Systems',
        },
      },
      {
        key: 'cableProtection',
        slug: 'cable-fire-protection',
        icon: 'Cable',
        imageSlots: {
          hero: 'Cable-tray fire protection system',
          overview: 'Cable penetration / sealing detail',
          workProcess: 'Work process — Cable Fire Protection',
        },
      },
    ],
  },
  {
    id: 2,
    key: 'testing',
    number: '02',
    icon: 'Ruler',
    subServices: [
      {
        key: 'pullOutTest',
        slug: 'pull-out-test',
        icon: 'Ruler',
        imageSlots: {
          hero: 'Pull-out testing equipment on concrete',
          overview: 'Pull-out test rig / geometry detail',
          workProcess: 'Work process — Pull Out Test',
        },
      },
      {
        key: 'vibrationTest',
        slug: 'vibration-test',
        icon: 'Activity',
        imageSlots: {
          hero: 'Vibration test equipment and waveform readout',
          overview: 'Mechanical vibration test environment',
          workProcess: 'Work process — Vibration Test',
        },
      },
    ],
  },
  {
    id: 3,
    key: 'construction',
    number: '03',
    icon: 'HardHat',
    subServices: [
      {
        key: 'concreteCutting',
        slug: 'concrete-cutting',
        icon: 'Drill',
        imageSlots: {
          hero: 'Professional concrete drilling / cutting',
          overview: 'Diamond core drilling / cutting equipment detail',
          workProcess: 'Work process — Drilling and Concrete Cutting',
        },
      },
      {
        key: 'acousticInsulation',
        slug: 'acoustic-insulation',
        icon: 'Volume2',
        imageSlots: {
          hero: 'Architectural acoustic material environment',
          overview: 'Acoustic insulation barrier detail',
          workProcess: 'Work process — Sound and Acoustic Insulation',
        },
      },
      {
        key: 'loadAnalysis',
        slug: 'load-analysis',
        icon: 'Scale',
        imageSlots: {
          hero: 'Engineering structural analysis / model',
          overview: 'Support framework load analysis detail',
          workProcess: 'Work process — Dynamic and Static Load Analysis',
        },
      },
      {
        key: 'supportDesign',
        slug: 'support-design',
        icon: 'Wrench',
        imageSlots: {
          hero: 'MEP support / engineering model',
          overview: 'Support structure technical drawing detail',
          workProcess: 'Work process — Support Design',
        },
      },
      {
        key: 'vibrationSolutions',
        slug: 'vibration-solutions',
        icon: 'Waves',
        imageSlots: {
          hero: 'Mechanical equipment / vibration isolation system',
          overview: 'Vibration-prone platform measurement detail',
          workProcess: 'Work process — Vibration Analysis and Solutions',
        },
      },
      {
        key: 'waterproofInjection',
        slug: 'waterproof-injection',
        icon: 'Droplets',
        imageSlots: {
          hero: 'Waterproof injection at wall-floor joint',
          overview: 'Injection point / joint sealing detail',
          workProcess: 'Work process — Waterproof Injection',
        },
      },
    ],
  },
  {
    id: 4,
    key: 'industrial',
    number: '04',
    icon: 'Factory',
    subServices: [],
  },
  {
    id: 5,
    key: 'marine',
    number: '05',
    icon: 'Anchor',
    subServices: [],
  },
  {
    id: 6,
    key: 'designEngineering',
    number: '06',
    icon: 'PenTool',
    subServices: [],
    relatedKeys: ['supportDesign', 'loadAnalysis', 'vibrationSolutions'],
  },
]

/**
 * Flat list of every routable sub-service (11 total), each tagged with its
 * parent category. Used by ServiceDetailPage (slug lookup), ServicesGrid
 * (related-service cross-links), and ContactForm (service picker).
 */
export const services = serviceCategories.flatMap((category) =>
  category.subServices.map((sub) => ({ ...sub, categoryKey: category.key }))
)

export function getServiceBySlug(slug) {
  return services.find((service) => service.slug === slug)
}

export function getCategoryByKey(key) {
  return serviceCategories.find((category) => category.key === key)
}
