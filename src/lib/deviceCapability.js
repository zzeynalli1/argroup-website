// Shared device heuristic used to decide whether the Home page's 3D
// building scene should render in `lowPower` mode (see Hero3DScene.jsx's
// own `lowPower` prop). Lives here (not inside components/3d/) so it stays
// importable without pulling in anything from the Three.js/R3F chunk.

// Dependency-free (no GPU-benchmark fetch) and computed once per page load,
// not reactive: none of these signals change mid-session in a way that
// matters here. A touch/coarse-pointer device OR a narrow viewport OR
// noticeably weak CPU/RAM all independently qualify as "weak" — any one is
// enough. `hardwareConcurrency`/`deviceMemory` only count AGAINST the
// device when the browser actually reports a low value; browsers that
// don't expose either (older Safari reports neither) aren't penalized for
// an unknown.
export function detectLowPower() {
  if (typeof window === 'undefined') return false
  const pointerCoarse = window.matchMedia?.('(pointer: coarse)').matches ?? false
  const narrowViewport = window.innerWidth < 1024
  const cores = navigator.hardwareConcurrency
  const weakCores = cores !== undefined && cores < 6
  const memory = navigator.deviceMemory
  const weakMemory = memory !== undefined && memory < 4
  return pointerCoarse || narrowViewport || weakCores || weakMemory
}
