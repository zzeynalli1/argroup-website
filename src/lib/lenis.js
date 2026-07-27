import Lenis from 'lenis'

/**
 * Minimal Lenis smooth-scroll setup.
 * Call `initLenis()` once (e.g. in a top-level layout effect) and `destroy()`
 * on unmount. Tuning (easing, duration, direction) is left to the design pass.
 */
export function initLenis() {
  const lenis = new Lenis()

  function raf(time) {
    lenis.raf(time)
    requestAnimationFrame(raf)
  }

  requestAnimationFrame(raf)

  return lenis
}
