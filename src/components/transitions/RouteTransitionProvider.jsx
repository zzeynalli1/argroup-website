import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
import RouteTransitionOverlay from './RouteTransitionOverlay'
import { LoadingSignalContext } from './routeLoadingSignal'
import { diag3d } from '../../lib/diag3d'

// Minimum time to stay in the "holding" phase (planes at rest) before a
// fast-loading destination is allowed to reveal. The logo/seam in
// RouteTransitionOverlay are driven directly by `covered`, with their own
// delay, and finish appearing right around when `enter` ends — so this
// value is just the readable/visible pause *after* that (nav ≈200ms,
// intro ≈100ms), not logoDelay+logoDuration itself. intro's design budget
// (enter+hold+reveal ≈530ms) sits under its ~550-700ms target to leave
// margin for first-mount overhead (Header/Footer/i18n initializing for the
// first time) that isn't part of the animation itself but is still part of
// what the visitor perceives before the overlay clears. A slow (lazy-chunk)
// navigation naturally holds longer than this floor — see tryAdvanceRef.
const MIN_HOLD_MS = { nav: 200, intro: 60 }
// Hard cap so a stalled/failed chunk load can never strand the user behind
// the overlay — no fake progress, just a ceiling.
const SAFETY_TIMEOUT_MS = 8000
// Separate, much tighter ceiling for 'covering' and 'revealing' — unlike
// 'holding' (legitimately waiting on a network/chunk load), these two are
// pure CSS/framer-motion animations with fixed, short real durations
// (≤400ms for the slowest 'nav' variant). They depend entirely on
// `onAnimationComplete` firing, which runs on requestAnimationFrame — a
// backgrounded tab (browsers suspend rAF callbacks when the tab isn't
// visible), an interrupted/replaced animation that drops its own
// completion callback, or any other framer-motion edge case can leave
// that callback never firing, with nothing else to move `phase` forward.
// 3s is roughly 7x the slowest real animation, so a normal transition
// never comes close to tripping this; only a genuinely stuck one does.
const COVER_REVEAL_WATCHDOG_MS = 3000
const SESSION_INTRO_KEY = 'ar-intro-shown'

function resolveInternalNavigation(event) {
  if (event.defaultPrevented || event.button !== 0) return null
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null

  const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null
  if (!anchor) return null
  if (anchor.target && anchor.target !== '_self') return null
  if (anchor.hasAttribute('download')) return null
  if ((anchor.getAttribute('rel') || '').includes('external')) return null

  const href = anchor.getAttribute('href')
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return null

  let url
  try {
    url = new URL(href, window.location.href)
  } catch {
    return null
  }
  if (url.origin !== window.location.origin) return null
  return url
}

