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
        // Real supplied process image (public/images/services/). `markers`
        // are hand-measured percent x-positions of this specific image's own
        // baked-in 01-04 circles (2160x728 source) — ProcessStageShowcase
        // never draws its own numbered badge over a `src` image, so these
        // only drive hover/tap zone boundaries, not visible markup.
        processImage: {
          src: '/images/services/passive-fire/firestop.webp',
          aspect: 'aspect-[2160/728]',
          markers: [{ x: '13%' }, { x: '37.5%' }, { x: '61%' }, { x: '86%' }],
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
        processImage: {
          src: '/images/services/passive-fire/fireproofing.webp',
          aspect: 'aspect-[2159/728]',
          markers: [{ x: '13.5%' }, { x: '38%' }, { x: '62%' }, { x: '86%' }],
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
        processImage: {
          src: '/images/services/passive-fire/cable-fire-protection.webp',
          aspect: 'aspect-[1938/812]',
          markers: [{ x: '13%' }, { x: '37%' }, { x: '61%' }, { x: '86%' }],
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
        processImage: {
          src: '/images/services/testing/pull-out-test.webp',
          aspect: 'aspect-[1942/809]',
          markers: [{ x: '16%' }, { x: '49%' }, { x: '83%' }],
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
        processImage: {
          src: '/images/services/testing/vibration-test.webp',
          aspect: 'aspect-[2056/765]',
          markers: [{ x: '11%' }, { x: '36%' }, { x: '62%' }, { x: '87%' }],
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
        processImage: {
          src: '/images/services/construction/drilling-cutting.webp',
          aspect: 'aspect-[2170/725]',
          markers: [{ x: '17%' }, { x: '51%' }, { x: '84%' }],
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
        processImage: {
          src: '/images/services/construction/acoustic-insulation.webp',
          aspect: 'aspect-[2170/725]',
          markers: [{ x: '12.5%' }, { x: '37.5%' }, { x: '62.5%' }, { x: '87.5%' }],
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
        processImage: {
          src: '/images/services/construction/load-analysis.webp',
          aspect: 'aspect-[2170/725]',
          markers: [{ x: '12.5%' }, { x: '37.5%' }, { x: '62.5%' }, { x: '87.5%' }],
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
        processImage: {
          src: '/images/services/construction/support-design.webp',
          aspect: 'aspect-[2170/725]',
          markers: [{ x: '12.5%' }, { x: '37%' }, { x: '61.5%' }, { x: '87%' }],
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
        processImage: {
          src: '/images/services/construction/vibration-solutions.webp',
          aspect: 'aspect-[1942/809]',
          markers: [{ x: '16%' }, { x: '47%' }, { x: '82%' }],
        },
      },
      {
        key: 'seismic',
        slug: 'seismic-solutions',
        icon: 'Activity',
        imageSlots: {
          hero: 'Seismic engineering structural assessment',
          overview: 'Seismic reinforcement / structural detail',
          workProcess: 'Work process — Seismic Engineering',
        },
        // Real supplied process image (public/images/services/construction/),
        // same 2170x725 frame size as concreteCutting/acousticInsulation/
        // loadAnalysis/supportDesign above. `markers` are hand-measured
        // (pixel-centroid, not eyeballed) x-positions of this image's own
        // baked-in 01-04 dot markers — see the other entries' own comment on
        // why these only drive hover/tap zone boundaries, never visible markup.
        processImage: {
          src: '/images/services/construction/seismic-system.webp',
          aspect: 'aspect-[2170/725]',
          markers: [{ x: '16%' }, { x: '40%' }, { x: '55.5%' }, { x: '95.5%' }],
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
    number: '04',
    icon: 'PenTool',
    subServices: [],
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
