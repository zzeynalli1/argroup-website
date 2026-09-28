// Structural data only — display text (title, description) comes from
// src/locales/<locale>/home.json via materials.items.<key> so it stays
// translatable. `zone` is a percentage rect against the wall image
// (public/images/materials/wall-penetrations.jpg, 2560x851), hand-matched to
// where each penetration's own firestop collar + protruding service actually
// sits in that photo — not an even split of the image into four columns.
export const materials = [
  { id: 1, key: 'cablePenetration', zone: { left: 41, top: 35, width: 16.5, height: 27 } },
  { id: 2, key: 'metalPipePenetration', zone: { left: 58.5, top: 36, width: 12, height: 23 } },
  { id: 3, key: 'ductPenetration', zone: { left: 71, top: 35, width: 18.5, height: 29 } },
  { id: 4, key: 'plasticPipePenetration', zone: { left: 90.5, top: 37, width: 9, height: 19 } },
]
