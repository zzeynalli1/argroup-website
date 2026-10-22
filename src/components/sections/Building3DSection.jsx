import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useTranslation } from '../../lib/i18n/useTranslation'
import ErrorBoundary from '../ui/ErrorBoundary'
import { detectLowPower } from '../../lib/deviceCapability'
import { diag3d } from '../../lib/diag3d'
import { useHeaderHeight } from '../../hooks/useHeaderHeight'

// Three.js only loads once this section is actually rendered, keeping it out
// of the initial bundle (see CLAUDE.md perf note on the earlier 1.37MB hero).
const Hero3DScene = lazy(() =>
  import('../3d/Hero3DScene').then((mod) => {
    diag3d('3D chunk resolved (Building3DSection lazy)')
    return mod
  })
)

// Small, textless loading indicator shown over the section's light
// (`bg-base-50`) background while the scene is still compiling/mounting —
// deliberately NOT a full-backdrop placeholder: there's nothing here that
// needs to visually resemble the eventual scene, just a sign that something
// is happening.
function LoadingSpinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-industrial-950/15 border-t-ember-600" />
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
      // Mobile (<md): true bottom sheet — capped at 60svh (not 80vh: the
      // building above it needs to stay visible, not just a sliver), with
      // bottom padding that clears Safari's own bottom chrome via
      // `env(safe-area-inset-bottom)`. `md:` and up: unchanged, the
      // existing right-side floating panel.
      className="fixed inset-x-0 bottom-0 z-50 max-h-[60svh] overflow-y-auto rounded-t-2xl border-t border-white/10 bg-industrial-950 px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 md:absolute md:inset-x-auto md:top-6 md:right-6 md:max-h-[calc(100vh-3rem)] md:w-80 md:rounded-2xl md:border md:px-6 md:py-6"
    >
      {/* Drag-handle bar — bottom-sheet-only affordance, hidden on the `md`+
          floating panel. */}
      <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/20 md:hidden" />

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
  // Real measured <header> height (see hooks/useHeaderHeight.js) — null
  // until the first measurement lands, in which case the mobile text
  // block's fallback Tailwind class (below) covers that one frame.
  const headerHeight = useHeaderHeight()
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
  // something. Drives: the canvas crossfade below, the section/heading
  // light-to-dark theme swap, and the hint text's reveal. Deliberately
  // never reset back to false afterward.
  const [sceneReady, setSceneReady] = useState(false)

  // One-time-at-mount device heuristic (see lib/deviceCapability.js) —
  // whether Hero3DScene should render in its cheaper `lowPower` mode
  // (skips post-processing/shadows, pins dpr to 1x). Purely a render-
  // quality switch now — every device mounts the scene on the same
  // schedule (immediately on mount, in parallel with the intro overlay —
  // see Hero3DScene below), lowPower or not.
  const [isLowPower] = useState(detectLowPower)

  // Hotspot-click -> InfoPanel-open timing diagnostic (see Hero3DScene.jsx's
  // own `diag3d('3D hotspot clicked', ...)`) — records the moment a click
  // actually arrives here (synchronous with the click, not delayed by
  // React's own state-update batching), then the effect below measures from
  // it once this panel has actually painted.
  const hotspotClickTimeRef = useRef(null)

  function handleHotspotChange(hotspot) {
    if (hotspot) hotspotClickTimeRef.current = performance.now()
    setActive(hotspot)
  }

  useEffect(() => {
    diag3d('Building3DSection mounted')
  }, [])

  useEffect(() => {
    if (!active || hotspotClickTimeRef.current == null) return undefined
    const clickTime = hotspotClickTimeRef.current
    let raf1 = 0
    let raf2 = 0
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        diag3d('3D hotspot click -> InfoPanel open (ms)', Math.round(performance.now() - clickTime))
        hotspotClickTimeRef.current = null
      })
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [active])

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
    <section
      ref={sectionRef}
      // Mobile (<lg): plain stacked flow (text block, then the 3D area,
      // then the hint below it) sized to its own content — NOT
      // `min-h-screen`, which used to force the whole viewport height on a
      // layout that no longer needs it. `lg`+: unchanged, the original
      // full-bleed absolute-overlay composition.
      className={`relative flex flex-col overflow-hidden transition-colors duration-700 lg:block lg:min-h-screen ${
        sceneReady ? 'bg-industrial-950' : 'bg-base-50'
      }`}
    >
      {/* Mobile text block — normal document flow (not absolutely
          overlaid), always the "ready" dark styling regardless of
          `sceneReady` per the mobile spec (no light/dark swap down here;
          the loading spinner behind it still shows against the section's
          own `bg-base-50` while loading). `pt-[...]` clears the fixed
          header (~112px unscrolled, see Header.jsx) + 24px + the device's
          own safe-area inset, so the heading never starts under the header
          OR a notch. Hidden entirely from `lg` up, where the original
          absolute-overlay text block (below) takes over. */}
      <div
        className="relative z-10 bg-industrial-950 px-6 pb-3 pt-[calc(136px+env(safe-area-inset-top))] lg:hidden"
        // Overrides the Tailwind fallback above once the real header height
        // is measured (see useHeaderHeight) — inline style always wins over
        // a class selector regardless of specificity, so this is safe to
        // set unconditionally once non-null without fighting the class.
        style={
          headerHeight != null
            ? { paddingTop: `calc(${headerHeight}px + 32px + env(safe-area-inset-top))` }
            : undefined
        }
      >
        <span className="block h-1 w-16 bg-ember-600" />
        {/* Tighter than the lg+ overlay heading below (text-2xl/mt-4 here
            vs text-3xl+/mt-6 there) — this stacked mobile layout has to fit
            header-clearance + this block + the 3D area within a single
            Safari "small viewport" screen (no scroll) on real phones, see
            the hint below; the lg+ column has no such budget constraint. */}
        <h1 className="mt-3 font-heading text-xl font-bold text-base-50">
          {t('building3d.titleLine1')}
          <br />
          <span className="text-ember-600">{t('building3d.titleLine2')}</span>
        </h1>
        <p className="mt-1 text-xs text-neutral-custom-400">{t('building3d.subtitle')}</p>
      </div>

      {/* 3D area. Mobile: a fixed ~50svh band (not the full viewport) in
          normal flow, so the text above and the hint below both get their
          own real space instead of floating over the canvas — sized so
          header-clearance + the tightened text block above + this band fit
          within a single Safari "small viewport" screen (no scroll needed)
          on both iPhone SE and iPhone 13, verified via Playwright. `lg`+:
          unchanged, `absolute inset-0` filling the whole section as
          before. */}
      <div
        className="relative h-[45svh] w-full shrink-0 lg:absolute lg:inset-0 lg:h-auto lg:w-auto"
        style={{ touchAction: 'pan-y' }}
      >
        {/* Soft fade from the text block's own dark bg into the scene —
            mobile only; `lg`+ has no text block directly above this area
            (it's an absolute overlay instead), so there's nothing to blend
            from. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-10 bg-gradient-to-b from-industrial-950 to-transparent lg:hidden" />

        {/* Loading layer: the section's own light background (see the
            `<section>` className above) plus a small textless spinner —
            shown until the real canvas has painted its first frame. No
            placeholder image: unlike the previous poster-first approach,
            this scene now always mounts immediately on mount, so there's
            nothing to bridge a long wait with. */}
        {!sceneReady && <LoadingSpinner />}

        {/* Real scene layer: mounts immediately, in parallel with the
            first-load intro overlay (no longer waits for it) — fades in
            once Hero3DScene's canvas has actually painted (`sceneReady`,
            set via the `onReady` callback below). ErrorBoundary is a
            separate layer from Suspense on purpose: Suspense only catches a
            thrown PROMISE (the loading state); a WebGL/Three.js runtime
            failure or a rejected asset load (e.g. a loader re-throwing a
            failed fetch as a render-time error) is a thrown ERROR, which
            only an error boundary catches — without one, that error would
            unmount this whole page, not just the 3D scene. */}
        <div
          className="absolute inset-0 transition-opacity duration-700 ease-out"
          style={{ opacity: sceneReady ? 1 : 0, touchAction: 'pan-y' }}
        >
          <ErrorBoundary
            // Treated the same as "ready" for crossfade/theme-swap purposes
            // below — without this, `sceneReady` would never flip (its only
            // other trigger is Hero3DScene's own `onReady`, which never
            // fires if it crashed before mounting), leaving the spinner
            // spinning forever instead of actually showing "unavailable".
            onError={(err) => {
              diag3d('3D scene ErrorBoundary caught (showing unavailable fallback)', err?.message)
              setSceneReady(true)
            }}
            fallback={
              <div className="absolute inset-0 flex items-center justify-center bg-base-50">
                <span className="text-sm text-industrial-950">{t('building3d.unavailable')}</span>
              </div>
            }
          >
            <Suspense fallback={null}>
              <Hero3DScene
                ref={sceneRef}
                onHotspotChange={handleHotspotChange}
                active={inView && tabVisible}
                lowPower={isLowPower}
                onReady={() => {
                  diag3d('3D scene onReady (first frame rendered, shaders compiled)')
                  setSceneReady(true)
                }}
              />
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* Mobile hint — absolutely positioned INSIDE the 3D area itself
            (not below it in normal flow, where it previously landed below
            the fold behind Safari's own bottom chrome before that chrome
            collapses on scroll) and anchored off the real bottom safe-area
            inset rather than fixed padding, so it stays clear of Safari's
            bottom bar on iPhones with a home indicator. `pointer-events-none`
            since it overlays the canvas — must never swallow a touch meant
            for the scene/hotspots underneath. Hidden from `lg` up, where the
            original overlaid pill (further below) takes over. */}
        {sceneReady && !active && (
          <p
            className="pointer-events-none absolute inset-x-0 z-20 px-6 text-center text-xs text-neutral-custom-400 lg:hidden"
            style={{ bottom: 'calc(16px + env(safe-area-inset-bottom))' }}
          >
            {t('building3d.hintTouch')}
          </p>
        )}
      </div>

      {/* Desktop (`lg`+) text zone — unchanged from before: a left-anchored
          ~30-35%-wide column, vertically centered, absolutely overlaid over
          the canvas, leaving the right side clear for the building once
          `Hero3DScene`'s view-offset shifts it there (see `CameraFrameShift`
          in Hero3DScene.jsx — this column width and that shift were tuned
          together). Text color swaps from dark-on-light (loading, matches
          the section's own `bg-base-50`) to light-on-dark (ready, matches
          the real scene's dusk backdrop) in lockstep with the section
          background above. Hidden below `lg`, where the stacked mobile text
          block above takes over. */}
      <div className="pointer-events-none absolute inset-0 z-10 hidden lg:flex lg:items-center lg:px-12 xl:px-16">
        <div className="max-w-xl lg:-translate-y-[60%] lg:w-[34%] lg:max-w-[460px] 2xl:max-w-[500px]">
          <span className="block h-1 w-16 bg-ember-600" />
          <h1
            className={`mt-6 font-heading text-3xl font-bold transition-colors duration-700 md:text-4xl ${
              sceneReady ? 'text-base-50' : 'text-industrial-950'
            }`}
          >
            {t('building3d.titleLine1')}
            <br />
            <span className="text-ember-600">{t('building3d.titleLine2')}</span>
          </h1>
          <p
            className={`mt-4 transition-colors duration-700 ${
              sceneReady ? 'text-neutral-custom-400' : 'text-neutral-custom-600'
            }`}
          >
            {t('building3d.subtitle')}
          </p>
        </div>
      </div>

      {/* Desktop (`lg`+) hint pill — unchanged from before, overlaid on the
          canvas. Hidden below `lg`, where the stacked mobile hint above
          takes over. */}
      {sceneReady && !active && (
        <p className="pointer-events-none absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 rounded-full bg-industrial-950/80 px-4 py-2 text-xs text-neutral-custom-400 lg:block lg:left-6 lg:translate-x-0">
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
