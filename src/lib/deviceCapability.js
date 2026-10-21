// Shared device/network heuristics used to decide whether the Home page's
// 3D building scene is safe to auto-load at full quality. Lives here (not
// inside components/3d/) so App.jsx's early background-prefetch gate (see
// HeroScenePrefetch) can read the same signal without importing anything
// from the Three.js/R3F chunk — importing from components/3d/* would pull
// that whole chunk into App.jsx's own eager bundle, defeating the point of
// lazy-loading it in the first place.

// A conservative "this device can comfortably run the full-quality scene"
// check — deliberately dependency-free (no GPU-benchmark fetch) and
// computed once per page load, not reactive: none of these signals change
// mid-session in a way that matters here. Every signal defaults to "pass"
// when the browser doesn't expose it (older Safari has neither
// `hardwareConcurrency` nor `deviceMemory`, for example) — treating an
// unknown as disqualifying would wrongly downgrade browsers that simply
// don't report the metric, not ones that are actually weak.
export function detectStrongDevice() {
  if (typeof window === 'undefined') return false
  const pointerFine = window.matchMedia?.('(pointer: fine)').matches ?? false
  const wideViewport = window.innerWidth >= 1024
  const cores = navigator.hardwareConcurrency
  const okCores = cores === undefined || cores >= 6
  const memory = navigator.deviceMemory
  const okMemory = memory === undefined || memory >= 4
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  const saveData = connection?.saveData ?? false
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  return pointerFine && wideViewport && okCores && okMemory && !saveData && !reducedMotion
}

// Separate from `detectStrongDevice` above: a weak device with a perfectly
// fine connection still auto-loads the scene (in lowPower mode) a little
// later — this only flags the subset of weak devices whose network is ALSO
// constrained (data-saver mode, or a 2G-class `effectiveType`), where even
// the lowPower scene's ~375KB gzip chunk shouldn't be fetched without the
// user explicitly asking for it via the "Open 3D model" button.
export function detectSlowNetwork() {
  if (typeof window === 'undefined') return false
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  if (!connection) return false
  if (connection.saveData) return true
  return connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g'
}
