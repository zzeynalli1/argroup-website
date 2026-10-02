import * as THREE from 'three'

/**
 * Shared material palette for the Hero3DScene cutaway building.
 *
 * Two tiers:
 * - Static, module-level `THREE.Material` instances for shell/structure and
 *   generic small hardware — these never need per-mesh variation, so a
 *   single shared instance (referenced by many meshes) is strictly better
 *   than one `<meshStandardMaterial>` per mesh (see CLAUDE.md perf note +
 *   the "reuse geometries and materials" performance note).
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
 * --- CC0 PBR texture foundation ---
 * Every non-glass/non-firestop material below carries a real
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
 * would need per-mesh UV work, a candidate for a later optimization pass if
 * it reads as a problem in practice.
 *
 * Glass (`glazingMaterial`) intentionally has no texture map: the only CC0
 * "glass" sets available (ambientCG's "Facade00x") are full building-facade
 * photos with windows/mullions baked into the image, which would visually
 * collide with this scene's own real 3D mullion geometry (Architecture.jsx)
 * instead of adding realism. Glass gets its realism from `Environment`
 * reflections and lighting instead, not a surface texture.
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

// `envMapIntensity` multiplies each material's contribution from the scene's IBL
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

// Warmer light-grey plaster/concrete finish for the exterior envelope,
// distinct from `concreteMaterial` above (kept for structural elements —
// columns/beams/slabs, which stay a neutral structural tone and are mostly
// concealed by the envelope anyway). Reuses the same CC0 concrete texture
// set (no new texture load) — only `color` (a multiply tint) differs.
export const facadeMaterial = new THREE.MeshStandardMaterial({
  color: '#D8D2C7',
  map: concreteColorMap,
  normalMap: concreteNormalMap,
  roughnessMap: concreteRoughnessMap,
  roughness: 0.92,
  metalness: 0.03,
  envMapIntensity: CONCRETE_ENV_INTENSITY,
})

// Graphite/charcoal metal accent panel — a visible but not-pure-black metal,
// distinct from `framingMaterial` (window/curtain-wall frames) so the two
// dark tones read as different products at different scales, same as real
// cladding systems do. Reuses the painted-steel texture set already loaded
// for `steelMaterial`. A small constant NEUTRAL (not colored) emissive floor
// keeps this very-dark base color from crushing to a literal (0,0,0)
// pure-black void in this scene's self-shadowed corners once N8AO/contrast/
// AGX post-processing is applied — kept low enough that real shading/
// contact-shadow variation still shows through rather than flattening to one
// uniform tone.
export const panelCharcoalMaterial = new THREE.MeshStandardMaterial({
  color: '#332F2A',
  map: steelColorMap,
  normalMap: steelNormalMap,
  roughnessMap: steelRoughnessMap,
  metalnessMap: steelMetalnessMap,
  roughness: 0.8,
  metalness: 0.3,
  envMapIntensity: METAL_ENV_INTENSITY * 0.3,
  emissive: '#332F2A',
  emissiveIntensity: 0.75,
})

// Warm timber-slat accent (vertical entrance screen) — flat PBR color, no
// texture: a single restrained wood tone reused across every instanced slat
// is cheap and reads fine at this model's scale/distance; a real wood-grain
// texture would need its own CC0 set for one small accent, out of
// proportion to what it adds here.
export const timberMaterial = new THREE.MeshStandardMaterial({
  color: '#8B6A4A',
  roughness: 0.72,
  metalness: 0.04,
})

// Light concrete paving for the entrance plaza/walkway — distinct from
// `groundMaterial` (the yard slab beyond the paving) so the paved area
// reads as a distinct finish, not a seamless extension of bare ground.
// Reuses the same concrete texture set, lighter/warmer tint + less rough
// (a trafficked paving finish is smoother than raw poured concrete).
const plazaColorMap = cloneMapWithRepeat(concreteColorMap, [10, 10])
const plazaNormalMap = cloneMapWithRepeat(concreteNormalMap, [10, 10])
const plazaRoughnessMap = cloneMapWithRepeat(concreteRoughnessMap, [10, 10])
export const plazaMaterial = new THREE.MeshStandardMaterial({
  color: '#C7C2B8',
  map: plazaColorMap,
  normalMap: plazaNormalMap,
  roughnessMap: plazaRoughnessMap,
  roughness: 0.85,
  metalness: 0.02,
  envMapIntensity: CONCRETE_ENV_INTENSITY,
})

// Flat, untextured landscape greens — cheap on purpose (a handful of
// low-poly shrubs/lawn strips, not a vegetation system). Darkened/
// desaturated rather than a more saturated green, which reads as bright
// cartoonish "lollipop" green under this scene's key light, wrong for a
// restrained dusk backdrop.
export const lawnMaterial = new THREE.MeshStandardMaterial({ color: '#3D4832', roughness: 0.95, metalness: 0 })
export const foliageMaterial = new THREE.MeshStandardMaterial({ color: '#333D2A', roughness: 0.95, metalness: 0 })
export const planterMaterial = new THREE.MeshStandardMaterial({
  color: '#B9B4AA',
  map: concreteColorMap,
  normalMap: concreteNormalMap,
  roughnessMap: concreteRoughnessMap,
  roughness: 0.9,
  metalness: 0.03,
  envMapIntensity: CONCRETE_ENV_INTENSITY,
})

// Warm exterior-light glow (bollards, canopy underlight) — a small constant
// emissive, deliberately not the brand ember-red so "red" in the scene stays
// reserved for firestop/hotspot meaning per the existing palette convention.
export const warmGlowMaterial = new THREE.MeshStandardMaterial({
  color: '#3A2E20',
  emissive: '#FFCB8A',
  emissiveIntensity: 1.1,
  roughness: 0.5,
  metalness: 0,
})

// Bollard lamp head (SiteEnvironment.jsx) — much higher emissive intensity
// than `warmGlowMaterial` below (which is tuned for small background
// canopy/downlight fixture glints, not a light source meant to read as
// clearly "on" at this camera distance).
export const bollardLampMaterial = new THREE.MeshStandardMaterial({
  color: '#FFDA9E',
  emissive: '#FFB65E',
  emissiveIntensity: 2.6,
  roughness: 0.4,
  metalness: 0,
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
// Darkened toward near-black — still not pure #000, keeping a faint
// readable tint under the key light instead of crushing to a silhouette.
// Deliberately has NO texture map, unlike the other metal materials in this
// file: every thin frame member (window mullions, door frame, entrance
// canopy, curtain-wall mullions/transoms) is exactly the case this file's
// own file-level comment flags as a known limitation — box UVs are 0..1 per
// FACE regardless of that face's real size, so a thin trim member stretches
// the ENTIRE `steel-painted` texture across a sliver of screen space.
// Wherever that texture has a bright highlight/scratch (inevitable in any
// photographed metal texture), a thin member shows it as a solid
// mirror-sharp streak covering most of its face rather than a small
// proportionate fleck. A flat matte color is immune to this artifact by
// construction, and is standard for painted aluminum trim at this scale
// anyway.
export const framingMaterial = new THREE.MeshStandardMaterial({
  color: '#1E1F22',
  roughness: 0.62,
  metalness: 0.25,
  envMapIntensity: 0.25,
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

// Neutral warm-grey tint (deliberately no blue cast, which otherwise reads
// as a real material property up close) plus a touch more metalness for
// crisper `Environment` reflections on the curtain wall. No texture map —
// see the file-level note on why glass is out of scope for the texture
// pass. Highest `envMapIntensity` of any material in the scene — a curtain
// wall's entire visual identity is its reflection, so this needs to read
// clearly while `opacity`/`transparent` still keep it genuinely see-through.
// A warm emissive floor (`emissive`/`emissiveIntensity` below) reads as a
// plausible lit-interior glimpse behind the glass at dusk without needing
// any actual interior geometry/lighting — cheap and scene-wide since every
// glazing surface (curtain wall + entrance door + the facade windows)
// shares this one material. Opacity is kept low enough that the scene's own
// geometry behind the glass (the stair, the office interiors) actually
// shows through rather than reading as a near-solid grey wall.
export const glazingMaterial = new THREE.MeshStandardMaterial({
  color: '#EAE6DC',
  transparent: true,
  opacity: 0.16,
  roughness: 0.08,
  metalness: 0.18,
  envMapIntensity: 1.1,
  emissive: '#4A3620',
  emissiveIntensity: 0.16,
  side: THREE.DoubleSide,
})

// Curtain-wall stairwell glazing + stair-tread materials, distinct from the
// shared `glazingMaterial` (facade windows/entrance door): at full-height
// curtain-wall scale, `glazingMaterial`'s opacity/envMapIntensity (tuned for
// small windows/doors) reads far brighter, and the stair treads visible
// through the glass (`steelMaterial`, metalness 0.85) catch a strong
// specular highlight that Bloom's luminance threshold would magnify into a
// bright zig-zag through the glazing. Both get their own darker/
// less-reflective material so the bay stays a legible secondary facade
// (stairs still visible) instead of the visual focal point.
export const curtainWallGlassMaterial = new THREE.MeshStandardMaterial({
  color: '#B2ACA0',
  transparent: true,
  opacity: 0.22,
  roughness: 0.22,
  metalness: 0.1,
  envMapIntensity: 0.32,
  emissive: '#3A2C1C',
  emissiveIntensity: 0.14,
  side: THREE.DoubleSide,
})

export const stairTreadMaterial = new THREE.MeshStandardMaterial({
  color: '#5B5E62',
  roughness: 0.65,
  metalness: 0.45,
  envMapIntensity: METAL_ENV_INTENSITY * 0.4,
})

// Normal/roughness grain reused from the same CC0 concrete set as the
// building's own concrete, cloned with a much larger `repeat` since this
// plane (24x24) is many times the size of the building's own concrete
// surfaces — these two still just provide fine micro-surface bump/roughness
// variation; the macro slab-joint pattern below is a separate procedural
// color map (see `groundPavingColorMap`), deliberately at a different,
// coarser repeat than this micro grain (real paving grain doesn't align to
// the joint grid).
const groundNormalMap = cloneMapWithRepeat(concreteNormalMap, [18, 18])
const groundRoughnessMap = cloneMapWithRepeat(concreteRoughnessMap, [18, 18])

// Procedural large-slab architectural paving for the main ground plane — a
// straight photographic clone of the building's own small-scale concrete
// texture reads as bare, featureless asphalt at this plane's real size, with
// no slab joints or sense of installed paving. Painted once, at module load,
// into a single small tileable canvas rather than per-line mesh geometry
// (individual joint-line meshes would be wasteful at this plane's scale,
// unlike the small entrance plaza in SiteEnvironment.jsx, which is cheap
// enough for a handful of literal joint-line meshes).
//
// One canvas tile = a 4x4 sub-grid of individual paving slabs, each with its
// own small baked tonal offset, so neighbouring slabs visibly differ — a
// single flat tile repeated with NO internal variation would read as a
// checkerboard once tiled. `GROUND_PAVING_REPEAT` then tiles that 4x4-slab tile a further
// 3x3 times across the 24x24 plane, for 12x12 = 144 total slabs at roughly
// 2 world units (~large-format paver scale) each — few enough repeats of
// the *same* 16-slab pattern that it doesn't read as an obvious stamped
// repeat at this scene's camera distances/framing, while staying a single
// cheap texture (no per-slab geometry).
const GROUND_PAVING_TILE_PX = 512
const GROUND_PAVING_GRID = 4
const GROUND_PAVING_REPEAT = [3, 3]

function createGroundPavingTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = GROUND_PAVING_TILE_PX
  canvas.height = GROUND_PAVING_TILE_PX
  const ctx = canvas.getContext('2d')
  const cell = GROUND_PAVING_TILE_PX / GROUND_PAVING_GRID
  const jointWidth = Math.max(2, Math.round(cell * 0.035))

  // Small seeded PRNG (mulberry32) — deterministic slab-to-slab variation
  // instead of reshuffling on every reload.
  let seed = 0x9f2c1a7
  function rng() {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  // Warm dark graphite base — a mid-tone here, since `groundMaterial.color`
  // below multiplies this map down to the final dark tone (same "photo/
  // canvas map x tint color" convention every other material in this file
  // uses), rather than baking the final darkness directly into the canvas.
  const baseL = 150

  for (let gy = 0; gy < GROUND_PAVING_GRID; gy++) {
    for (let gx = 0; gx < GROUND_PAVING_GRID; gx++) {
      const x0 = gx * cell
      const y0 = gy * cell
      const offset = (rng() - 0.5) * 26 // per-slab tonal variance
      const l = Math.round(baseL + offset)
      ctx.fillStyle = `rgb(${l}, ${l - 3}, ${l - 8})`
      ctx.fillRect(x0, y0, cell, cell)

      // Sparse fine speckle noise within the slab — subtle aggregate/stone
      // grain visible even from a near-overhead camera angle where the
      // normal map's own bump lighting contributes little.
      const speckleCount = 26
      for (let i = 0; i < speckleCount; i++) {
        const sx = x0 + rng() * cell
        const sy = y0 + rng() * cell
        const sl = l + (rng() - 0.5) * 22
        ctx.fillStyle = `rgba(${sl}, ${sl - 3}, ${sl - 8}, 0.35)`
        ctx.fillRect(sx, sy, 1.6, 1.6)
      }

      // Recessed joint groove along this slab's own top/left edges — drawn
      // per-slab (not as one grid overlay) so it also lands correctly at
      // the tile's own repeat boundary once `wrapS`/`wrapT` tiles it.
      const jointL = l - 34
      ctx.fillStyle = `rgb(${jointL}, ${jointL - 3}, ${jointL - 6})`
      ctx.fillRect(x0, y0, cell, jointWidth)
      ctx.fillRect(x0, y0, jointWidth, cell)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(GROUND_PAVING_REPEAT[0], GROUND_PAVING_REPEAT[1])
  texture.anisotropy = 8
  return texture
}

const groundPavingColorMap = createGroundPavingTexture()

// Warm dark graphite/stone-concrete architectural paving (see
// `groundPavingColorMap` above), staying matte (high roughness, near-zero
// metalness/env reflection) and visibly darker/duller than `plazaMaterial`
// (the lighter entrance paving), preserving the intended dark-site ->
// lighter-entrance -> building tonal hierarchy.
export const groundMaterial = new THREE.MeshStandardMaterial({
  color: '#4C4842',
  map: groundPavingColorMap,
  normalMap: groundNormalMap,
  roughnessMap: groundRoughnessMap,
  roughness: 0.98,
  metalness: 0.015,
  envMapIntensity: CONCRETE_ENV_INTENSITY * 0.5,
})

// Entrance door glass — distinct from `glazingMaterial`, which reused over
// the door's small/recessed area would read as a solid orange/wood-toned
// panel instead of dark aluminum-framed glass (the entrance is dark glass in
// a black aluminum frame, not a warm glow). Darker/cooler, with no emissive
// floor, reused only for the door leaf itself (the surrounding frame already
// uses `framingMaterial`, unchanged). Opacity is kept high (mostly opaque,
// only a hint of transmission) since the entrance recess right behind it
// (`facadeMaterial`, a light warm-beige, sitting next to the entrance's own
// warm point light in Hero3DScene.jsx) would otherwise dominate the door's
// read straight through the glass regardless of the glass's own dark color.
export const entranceGlassMaterial = new THREE.MeshStandardMaterial({
  color: '#24262A',
  transparent: true,
  opacity: 0.82,
  roughness: 0.5,
  metalness: 0.1,
  envMapIntensity: 0.3,
  side: THREE.DoubleSide,
})

// Flat, untextured tree trunk tone — same "cheap on purpose" reasoning as
// `lawnMaterial`/`foliageMaterial` above (a handful of low-poly background
// trees, not a vegetation system).
export const barkMaterial = new THREE.MeshStandardMaterial({ color: '#3E3126', roughness: 0.95, metalness: 0 })
// A second, slightly darker/cooler canopy tone reused alongside
// `foliageMaterial` so a small row of trees doesn't read as identical
// stamped-out copies.
export const foliageAccentMaterial = new THREE.MeshStandardMaterial({ color: '#2C3628', roughness: 0.95, metalness: 0 })

// Backlit sign panel (AR Group wall sign, ExteriorShell.jsx) — a plain dark
// panel with a small warm/red emissive floor so it reads as backlit rather
// than a flat printed graphic. The lettering itself is the separate
// `signTextTexture` canvas texture below, composited on top via its own
// plane/material in ExteriorShell.jsx.
export const signPanelMaterial = new THREE.MeshStandardMaterial({
  color: '#1C1D1F',
  emissive: '#2A1512',
  emissiveIntensity: 0.5,
  roughness: 0.5,
  metalness: 0.2,
})

// Sign lettering, drawn once to an offscreen canvas at module load rather
// than using drei's `<Text>` (troika-three-text): troika fetches its default
// glyph font from a remote CDN, which doesn't always resolve in time (or at
// all) in every network environment and silently leaves the sign blank —
// unacceptable for an always-visible wall sign. A canvas texture drawn with
// the browser's own system sans-serif has zero network dependency.
function createSignTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 360
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.textBaseline = 'alphabetic'

  ctx.font = '700 118px Arial, sans-serif'
  ctx.fillStyle = COLORS.ember600
  ctx.fillText('AR', 26, 165)
  const arWidth = ctx.measureText('AR').width

  ctx.fillStyle = '#F2F0EC'
  ctx.fillText('Group', 26 + arWidth + 8, 165)

  ctx.font = '600 32px Arial, sans-serif'
  ctx.fillStyle = '#B9B4AA'
  let x = 28
  for (const ch of 'CONSTRUCTION SERVICES') {
    ctx.fillText(ch, x, 235)
    x += ctx.measureText(ch).width + 4
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export const signTextTexture = createSignTexture()

// Cheap interior-glow "stage set" behind visible glazing (facade windows +
// entrance door) — convincing warm light behind the glass, not a dead/empty
// void. Deliberately NOT a modeled interior — just enough depth behind the
// glass to read as "there's a room there": a warm-washed back wall plane, a
// floor plane, and a couple of flat furniture-block silhouettes (see
// ExteriorShell.jsx's `InteriorGlowRoom`). `interiorWallGlowMaterial` uses a
// real emissive-heavy standard material (not fully unlit) since it still
// needs to receive a little of the scene's own key light to not look like a
// flat sticker, and `interiorSilhouetteMaterial` is a plain dark neutral so
// blocky "furniture" reads as a silhouette against the warm wash behind it.
// `emissiveIntensity` is kept low enough that it doesn't overpower the
// entrance door's semi-opaque `entranceGlassMaterial` in front of it (a
// bright object close behind dark semi-opaque glass reads as a solid panel,
// not a glimpse of a lit room) while still reading clearly through the
// facade windows' much more transparent `glazingMaterial` (opacity 0.16).
export const interiorWallGlowMaterial = new THREE.MeshStandardMaterial({
  color: '#4A3620',
  emissive: '#FFC98A',
  emissiveIntensity: 0.2,
  roughness: 0.9,
  metalness: 0,
})
export const interiorSilhouetteMaterial = new THREE.MeshStandardMaterial({
  color: '#1E1B17',
  roughness: 0.85,
  metalness: 0,
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