export default function RouteTransitionProvider({ children }) {
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()

  const [phase, setPhase] = useState('idle') // idle | covering | holding | revealing
  const [instant, setInstant] = useState(false)
  const [variant, setVariant] = useState('nav')

  const phaseRef = useRef(phase)
  useEffect(() => {
    phaseRef.current = phase
    diag3d('transition phase ->', phase)
  }, [phase])

  const pendingNavRef = useRef(null)
  const loadingCountRef = useRef(0)
  const holdStartRef = useRef(0)
  const minHoldMsRef = useRef(MIN_HOLD_MS.nav)
  const minHoldTimerRef = useRef(null)
  const safetyTimerRef = useRef(null)

  // The recursive setTimeout below calls through this ref (rather than the
  // function's own name) to avoid a self-reference-before-declaration
  // issue; the ref is populated in an effect, never during render.
  const tryAdvanceRef = useRef(() => {})
  const tryAdvanceFromHolding = useCallback(() => {
    if (phaseRef.current !== 'holding') return
    if (loadingCountRef.current > 0) return
    const elapsed = Date.now() - holdStartRef.current
    if (elapsed < minHoldMsRef.current) {
      clearTimeout(minHoldTimerRef.current)
      minHoldTimerRef.current = setTimeout(() => tryAdvanceRef.current(), minHoldMsRef.current - elapsed)
      return
    }
    clearTimeout(safetyTimerRef.current)
    setPhase('revealing')
  }, [])
  useEffect(() => {
    tryAdvanceRef.current = tryAdvanceFromHolding
  }, [tryAdvanceFromHolding])

  useEffect(() => {
    if (phase !== 'holding') return undefined
    // `markLoaded()` calling `tryAdvanceRef.current()` the instant a lazy
    // route's Suspense fallback unmounts is the fast path for most
    // navigations — but that unmount is driven by whenever the chunk's
    // import() promise resolves, a completely separate timeline from this
    // covering->holding transition (driven by RouteTransitionOverlay's own
    // animation-complete callback). If the chunk finishes loading in the
    // brief window before `phase` has actually become 'holding' yet, that
    // call is a no-op (see the phase check in `tryAdvanceFromHolding`) and
    // is otherwise lost — the overlay would then only ever clear via the
    // SAFETY_TIMEOUT_MS ceiling below, which reads as a multi-second stall
    // on an otherwise-instant load. Polling here instead of a single
    // delayed check makes this self-heal within one tick of whichever
    // condition (loading done, min hold elapsed) is still pending, instead
    // of depending on the exact order two independent timelines resolve in.
    const pollInterval = setInterval(() => tryAdvanceRef.current(), 100)
    safetyTimerRef.current = setTimeout(() => {
      diag3d('WATCHDOG: holding stuck (slow/stalled chunk load), forcing revealing', {
        loadingCount: loadingCountRef.current,
      })
      setPhase('revealing')
    }, SAFETY_TIMEOUT_MS)
    return () => {
      clearInterval(pollInterval)
      clearTimeout(safetyTimerRef.current)
    }
  }, [phase])

  const markLoading = useCallback(() => {
    loadingCountRef.current += 1
    diag3d('route chunk loading (Suspense fallback mounted)', { count: loadingCountRef.current })
  }, [])
  const markLoaded = useCallback(() => {
    loadingCountRef.current = Math.max(0, loadingCountRef.current - 1)
    diag3d('route chunk resolved (Suspense fallback unmounted)', { count: loadingCountRef.current })
    tryAdvanceRef.current()
  }, [])
  const loadingSignal = useMemo(() => ({ markLoading, markLoaded }), [markLoading, markLoaded])

  // Click-triggered navigation: cover the current page first, and only
  // navigate once fully covered — this is what prevents any flash of the
  // outgoing/incoming page swapping mid-animation.
  const startCover = useCallback((to) => {
    pendingNavRef.current = to
    minHoldMsRef.current = MIN_HOLD_MS.nav
    setInstant(false)
    setVariant('nav')
    setPhase('covering')
  }, [])

  useEffect(() => {
    function onClick(event) {
      const url = resolveInternalNavigation(event)
      if (!url) return

      const currentPath = window.location.pathname
      const targetPath = url.pathname
      if (targetPath === currentPath) return // same-page: anchors, re-clicked active nav item, etc.
      if (targetPath.startsWith('/admin') || currentPath.startsWith('/admin')) return
      if (phaseRef.current !== 'idle') return // already transitioning — let the plain nav happen

      event.preventDefault()
      startCover(`${targetPath}${url.search}${url.hash}`)
    }

    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [startCover])

  // Back/forward: the browser has already changed the URL by the time
  // popstate fires, so we can't cover-then-navigate like the click path.
  // Instead we mount the overlay already fully covered ("snap") in the same
  // render pass React uses to reflect the new route, so nothing is ever
  // shown unmasked — see the `instant` prop on RouteTransitionOverlay.
  useEffect(() => {
    function onPopState() {
      if (phaseRef.current !== 'idle') return
      minHoldMsRef.current = MIN_HOLD_MS.nav
      setInstant(true)
      setVariant('nav')
      setPhase('covering')
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // The "snap" (instant) cover has no entrance animation to wait for, so
  // there's no onAnimationComplete to drive off of — advance on the next
  // frame instead, once the covered state has actually painted.
  useEffect(() => {
    if (phase !== 'covering' || !instant) return undefined
    const raf = requestAnimationFrame(() => {
      holdStartRef.current = Date.now()
      setPhase('holding')
    })
    return () => cancelAnimationFrame(raf)
  }, [phase, instant])

  const handleCoverAnimationComplete = useCallback(() => {
    if (phaseRef.current !== 'covering' || instant) return
    if (pendingNavRef.current) {
      navigate(pendingNavRef.current)
      pendingNavRef.current = null
    }
    holdStartRef.current = Date.now()
    setPhase('holding')
  }, [instant, navigate])

  const handleOpenAnimationComplete = useCallback(() => {
    if (phaseRef.current !== 'revealing') return
    diag3d('overlay unmount (revealing -> idle)')
    setPhase('idle')
  }, [])

  // Watchdogs for the two animation-callback-dependent phases — see
  // COVER_REVEAL_WATCHDOG_MS above for why these exist and why 3s is safe.
  // Each just invokes the exact same handler the real `onAnimationComplete`
  // would have called; if that already fired first, `phase` has already
  // moved on by the time this timer would run, so the handler's own
  // `phaseRef.current !== '<phase>'` guard makes it a no-op — no risk of a
  // double-fire in the normal (fast) case. The `instant` cover path has its
  // own separate rAF-driven effect above and never reaches 'covering' long
  // enough to need this.
  useEffect(() => {
    if (phase !== 'covering' || instant) return undefined
    const watchdog = setTimeout(() => {
      diag3d('WATCHDOG: covering stuck, forcing holding')
      handleCoverAnimationComplete()
    }, COVER_REVEAL_WATCHDOG_MS)
    return () => clearTimeout(watchdog)
  }, [phase, instant, handleCoverAnimationComplete])

  useEffect(() => {
    if (phase !== 'revealing') return undefined
    const watchdog = setTimeout(() => {
      diag3d('WATCHDOG: revealing stuck, forcing idle')
      handleOpenAnimationComplete()
    }, COVER_REVEAL_WATCHDOG_MS)
    return () => clearTimeout(watchdog)
  }, [phase, handleOpenAnimationComplete])

  // First paint of the site in this tab: play the richer one-off intro
  // instead of a normal nav transition, then never again this session.
  //
  // The sessionStorage *write* happens inside the rAF callback, not the
  // synchronous part of the effect — in StrictMode's dev-only
  // mount→cleanup→mount double-invoke, the first pass's rAF is cancelled by
  // its cleanup before it ever fires, so only the surviving second mount's
  // rAF actually commits anything. Writing synchronously up front (or
  // guarding with a ref that's set on the first pass) would mark the intro
  // "shown" on the pass that gets thrown away, and the real mount would
  // then see it as already-shown and skip it — no intro would ever play.
  useEffect(() => {
    // /admin routes (including /admin/login) skip the branded intro entirely
    // — it's a marketing flourish for the public site's first paint, and on
    // admin it only adds a ~600ms delay in front of the login form with no
    // benefit. Deliberately doesn't write SESSION_INTRO_KEY here: a later
    // same-tab visit to a public route should still get the intro once.
    if (window.location.pathname.startsWith('/admin')) return undefined

    let alreadyShown = false
    try {
      alreadyShown = sessionStorage.getItem(SESSION_INTRO_KEY) === '1'
    } catch {
      // sessionStorage unavailable — leave alreadyShown false, intro just replays
    }
    if (alreadyShown) return undefined

    const raf = requestAnimationFrame(() => {
      try {
        sessionStorage.setItem(SESSION_INTRO_KEY, '1')
      } catch {
        // ignore (private mode / storage disabled) — intro just replays next time
      }
      minHoldMsRef.current = MIN_HOLD_MS.intro
      setInstant(false)
      setVariant('intro')
      setPhase('covering')
    })
    return () => cancelAnimationFrame(raf)
  }, [])

  const active = phase !== 'idle'
  const covered = phase === 'covering' || phase === 'holding'

  return (
    <LoadingSignalContext.Provider value={loadingSignal}>
      {children}
      {active && (
        <RouteTransitionOverlay
          covered={covered}
          instant={instant}
          variant={variant}
          reducedMotion={!!reducedMotion}
          onCoverAnimationComplete={handleCoverAnimationComplete}
          onOpenAnimationComplete={handleOpenAnimationComplete}
        />
      )}
    </LoadingSignalContext.Provider>
  )
}
