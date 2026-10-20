// TEMPORARY diagnostic logging for the homepage route-transition / 3D-scene
// freeze investigation — grep "diag3d" to find every call site and strip
// them once the fix is confirmed in production. Timestamps are
// performance.now() (monotonic, unaffected by system clock changes),
// relative to navigation start, so gaps between checkpoints are directly
// readable off the console without doing timestamp math by hand.
export function diag3d(label, extra) {
  const t = Math.round(performance.now())
  if (extra !== undefined) {
    console.log(`[diag3d] ${t}ms  ${label}`, extra)
  } else {
    console.log(`[diag3d] ${t}ms  ${label}`)
  }
}
