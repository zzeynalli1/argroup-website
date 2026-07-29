// Structural data only — name/description come from
// src/locales/<locale>/products.json via products.items.<key> so they stay
// translatable. `brands` are literal brand/product-line names (not
// sentences), so — like partners.js — they're kept here directly rather
// than routed through i18n.
export const products = [
  { id: 1, key: 'passiveFireProtection', icon: 'Flame', brands: ['Fire Stop', 'Hensotherm', 'Hensomastik'] },
  { id: 2, key: 'pipingSystems', icon: 'Pipette', brands: ['Pam Global'] },
  { id: 3, key: 'vibrationAcoustic', icon: 'Waves', brands: ['Sylomer', 'Vibrabsorber', 'Damtec'] },
  { id: 4, key: 'thermalInsulation', icon: 'Thermometer', brands: ['Isover Ultimate', 'Fyrewarp', 'Nautilus'] },
  { id: 5, key: 'ventilationSystems', icon: 'Fan', brands: ['Jet Fans', 'Smoke Exhaust', 'Duct Fans'] },
  { id: 6, key: 'marineAnticorrosion', icon: 'Anchor', brands: ['Rust Grip', 'Enamo Grip'] },
]
