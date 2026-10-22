// Single shared source for the Home hero 3D scene's HDRI
// (/hdr/potsdamer_platz_512.hdr) — module-scope cached promise so the file
// is fetched AT MOST ONCE per page load no matter how many of main.jsx,
// App.jsx's `HeroScenePrefetch`, and Hero3DScene.jsx itself ask for it.
// Returns the raw ArrayBuffer, not a decoded texture: callers that only want
// to warm the HTTP fetch (main.jsx, App.jsx) don't need to pull in
// RGBELoader/three — only Hero3DScene.jsx, already inside the three-
// dependent chunk, decodes these bytes into a texture.
import { diag3d } from './diag3d'

export const HERO_HDRI_URL = '/hdr/potsdamer_platz_512.hdr'

let requestCount = 0
let cachedBufferPromise = null

export function prefetchHeroHdri() {
  if (!cachedBufferPromise) {
    requestCount += 1
    diag3d(`HDRI request #${requestCount} (target: 1) starting`, HERO_HDRI_URL)
    cachedBufferPromise = fetch(HERO_HDRI_URL, { credentials: 'omit' }).then((res) => {
      if (!res.ok) throw new Error(`HDRI fetch failed: ${res.status}`)
      return res.arrayBuffer()
    })
  }
  return cachedBufferPromise
}
