// Structural data only — display text (name, checklist copy) comes from
// src/locales/<locale>/home.json via materials.items.<key>/.checklist so it
// stays translatable. `zone` is a percentage rect against the wall image
// (public/images/materials/wall-penetrations.jpg, 2560x851), matched by eye
// to where each penetration actually sits in that photo.
export const materials = [
  { id: 1, key: 'cableTray', link: '/services', zone: { left: 42, top: 20, width: 16, height: 60 } },
  { id: 2, key: 'metalPipe', link: '/services', zone: { left: 58, top: 20, width: 14, height: 60 } },
  { id: 3, key: 'hvacDuct', link: '/services', zone: { left: 72, top: 20, width: 16, height: 60 } },
  { id: 4, key: 'pvcPipe', link: '/services', zone: { left: 88, top: 20, width: 12, height: 60 } },
]
