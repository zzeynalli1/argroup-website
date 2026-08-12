import * as THREE from 'three'

/**
 * Shared material palette for the Hero3DScene cutaway building.
 *
 * Two tiers:
 * - Static, module-level `THREE.Material` instances for shell/structure and
 *   generic small hardware — these never need per-mesh variation, so a
 *   single shared instance (referenced by many meshes) is strictly better
 *   than one `<meshStandardMaterial>` per mesh (see CLAUDE.md perf note +
 *   the "reuse geometries and materials" build brief).
 * - `useSystemMaterial()`, a hook for the ~10 hotspot-tagged "hero" system
 *   meshes (pipes, ducts, trays, collars…) that DO need per-mesh dynamic
 *   opacity when a hotspot is selected/deselected — those can't share a
 *   single material instance since dimming one must not dim all the others,
 *   so each gets its own small material, recreated only when the active
 *   hotspot changes (a rare, user-driven event, not a per-frame cost).
 *
 * Hex values mirror tailwind.config.js tokens where applicable; the rest are
 * tonal variants of industrial-800/neutral-custom-400 (not new brand
 * colors).
 *
 * --- Increment A: CC0 PBR texture foundation ---
 * Every non-glass/non-firestop material below now carries a real
 * photographed color/roughness/normal(/metalness) map instead of a flat
 * color — the single biggest lever for reading as an architectural render
 * instead of a Three.js primitive demo. All three texture sets are CC0
 * (public domain, ambientCG.com — https://ambientcg.com, no attribution
 * required; see public/textures/CREDITS.txt), downsized and recompressed
 * from their original 1K delivery to a combined ~130KB across all 11 files
 * so this stays cheap for real-time web/mobile:
 *   - `concrete`     — ambientCG "Concrete034" (poured/formed concrete).
 *                       Reused, with different color tints + roughness
 *                       multipliers (not separate texture files), for every
 *                       concrete surface in the scene: the three shell
 *                       concrete variants AND the ground yard slab.
 *   - `steel-painted` — ambientCG "Metal029" (black powder-coated steel).
 *                       Reused for structural steel and curtain-wall
 *                       aluminum framing (two different tints/roughness).
 *   - `galvanized`    — ambientCG "Metal009" (brushed silver steel). Reused
 *                       for generic hardware and galvanized finishes (two
 *                       different tints/roughness).
 * A texture is shared (not cloned) across every material that reuses it,
 * except the ground plane, which clones the concrete maps with a larger
 * `repeat` since it's a much bigger surface (24x24) than the building's own
 * concrete (footprint 6x4) — everything else deliberately shares one
 * texture object per set, tinted via each material's own `color` (which
 * multiplies the map, same for `roughness` x `roughnessMap`), keeping GPU
 * texture memory to 3 sets total no matter how many materials use them.
 *
 * Known, deliberate limitation: because box/cylinder UVs are 0..1 per face
 * regardless of that face's real-world size, one fixed `repeat` value can't
 * be physically accurate on every differently-sized mesh sharing a
 * material (a small column shows a different, more "zoomed" crop of the
 * same tile than a large floor slab). `repeat` below is tuned for this
 * scene's largest/most prominent surfaces; smaller elements show a
 * plausible, still-realistic crop of the same non-repeating-pattern-
 * sensitive material rather than a per-mesh-exact physical scale, which
 * would need per-mesh UV work out of scope for this pass (candidate for a
 * later optimization/quality pass if it reads as a problem in practice).
 *
 * Glass (`glazingMaterial`) intentionally has no texture map: the only CC0
 * "glass" sets available (ambientCG's "Facade00x") are full building-facade
 * photos with windows/mullions baked into the image, which would visually
 * collide with this scene's own real 3D mullion geometry (Architecture.jsx)
 * instead of adding realism. Glass gets its realism from `Environment`
 * reflections and lighting instead (Increment B), not a surface texture.
 * `firestopStaticMaterial` also intentionally stays a flat, untextured
 * color — it's a reserved graphic signal ("red = protected penetration"),
 * not a physical surface this scene is trying to photo-match.
 */
export const COLORS = {
  base50: '#FFFFFF',
  ember600: '#E31E24',
  amber500: '#E8A33D',
  neutral600: '#6B7075',
  concrete: '#8A8D91',
  concreteDark: '#797C80',
  metal: '#8B98A3',
  steelDark: '#4A4E52',
  galvanized: '#A6ADB3',
  fireproofCoating: '#C9C4BC',
  // Dark red/orange-red, reserved exclusively for real firestop products
  // (collars, sealant, board/mortar) — intentionally distinct from the
  // bright ember-600 used everywhere else for the interactive hotspot UI,
  // so "red in the scene" always and only means "protected opening".
  firestop: '#8C231B',
  firestopSealant: '#A32C1F',
}

