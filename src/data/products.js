// The 10 real AR Group product categories (source of truth:
// https://argroup.az/product, cross-checked against
// docs/argroup-knowledge-base.md). name/description come from
// src/locales/<locale>/products.json via products.items.<key> so they stay
// translatable. `brands` are literal brand/product-line names; where the
// source has no distinct brand names for a category, real documented
// product *types* are used instead (never invented brand names) — an empty
// array means the knowledge base captured none at all (Couplings). `icon`
// is a lucide icon name.
//
// The Products landing page only surfaces 3 of these 10 as its category
// showcase (Firestop/passiveFireProtection, Vibration/vibrationInsulation,
// Acoustic/soundAcoustic — see components/sections/ProductCategories.jsx),
// plus one lightweight text-only entry for additionalProducts (no real
// photography exists for it, so it's deliberately not a photo panel — see
// that file's own comment). THIS file is the real taxonomy and must always
// list all 10; the landing-page's category selection must never be mistaken
// for a change to the underlying data — the other categories remain real
// categories for future category-detail pages.
export const products = [
  { id: 1, key: 'vibrationInsulation', icon: 'Waves', brands: ['Bivratech', 'Vibratech', 'Vibrabsorber', 'Vibrafoam Purasys'] },
  { id: 2, key: 'soundAcoustic', icon: 'Volume2', brands: ['Sylomer', 'Decidamp SP150', 'Sorbermel', 'Sorberbarrier', 'Damtec'] },
  { id: 3, key: 'supportFitting', icon: 'Wrench', brands: ['Fixings', 'Modular Support Systems', 'Anchor & Fixing Systems', 'Seismic Bracing'] },
  { id: 4, key: 'couplings', icon: 'Link2', brands: [] },
  { id: 5, key: 'passiveFireProtection', icon: 'Flame', brands: ['Fire Stop', 'Hensotherm', 'Hensomastik'] },
  { id: 6, key: 'thermalInsulation', icon: 'Thermometer', brands: ['Isover Ultimate', 'Fyrewarp', 'Nautilus'] },
  { id: 7, key: 'pipes', icon: 'Pipette', brands: ['Pam Global S-Series', 'Pam Global Plus', 'Pam Global Facade'] },
  { id: 8, key: 'fans', icon: 'Fan', brands: ['Jet Fans', 'Smoke Exhaust', 'Duct Fans'] },
  { id: 9, key: 'marineAnticorrosion', icon: 'Anchor', brands: ['Rust Grip', 'Enamo Grip'] },
  { id: 10, key: 'additionalProducts', icon: 'Package', brands: [] },
]
