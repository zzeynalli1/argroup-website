import { lazy, Suspense, useContext, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useTranslation } from '../../lib/i18n/useTranslation'
import ErrorBoundary from '../ui/ErrorBoundary'
import { LoadingSignalContext } from '../transitions/routeLoadingSignal'
import { diag3d } from '../../lib/diag3d'

// Separate, much tighter ceiling than RouteTransitionProvider's own
// SAFETY_TIMEOUT_MS (8000ms, sized for a genuinely stalled network chunk) —
// this one specifically bounds how long the transition overlay's reveal can
// be held open waiting on THIS scene's heavy WebGL startup (shader compile +
// first real frame, see Hero3DScene's `ReadySignal`). 2.5s is generous for a
// cold GPU/driver on a slow device while still well short of reading as
// "frozen" if the scene is unusually slow to come up — the overlay opens on
// schedule either way, just to a canvas that keeps loading underneath it.
const HEAVY_LOAD_MAX_WAIT_MS = 2500

// Three.js only loads once this section is actually rendered, keeping it out
// of the initial bundle (see CLAUDE.md perf note on the earlier 1.37MB hero).
const Hero3DScene = lazy(() =>
  import('../3d/Hero3DScene').then((mod) => {
    diag3d('3D chunk resolved (Building3DSection lazy)')
    return mod
  })
)

// Deliberately duplicated (not imported) from Hero3DScene.jsx's own
// `BACKDROP_TOP` / `BACKDROP_BOTTOM` constants — importing them would pull
// the entire Three.js/R3F chunk into this section's eager bundle, defeating
// the whole point of lazy-loading Hero3DScene below. Keep these two hex
// values in sync by hand if that file's dusk gradient ever changes.
const PLACEHOLDER_GRADIENT_TOP = '#3D4451'
const PLACEHOLDER_GRADIENT_BOTTOM = '#5C4A31'

