import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Box, X } from 'lucide-react'
import { useTranslation } from '../../lib/i18n/useTranslation'
import ErrorBoundary from '../ui/ErrorBoundary'
import { useHeavyContentGate } from '../transitions/heavyContentGate'
import { detectSlowNetwork, detectStrongDevice } from '../../lib/deviceCapability'
import { diag3d } from '../../lib/diag3d'

// Three.js only loads once this section is actually rendered, keeping it out
// of the initial bundle (see CLAUDE.md perf note on the earlier 1.37MB hero).
const Hero3DScene = lazy(() =>
  import('../3d/Hero3DScene').then((mod) => {
    diag3d('3D chunk resolved (Building3DSection lazy)')
    return mod
  })
)

// Three static renders of the real scene (see scripts/render-hero-posters.mjs)
// — one per camera framing Hero3DScene itself picks between (see that file's
// `detectWideLayout`/`detectPortraitAspect`). Shown immediately as a real
// <picture> (no JS, no WebGL) while the actual scene decides whether/when to
// mount, so there's never a blank/gradient panel waiting on a ~375KB gzip
// chunk. Media queries below are kept in sync BY HAND with Hero3DScene's own
// `detectWideLayout` (width>=1024 && aspect>=1.5) and `detectPortraitAspect`
// (aspect<1.15) — the preload link in index.html mirrors the WIDE query too.
const POSTER_WIDE = '/images/3d/hero-wide.webp'
const POSTER_LANDSCAPE = '/images/3d/hero-landscape.webp'
const POSTER_PORTRAIT = '/images/3d/hero-portrait.webp'

function ScenePoster() {
  return (
    <picture className="block h-full w-full">
      <source media="(min-width: 1024px) and (min-aspect-ratio: 3/2)" srcSet={POSTER_WIDE} />
      <source media="(max-aspect-ratio: 115/100)" srcSet={POSTER_PORTRAIT} />
      <img
        src={POSTER_LANDSCAPE}
        alt=""
        fetchPriority="high"
        decoding="async"
        className="h-full w-full object-cover"
      />
    </picture>
  )
}

function InfoPanel({ hotspot, t, onClose }) {
  // No hotspot has `status: 'future'` yet (see data/hotspots3d.js) — this
  // branch is inert scaffolding for when a reserved-but-not-modeled
  // discipline gets its first hotspot, so adding one is a locale + data
  // change, not a component change.
  const isFuture = hotspot.status === 'future'

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-white/10 bg-industrial-950 px-6 py-6 md:absolute md:inset-x-auto md:top-6 md:right-6 md:max-h-[calc(100vh-3rem)] md:w-80 md:rounded-2xl md:border"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t('building3d.panel.close')}
        className="absolute right-4 top-4 z-10 text-neutral-custom-400 transition-colors hover:text-base-50"
      >
        <X size={18} />
      </button>

      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember-600">
        {isFuture ? t('building3d.panel.comingSoonLabel') : t('building3d.panel.selectedLabel')}
      </p>

      <h3 className="mt-3 pr-6 font-heading text-xl font-bold text-base-50">
        {t(`building3d.hotspots.${hotspot.key}.name`)}
      </h3>

      <p className="mt-4 text-sm leading-relaxed text-neutral-custom-400">
        {t(`building3d.hotspots.${hotspot.key}.description`)}
      </p>

      <Link
        to="/services"
        className="mt-6 inline-flex items-center justify-center rounded-md bg-ember-600 px-5 py-2.5 text-sm font-medium text-base-50 transition-colors hover:bg-ember-800"
      >
        {t('building3d.panel.detailsCta')}
      </Link>
    </motion.div>
  )
}