const textureLoader = new THREE.TextureLoader()

// Loads one map for tiled reuse across many differently-sized meshes
// sharing one material (see the file-level note above re: the UV-scale
// limitation). `srgb` must be true for color/albedo maps and false for
// data maps (roughness/normal/metalness), which three.js expects in linear
// space.
function loadMap(url, { srgb = false, repeat = [1, 1] } = {}) {
  const texture = textureLoader.load(url)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(repeat[0], repeat[1])
  texture.anisotropy = 8
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

// Clones a loaded map with its own independent `repeat` (e.g. the ground
// plane reusing the concrete set at a much larger tile count) — three.js
// textures sharing the same source image but needing different
// repeat/wrapping must be distinct Texture instances.
function cloneMapWithRepeat(texture, repeat) {
  const clone = texture.clone()
  clone.repeat.set(repeat[0], repeat[1])
  clone.needsUpdate = true
  return clone
}

// --- Concrete (ambientCG "Concrete034", CC0) ---
const CONCRETE_REPEAT = [4, 3]
const concreteColorMap = loadMap('/textures/concrete/color.jpg', { srgb: true, repeat: CONCRETE_REPEAT })
const concreteNormalMap = loadMap('/textures/concrete/normal.jpg', { repeat: CONCRETE_REPEAT })
const concreteRoughnessMap = loadMap('/textures/concrete/roughness.jpg', { repeat: CONCRETE_REPEAT })

// --- Painted structural steel / curtain-wall framing (ambientCG "Metal029", CC0) ---
const STEEL_REPEAT = [2, 2]
const steelColorMap = loadMap('/textures/steel-painted/color.jpg', { srgb: true, repeat: STEEL_REPEAT })
const steelNormalMap = loadMap('/textures/steel-painted/normal.jpg', { repeat: STEEL_REPEAT })
const steelRoughnessMap = loadMap('/textures/steel-painted/roughness.jpg', { repeat: STEEL_REPEAT })
const steelMetalnessMap = loadMap('/textures/steel-painted/metalness.jpg', { repeat: STEEL_REPEAT })

// --- Galvanized / generic small hardware (ambientCG "Metal009", CC0) ---
const GALV_REPEAT = [2, 2]
const galvColorMap = loadMap('/textures/galvanized/color.jpg', { srgb: true, repeat: GALV_REPEAT })
const galvNormalMap = loadMap('/textures/galvanized/normal.jpg', { repeat: GALV_REPEAT })
const galvRoughnessMap = loadMap('/textures/galvanized/roughness.jpg', { repeat: GALV_REPEAT })
const galvMetalnessMap = loadMap('/textures/galvanized/metalness.jpg', { repeat: GALV_REPEAT })

// --- Increment B note on `envMapIntensity` ---
// Multiplies each material's contribution from the scene's IBL
// (`Environment`, see Hero3DScene.jsx) independent of its own map/roughness.
// Concrete is overwhelmingly diffuse in real life — a low value keeps a
// faint, plausible sheen (consistent with sealed/formed concrete) without
// it reading as a mirror; metals get a much stronger value so they actually
// pick up the environment and read as metallic rather than flat gray
// plastic; glass gets the strongest value since a curtain wall's whole
// visual identity is its reflection.
const CONCRETE_ENV_INTENSITY = 0.3
const METAL_ENV_INTENSITY = 0.9

export const concreteMaterial = new THREE.MeshStandardMaterial({
  color: '#C4C6C8',
  map: concreteColorMap,
  normalMap: concreteNormalMap,
  roughnessMap: concreteRoughnessMap,
  roughness: 0.95,
  metalness: 0.04,
  envMapIntensity: CONCRETE_ENV_INTENSITY,
})

export const concreteDarkMaterial = new THREE.MeshStandardMaterial({
  color: '#9A9C9F',
  map: concreteColorMap,
  normalMap: concreteNormalMap,
  roughnessMap: concreteRoughnessMap,
  roughness: 0.95,
  metalness: 0.03,
  envMapIntensity: CONCRETE_ENV_INTENSITY,
})

// A touch darker/rougher than concreteMaterial — used at grade (ground
// floor slab, expansion-joint reveals) to suggest weathering and pour-to-
// pour tonal variation instead of one flat, uniform concrete color
// everywhere.
export const concreteWeatheredMaterial = new THREE.MeshStandardMaterial({
  color: '#8A8B8D',
  map: concreteColorMap,
  normalMap: concreteNormalMap,
  roughnessMap: concreteRoughnessMap,
  roughness: 1.0,
  metalness: 0.03,
  envMapIntensity: CONCRETE_ENV_INTENSITY,
})

export const steelMaterial = new THREE.MeshStandardMaterial({
  color: '#7C8085',
  map: steelColorMap,
  normalMap: steelNormalMap,
  roughnessMap: steelRoughnessMap,
  metalnessMap: steelMetalnessMap,
  roughness: 0.5,
  metalness: 0.85,
  envMapIntensity: METAL_ENV_INTENSITY,
})

export const galvanizedMaterial = new THREE.MeshStandardMaterial({
  color: '#C7CBCF',
  map: galvColorMap,
  normalMap: galvNormalMap,
  roughnessMap: galvRoughnessMap,
  metalnessMap: galvMetalnessMap,
  roughness: 0.42,
  metalness: 0.65,
  envMapIntensity: METAL_ENV_INTENSITY,
})

// Anthracite aluminum curtain-wall framing (mullions/transoms/perimeter
// frame) — a distinct, lighter-metalness finish from `steelMaterial`
// (embedded structural beams/painted steel) on purpose: real curtain-wall
// extrusions are powder-coated aluminum, not the same product as a rolled
// structural section, and should read as a visibly different material under
// the same lighting. Shares the same painted-steel texture set as
// `steelMaterial` (both are "painted metal" finishes), differentiated by
// tint/roughness only.
export const framingMaterial = new THREE.MeshStandardMaterial({
  color: '#5B5F65',
  map: steelColorMap,
  normalMap: steelNormalMap,
  roughnessMap: steelRoughnessMap,
  metalnessMap: steelMetalnessMap,
  roughness: 0.4,
  metalness: 0.7,
  envMapIntensity: METAL_ENV_INTENSITY,
})

export const hardwareMaterial = new THREE.MeshStandardMaterial({
  color: '#A7AEB4',
  map: galvColorMap,
  normalMap: galvNormalMap,
  roughnessMap: galvRoughnessMap,
  metalnessMap: galvMetalnessMap,
  roughness: 0.48,
  metalness: 0.72,
  envMapIntensity: METAL_ENV_INTENSITY,
})

// Subtle blue-green tint (real low-iron/coated glass is never perfectly
// clear-white) plus a touch more metalness for crisper `Environment`
// reflections on the curtain wall. No texture map — see the file-level note
// on why glass is out of scope for Increment A's texture pass. Highest
// `envMapIntensity` of any material in the scene — a curtain wall's entire
// visual identity is its reflection, so this needs to read clearly while
// `opacity`/`transparent` still keep it genuinely see-through.
export const glazingMaterial = new THREE.MeshStandardMaterial({
  color: '#E1EBEC',
  transparent: true,
  opacity: 0.24,
  roughness: 0.08,
  metalness: 0.18,
  envMapIntensity: 1.1,
  side: THREE.DoubleSide,
})

// Slightly darker than the building's own concrete so the two read as
// distinct surfaces instead of blending together under the same bright key
// light — the yard slab, not an extension of the walls. Reuses the same
// concrete texture set as the building's own concrete, cloned with a much
// larger `repeat` since this plane (24x24) is many times the size of the
// building's own concrete surfaces.
const groundColorMap = cloneMapWithRepeat(concreteColorMap, [18, 18])
const groundNormalMap = cloneMapWithRepeat(concreteNormalMap, [18, 18])
const groundRoughnessMap = cloneMapWithRepeat(concreteRoughnessMap, [18, 18])

export const groundMaterial = new THREE.MeshStandardMaterial({
  color: '#75777B',
  map: groundColorMap,
  normalMap: groundNormalMap,
  roughnessMap: groundRoughnessMap,
  roughness: 0.97,
  metalness: 0.02,
  envMapIntensity: CONCRETE_ENV_INTENSITY,
})

// Static (non-hotspot) firestop-red material for enrichment penetrations
// that aren't one of the 10 hotspot-tagged systems (multi-cable board,
// HVAC-through-wall stub) — still real firestop color, just not wired into
// the per-hotspot dim/highlight system since nothing hotspot-specific
// anchors there. Intentionally untextured — see the file-level note.
export const firestopStaticMaterial = new THREE.MeshStandardMaterial({
  color: COLORS.firestopSealant,
  roughness: 0.7,
  metalness: 0.1,
})