// Lightweight, JS-free approximation of the real scene's dusk backdrop,
// shown instantly (no chunk to wait for) while the ~370KB gzip Hero3DScene
// chunk downloads/parses. Replaces the previous flat `bg-industrial-950`
// rect + bare spinner, which read as a blank/broken panel rather than a
// scene about to load. Crossfades into the real canvas once it mounts (see
// `sceneReady` below) rather than being replaced by a hard cut.
// `spinning=false` reuses this same panel as the ErrorBoundary fallback
// below — a static (non-animating) label reads as "this isn't coming", not
// as a load that's still in progress.
function ScenePlaceholder({ label, spinning = true }) {
  return (
    <div
      className="flex h-full w-full items-end justify-center pb-16 md:items-center md:pb-0"
      style={{
        background: `linear-gradient(to bottom, ${PLACEHOLDER_GRADIENT_TOP} 0%, ${PLACEHOLDER_GRADIENT_BOTTOM} 100%)`,
      }}
    >
      <div className="flex items-center gap-3 text-neutral-custom-400">
        {spinning && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-custom-400/30 border-t-ember-600" />
        )}
        <span className="text-sm">{label}</span>
      </div>
    </div>
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
  // within one frame if it isn't. R3F's `frameloop="always"` (default) keeps
  // rendering every frame — including the idle hotspot breathing animation
  // and OrbitControls' damping update — even while this section is scrolled
  // far out of view, which is wasted GPU/CPU work on a marketing page most
  // of whose length is below this hero. Gating `frameloop` between
  // 'always'/'never' via IntersectionObserver only pauses/resumes the R3F
  // render loop itself — it never touches `camera.position`, `OrbitControls`
  // target/damping state, or any of `CameraRig`'s transition refs, so a
  // paused-then-resumed scene continues exactly where it left off (same
  // reasoning a `display:none`'d canvas keeping its last-rendered pixels
  // does, not a re-mount). `rootMargin` pre-activates rendering a little
  // before the section actually enters the viewport so nothing visibly
  // "wakes up" mid-scroll.
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
  // to false afterward (no reason to fade the placeholder back in once the
  // real scene is up).
  const [sceneReady, setSceneReady] = useState(false)
  // Flips true if the scene still isn't ready after a generous delay — on a
  // slow connection the ~375KB gzip Hero3DScene chunk can take well beyond a
  // normal page-load budget, and without this the placeholder shows the
  // exact same "loading" spinner the whole time with no signal that
  // anything's different from a fast connection. Purely cosmetic (swaps the
  // placeholder's label); doesn't affect when the real scene actually
  // mounts.
  const [slowLoad, setSlowLoad] = useState(false)
  // Keeps the placeholder mounted slightly past the crossfade's own
  // transition duration so it's still there underneath during the fade
  // (rather than unmounting the instant `sceneReady` flips, which would
  // leave nothing to fade FROM), then removes it from the DOM entirely once
  // fully covered — avoids leaving an invisible `animate-spin` running
  // indefinitely underneath the opaque canvas.
  const [showPlaceholder, setShowPlaceholder] = useState(true)

  // Present whenever this renders inside RouteTransitionProvider (i.e.
  // always, on the public site) — `null` outside it (e.g. in isolation/
  // tests), in which case the registration effect below is a no-op, same
  // convention as `useRegisterRouteLoading`.
  const loadingSignal = useContext(LoadingSignalContext)
  // Guards the markLoading/markLoaded pairing below so it fires exactly
  // once per mount regardless of which of the three release paths —
  // Hero3DScene's onReady, the HEAVY_LOAD_MAX_WAIT_MS cap, or unmounting
  // before either — gets there first.
  const heavyLoadReleasedRef = useRef(false)
  function releaseHeavyLoad() {
    if (heavyLoadReleasedRef.current) return
    heavyLoadReleasedRef.current = true
    loadingSignal?.markLoaded()
  }

  useEffect(() => {
    diag3d('Building3DSection mounted')
  }, [])

  // Registers this mount's WebGL startup (shader compile + first real
  // frame) as a load the route-transition overlay should hold its reveal
  // open for — not intro-specific (deliberately the same generic
  // markLoading/markLoaded pairing RouteFallback's useRegisterRouteLoading
  // uses for lazy route chunks in App.jsx), so a same-tab nav back to the
  // home route gets the same protection as the first-load intro. Released
  // by whichever of onReady (below) / the cap timer (here) fires first; see
  // HEAVY_LOAD_MAX_WAIT_MS's own comment for why this cap is tighter than
  // the provider's general SAFETY_TIMEOUT_MS.
  useEffect(() => {
    if (!loadingSignal) return undefined
    heavyLoadReleasedRef.current = false
    loadingSignal.markLoading()
    diag3d('Building3DSection registered heavy 3D load with transition overlay')

    const capTimer = window.setTimeout(() => {
      if (heavyLoadReleasedRef.current) return
      diag3d('3D heavy-load cap hit (2.5s) — releasing transition hold early')
      releaseHeavyLoad()
    }, HEAVY_LOAD_MAX_WAIT_MS)

    return () => {
      window.clearTimeout(capTimer)
      releaseHeavyLoad()
    }
  }, [loadingSignal])

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
    if (!sceneReady) return undefined
    // Matches the crossfade's own 700ms transition (see the canvas layer's
    // className below) plus a small margin — unmounts the placeholder only
    // once it's fully covered, never mid-fade.
    const timeout = window.setTimeout(() => setShowPlaceholder(false), 800)
    return () => window.clearTimeout(timeout)
  }, [sceneReady])

  useEffect(() => {
    if (sceneReady) return undefined
    const timeout = window.setTimeout(() => {
      diag3d('3D scene slow-load threshold hit (12s, still not ready)')
      setSlowLoad(true)
    }, 12000)
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

  return (
    <section ref={sectionRef} className="relative min-h-screen overflow-hidden bg-industrial-950">
      <div className="absolute inset-0">
        {/* Placeholder layer: dusk-gradient approximation shown instantly,
            underneath the real canvas, so there's something to crossfade
            FROM instead of a hard cut the moment the 3D chunk mounts. Kept
            mounted a little past the fade's own duration (see
            `showPlaceholder` above), then removed entirely. */}
        {showPlaceholder && (
          <div className="absolute inset-0">
            <ScenePlaceholder label={t(slowLoad ? 'building3d.loadingSlow' : 'building3d.loading')} />
          </div>
        )}

        {/* Real scene layer: fades in once Hero3DScene's canvas has actually
            painted (`sceneReady`, set via the `onReady` callback below) —
            while the lazy chunk is still downloading/parsing, Suspense's
            fallback is `null` here (the placeholder above is already
            covering that) rather than a second, redundant spinner.
            ErrorBoundary is a separate layer from Suspense on purpose:
            Suspense only catches a thrown PROMISE (the loading state);
            a WebGL/Three.js runtime failure or a rejected asset load (e.g.
            a loader re-throwing a failed fetch as a render-time error) is a
            thrown ERROR, which only an error boundary catches — without one,
            that error would unmount this whole page, not just the 3D scene. */}
        <div
          className="absolute inset-0 transition-opacity duration-700 ease-out"
          style={{ opacity: sceneReady ? 1 : 0 }}
        >
          <ErrorBoundary
            // Treated the same as "ready" for crossfade/placeholder purposes
            // below — without this, `sceneReady`/`showPlaceholder` would
            // never flip (their only other trigger is Hero3DScene's own
            // `onReady`, which never fires if it crashed before mounting),
            // leaving this fallback stuck at opacity 0 behind a spinner that
            // spins forever instead of actually showing "unavailable".
            onError={(err) => {
              diag3d('3D scene ErrorBoundary caught (showing unavailable fallback)', err?.message)
              setSceneReady(true)
              releaseHeavyLoad()
            }}
            fallback={
              <div className="absolute inset-0">
                <ScenePlaceholder label={t('building3d.unavailable')} spinning={false} />
              </div>
            }
          >
            <Suspense fallback={null}>
              <Hero3DScene
                ref={sceneRef}
                onHotspotChange={setActive}
                active={inView && tabVisible}
                onReady={() => {
                  diag3d('3D scene onReady (first frame rendered, shaders compiled)')
                  setSceneReady(true)
                  releaseHeavyLoad()
                }}
              />
            </Suspense>
          </ErrorBoundary>
        </div>
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

      {!active && (
        <p className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full bg-industrial-950/80 px-4 py-2 text-xs text-neutral-custom-400 md:left-6 md:translate-x-0">
          {t('building3d.hint')}
        </p>
      )}

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