export default function Building3DSection() {
  const { t } = useTranslation('home')
  const sceneRef = useRef(null)
  const sectionRef = useRef(null)
  const [active, setActive] = useState(null)
  // Starts `true` so the very first mount (before the observer's first
  // callback has had a chance to fire) never freezes the scene — the Home
  // hero section is at/near the top of the page anyway, so this is correct
  // for the overwhelmingly common case (page just loaded) and self-corrects
  // within one frame if it isn't. Also doubles as the weak-device auto-load
  // gate below (a device that never scrolled this section into view yet
  // shouldn't pay for the WebGL mount at all) — see the mount-scheduling
  // effect further down.
  const [inView, setInView] = useState(true)
  // Separate from `inView` — a backgrounded tab (switched away from, not
  // just scrolled past) should pause the render loop too, same reasoning:
  // frameloop="always" keeps rendering every frame (post-processing, shadow
  // work, the continuous hotspot-breathing animation) with nothing visible
  // to show for it. Browsers already throttle/suspend requestAnimationFrame
  // in hidden tabs on their own, so this isn't fixing a literal "still
  // spinning at full rate in the background" bug — it's removing reliance
  // on that implicit, browser-version-dependent throttling (some browsers
  // still allow a slow residual rAF rate rather than fully stopping it) in
  // favor of an explicit, guaranteed-zero-cost pause the instant the tab is
  // hidden, verified via the Page Visibility API rather than assumed.
  const [tabVisible, setTabVisible] = useState(
    typeof document === 'undefined' || document.visibilityState !== 'hidden'
  )
  // Flips true once (via Hero3DScene's `ReadySignal` -> `onReady`, fired
  // after gl.compile AND the first real rendered frame — not merely once
  // the WebGL context exists) the real canvas has actually painted
  // something — drives the crossfade below. Deliberately never reset back
  // to false afterward (no reason to fade the poster back in once the real
  // scene is up).
  const [sceneReady, setSceneReady] = useState(false)
  // Keeps the poster mounted slightly past the crossfade's own transition
  // duration so it's still there underneath during the fade (rather than
  // unmounting the instant `sceneReady` flips, which would leave nothing to
  // fade FROM), then removes it from the DOM entirely once fully covered.
  const [showPoster, setShowPoster] = useState(true)

  // One-time-at-mount device/network heuristics (see lib/deviceCapability.js
  // for the exact checks) — computed once, not reactive: none of these
  // signals change mid-session in a way that matters here.
  const [isStrongDevice] = useState(detectStrongDevice)
  const [isSlowNetwork] = useState(detectSlowNetwork)
  // Gates the weak-device auto-load path below: that path waits for the
  // page's own `load` event (not just the intro) before scheduling its idle
  // mount, so the heavy WebGL setup never competes with everything else a
  // cold page load is still fetching/parsing.
  const [windowLoaded, setWindowLoaded] = useState(
    () => typeof document === 'undefined' || document.readyState === 'complete'
  )
  // True once the user has explicitly tapped the "Open 3D model" button
  // (only ever rendered on a weak device + constrained connection — see
  // `showOpenButton` below). Mounts the scene immediately on click, no idle
  // delay, since this is a direct user-initiated action, not a speculative
  // background load.
  const [manualOpenRequested, setManualOpenRequested] = useState(false)
  // Flips true once the scheduling effect below decides it's time to
  // actually render <Hero3DScene> (and therefore trigger its lazy chunk
  // import) — distinct from `canLoadHeavyContent` (the intro gate) below:
  // that only says "the intro is done", not "mount right now". Deliberately
  // never reset back to false.
  const [mountRequested, setMountRequested] = useState(false)

  // False only for the exact window where the first-load intro overlay is
  // about to play or is actively playing (see heavyContentGate.js /
  // RouteTransitionProvider's `heavyContentGateOpen`) — true immediately
  // for every other case (reduced motion, admin routes, intro already
  // shown this session, or any later nav back to Home). While false, the
  // scheduling effect below never starts counting down toward a mount.
  const canLoadHeavyContent = useHeavyContentGate()

  useEffect(() => {
    diag3d('Building3DSection mounted')
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined

    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: '200px 0px',
      threshold: 0,
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    function handleVisibilityChange() {
      setTabVisible(document.visibilityState !== 'hidden')
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    if (windowLoaded || typeof window === 'undefined') return undefined
    function handleLoad() {
      setWindowLoaded(true)
    }
    window.addEventListener('load', handleLoad)
    return () => window.removeEventListener('load', handleLoad)
  }, [windowLoaded])

  // Decides WHEN to actually mount <Hero3DScene> (flips `mountRequested`).
  // Three paths:
  //  - Manual (weak device + constrained connection, see `showOpenButton`):
  //    the button's own click handler sets `mountRequested` directly (skips
  //    this effect entirely) — a direct, user-initiated action, not a
  //    scheduling decision. `manualOpenRequested` only short-circuits the
  //    two scheduled paths below once that's happened.
  //  - Strong device: schedules an idle-callback mount right after the
  //    intro gate opens, same as before this change (full quality, no
  //    extra gating).
  //  - Weak device with a fine connection: waits for the page's own `load`
  //    event AND this section actually being in view, THEN schedules an
  //    idle-callback mount (longer timeout than the strong-device path,
  //    since there's no urgency) in `lowPower` mode. If the user touches or
  //    scrolls right as that's about to fire, the mount is pushed back 1s
  //    so the WebGL setup's own main-thread cost never lands mid-gesture.
  useEffect(() => {
    if (!canLoadHeavyContent) return undefined
    // Already mounted directly by the button's click handler — nothing left
    // for this effect to schedule.
    if (manualOpenRequested) return undefined

    if (!isStrongDevice) {
      // Constrained connection: never auto-load — wait for the button.
      if (isSlowNetwork) return undefined
      if (!windowLoaded) return undefined
      if (!inView) return undefined
    }

    let fired = false
    let idleId = 0
    let delayTimeoutId = 0
    let fallbackTimeoutId = 0
    const idleTimeout = isStrongDevice ? 2000 : 3000
    const fallbackDelay = isStrongDevice ? 1500 : 2250

    function mountNow() {
      if (fired) return
      fired = true
      setMountRequested(true)
    }

    function requestIdleMount() {
      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(mountNow, { timeout: idleTimeout })
      } else {
        fallbackTimeoutId = window.setTimeout(mountNow, fallbackDelay)
      }
    }

    function scheduleAfter(delay) {
      window.clearTimeout(delayTimeoutId)
      window.clearTimeout(fallbackTimeoutId)
      if (idleId) window.cancelIdleCallback?.(idleId)
      delayTimeoutId = window.setTimeout(requestIdleMount, delay)
    }

    scheduleAfter(0)

    function handleInteraction() {
      if (fired) return
      diag3d('3D weak-device mount deferred 1s (touch/scroll in progress)')
      scheduleAfter(1000)
    }

    if (!isStrongDevice) {
      window.addEventListener('touchstart', handleInteraction, { passive: true })
      window.addEventListener('scroll', handleInteraction, { passive: true })
    }

    return () => {
      fired = true
      window.clearTimeout(delayTimeoutId)
      window.clearTimeout(fallbackTimeoutId)
      if (idleId) window.cancelIdleCallback?.(idleId)
      if (!isStrongDevice) {
        window.removeEventListener('touchstart', handleInteraction)
        window.removeEventListener('scroll', handleInteraction)
      }
    }
  }, [canLoadHeavyContent, manualOpenRequested, isStrongDevice, isSlowNetwork, windowLoaded, inView])

  useEffect(() => {
    if (!sceneReady) return undefined
    // Matches the crossfade's own 700ms transition (see the canvas layer's
    // className below) plus a small margin — unmounts the poster only once
    // it's fully covered, never mid-fade.
    const timeout = window.setTimeout(() => setShowPoster(false), 800)
    return () => window.clearTimeout(timeout)
  }, [sceneReady])

  function handleClose() {
    sceneRef.current?.resetCamera()
    setActive(null)
  }

  useEffect(() => {
    if (!active) return

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        sceneRef.current?.resetCamera()
        setActive(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [active])

  // Only ever true on a weak device whose connection is ALSO constrained
  // (data-saver, or a 2G-class `effectiveType`) — every other device/
  // connection combination auto-loads on its own schedule above, so this
  // button only exists for the one case that deliberately never auto-loads.
  const showOpenButton = canLoadHeavyContent && !isStrongDevice && isSlowNetwork && !mountRequested
  const openButtonLoading = manualOpenRequested && !sceneReady

  return (
    <section ref={sectionRef} className="relative min-h-screen overflow-hidden bg-industrial-950">
      <div className="absolute inset-0">
        {/* Poster layer: a real photo of the scene (see scripts/render-hero-
            posters.mjs), shown instantly — no chunk, no WebGL — underneath
            the real canvas, so there's something to crossfade FROM instead
            of a hard cut once the 3D scene mounts and renders its first
            frame. Kept mounted a little past the fade's own duration (see
            `showPoster` above), then removed entirely. */}
        {showPoster && (
          <div className="absolute inset-0">
            <ScenePoster />
          </div>
        )}

        {/* Real scene layer: only rendered once the scheduling effect above
            decides it's time (`mountRequested`) — fades in once Hero3DScene's
            canvas has actually painted (`sceneReady`, set via the `onReady`
            callback below). ErrorBoundary is a separate layer from Suspense
            on purpose: Suspense only catches a thrown PROMISE (the loading
            state); a WebGL/Three.js runtime failure or a rejected asset load
            (e.g. a loader re-throwing a failed fetch as a render-time error)
            is a thrown ERROR, which only an error boundary catches — without
            one, that error would unmount this whole page, not just the 3D
            scene. */}
        {canLoadHeavyContent && mountRequested && (
          <div
            className="absolute inset-0 transition-opacity duration-700 ease-out"
            style={{ opacity: sceneReady ? 1 : 0 }}
          >
            <ErrorBoundary
              // Treated the same as "ready" for crossfade/poster purposes
              // below — without this, `sceneReady`/`showPoster` would never
              // flip (their only other trigger is Hero3DScene's own
              // `onReady`, which never fires if it crashed before mounting),
              // leaving this fallback stuck at opacity 0 behind a poster
              // that never gets its "unavailable" label.
              onError={(err) => {
                diag3d('3D scene ErrorBoundary caught (showing unavailable fallback)', err?.message)
                setSceneReady(true)
              }}
              fallback={
                <div className="absolute inset-0">
                  <ScenePoster />
                  <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-16 md:items-center md:pb-0">
                    <span className="rounded-full bg-industrial-950/80 px-4 py-2 text-xs text-neutral-custom-400">
                      {t('building3d.unavailable')}
                    </span>
                  </div>
                </div>
              }
            >
              <Suspense fallback={null}>
                <Hero3DScene
                  ref={sceneRef}
                  onHotspotChange={setActive}
                  active={inView && tabVisible}
                  lowPower={!isStrongDevice}
                  onReady={() => {
                    diag3d('3D scene onReady (first frame rendered, shaders compiled)')
                    setSceneReady(true)
                  }}
                />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}
      </div>

      {/* Text zone: default (mobile/tablet, below `lg`) keeps the original
          full-width, top-anchored block so the asymmetric column below never
          forces an unusably narrow text width on small screens (per the
          brief's Fix 5). From `lg` up it becomes a left-anchored ~30-35%-wide
          column, vertically centered, to leave the right side clear for the
          building once `Hero3DScene`'s view-offset shifts it there (see
          `CameraFrameShift` in Hero3DScene.jsx — this column width and that
          shift were tuned together). */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-start px-6 pt-28 md:pt-32 lg:items-center lg:px-12 lg:pt-0 xl:px-16">
        <div className="max-w-xl -translate-y-[60%] lg:w-[34%] lg:max-w-[460px] 2xl:max-w-[500px]">
          <span className="block h-1 w-16 bg-ember-600" />
          <h1 className="mt-6 font-heading text-3xl font-bold text-base-50 md:text-4xl">
            {t('building3d.titleLine1')}
            <br />
            <span className="text-ember-600">{t('building3d.titleLine2')}</span>
          </h1>
          <p className="mt-4 text-neutral-custom-400">{t('building3d.subtitle')}</p>
        </div>
      </div>

      {!active &&
        (showOpenButton ? (
          <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 md:left-6 md:translate-x-0">
            <button
              type="button"
              onClick={() => {
                setManualOpenRequested(true)
                setMountRequested(true)
              }}
              disabled={openButtonLoading}
              className="pointer-events-auto flex items-center gap-2 rounded-full bg-ember-600 px-4 py-2 text-xs font-medium text-base-50 transition-colors hover:bg-ember-800 disabled:opacity-80"
            >
              {openButtonLoading ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-base-50/40 border-t-base-50" />
              ) : (
                <Box size={14} />
              )}
              {openButtonLoading ? t('building3d.loading') : t('building3d.openModel')}
            </button>
          </div>
        ) : (
          <p className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full bg-industrial-950/80 px-4 py-2 text-xs text-neutral-custom-400 md:left-6 md:translate-x-0">
            {t('building3d.hint')}
          </p>
        ))}

      <AnimatePresence>
        {active && (
          <motion.div
            key="hotspot-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-industrial-950/60"
            onClick={handleClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {active && (
          <InfoPanel key={active.key} hotspot={active} t={t} onClose={handleClose} />
        )}
      </AnimatePresence>
    </section>
  )
}
