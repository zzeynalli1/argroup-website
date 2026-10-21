// Shared device heuristic used to decide whether the Home page's 3D
// building scene should render in `lowPower` mode (see Hero3DScene.jsx's
// own `lowPower` prop). Lives here (not inside components/3d/) so it stays
// importable without pulling in anything from the Three.js/R3F chunk.

// Dependency-free (no GPU-benchmark fetch) and computed once per page load,
// not reactive: none of these signals change mid-session in a way that
// matters here. Deliberately narrow — only a real touch/coarse-pointer
// device (phone/tablet) OR genuinely weak hardware (<=2 cores or <=2GB RAM)
// qualifies; a resized/narrow desktop browser window no longer does (that
// was this function's previous, broader rule — a narrow window on a
// perfectly capable desktop GPU has no real reason to drop to lowPower).
// `hardwareConcurrency`/`deviceMemory` only count AGAINST the device when
// the browser actually reports a low value; browsers that don't expose
// either (e.g. Safari reports neither) aren't penalized for an unknown.
export function detectLowPower() {
  if (typeof window === 'undefined') return false
  const pointerCoarse = window.matchMedia?.('(pointer: coarse)').matches ?? false
  const cores = navigator.hardwareConcurrency
  const veryWeakCores = cores !== undefined && cores <= 2
  const memory = navigator.deviceMemory
  const veryWeakMemory = memory !== undefined && memory <= 2
  return pointerCoarse || veryWeakCores || veryWeakMemory
}
