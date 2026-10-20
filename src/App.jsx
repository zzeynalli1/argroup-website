import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoute from './components/admin/ProtectedRoute'
import RouteTransitionProvider from './components/transitions/RouteTransitionProvider'
import { useRegisterRouteLoading } from './components/transitions/routeLoadingSignal'
import { useHeavyContentPreload } from './components/transitions/heavyContentGate'
import { diag3d } from './lib/diag3d'
// Every page (including Home) is its own lazy chunk, so visiting any one
// route never downloads JS for routes the user hasn't navigated to yet —
// this keeps non-public routes like /admin/login from paying for Home's
// section bundle.
const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const ServicesPage = lazy(() => import('./pages/ServicesPage'))
const ServiceDetailPage = lazy(() => import('./pages/ServiceDetailPage'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const Products = lazy(() => import('./pages/Products'))
const Contact = lazy(() => import('./pages/Contact'))
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminShell = lazy(() => import('./pages/admin/AdminShell'))

// Minimal route-transition fallback — sized so swapping in the real page
// doesn't visibly collapse/expand the layout, styled to match the site's
// existing loading-state pattern (see Building3DSection's ScenePlaceholder)
// rather than a generic full-screen spinner.
function RouteFallback() {
  // Tells RouteTransitionProvider a lazy chunk is still loading, so the
  // branded overlay (when one is covering the screen for this navigation)
  // holds instead of revealing to this fallback. If no overlay is active
  // (e.g. a direct URL load straight into a lazy route) this is a no-op and
  // the fallback below renders as normal.
  useRegisterRouteLoading()
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center bg-base-50">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-custom-400/30 border-t-ember-600" />
    </div>
  )
}

// Path must match whatever Hero3DScene.jsx actually loads via drei's
// `<Environment files={...} />` — kept here, not imported, for the same
// reason Building3DSection.jsx duplicates BACKDROP_TOP/BOTTOM rather than
// importing Hero3DScene.jsx (importing anything from that module would
// pull the whole Three.js/R3F chunk into this eagerly-bundled file).
// Update this if that file ever changes (e.g. a smaller/renamed HDR, or
// dropped entirely in favor of drei Lightformers with no file at all — in
// which case delete this constant and the fetch() below too).
const HERO_SCENE_HDRI_URL = '/hdr/potsdamer_platz_512.hdr'

// Starts downloading Hero3DScene's chunk (1.26MB raw / ~375KB gzip, by far
// the heaviest single chunk on the site) AND its HDRI environment map the
// instant the "/" route is requested AND the heavy-content PRELOAD gate is
// open (see heavyContentGate.js's `useHeavyContentPreload` — deliberately
// the earlier of its two gates: opens the moment the intro STARTS covering,
// not once it finishes, since a background network fetch doesn't compete
// for the main thread the way Building3DSection's actual Canvas/WebGL MOUNT
// does — that one still waits for the later `useHeavyContentGate` signal).
// On every other case (reduced motion, admin routes, intro already shown
// this session) this gate is already open at mount, so both fetches fire
// immediately, same as before this split existed. Still ahead of
// Building3DSection's own lazy()+Suspense, which otherwise only fires once
// Home has loaded AND mounted AND rendered down to that point, a fully
// sequential waterfall. Needs to be a child of RouteTransitionProvider (not
// a sibling, which is where this used to sit) to read either gate from
// context at all. Scoped to the home route only — no other route pays for
// any of this.
function HeroScenePrefetch() {
  const { pathname } = useLocation()
  const canPreloadHeavyContent = useHeavyContentPreload()
  useEffect(() => {
    if (pathname !== '/' || !canPreloadHeavyContent) return

    diag3d('3D chunk prefetch requested')
    // Fire-and-forget: Building3DSection's own lazy()+Suspense+ErrorBoundary
    // is what actually handles a real failure (shows the "unavailable"
    // placeholder) once it imports the same specifier later. This call just
    // needs to not produce an unhandled promise rejection if the network
    // request itself fails before that — it was doing exactly that before
    // this .catch was added.
    import('./components/3d/Hero3DScene')
      .then(() => diag3d('3D chunk prefetch resolved'))
      .catch((err) => diag3d('3D chunk prefetch failed (non-fatal, Building3DSection retries)', err?.message))

    // Separate from the chunk import above — this is a plain network
    // fetch, not a module load, so a failure here is genuinely harmless:
    // Hero3DScene's own <Environment> loads this same URL again later
    // through its normal (Suspense-wrapped) loader regardless of whether
    // this warm-up succeeded, just without the head start.
    diag3d('3D HDRI prefetch requested')
    fetch(HERO_SCENE_HDRI_URL, { credentials: 'omit' })
      .then(() => diag3d('3D HDRI prefetch resolved'))
      .catch((err) => diag3d('3D HDRI prefetch failed (non-fatal, Environment retries)', err?.message))
  }, [pathname, canPreloadHeavyContent])
  return null
}

// Persistent Header/Footer around every public page — kept as its own
// layout route so the admin routes below can render without them.
function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}

/**
 * Top-level app shell: router around the routed page content. Public
 * routes render inside PublicLayout (Header/Footer); /admin/* is a
 * separate route tree with its own shell and no public chrome.
 */
export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <RouteTransitionProvider>
        <HeroScenePrefetch />
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/services/:slug" element={<ServiceDetailPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/products" element={<Products />} />
            <Route path="/contact" element={<Contact />} />
          </Route>

          <Route
            path="/admin/login"
            element={
              <Suspense fallback={<RouteFallback />}>
                <AdminLogin />
              </Suspense>
            }
          />
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={<RouteFallback />}>
                <ProtectedRoute>
                  <AdminShell />
                </ProtectedRoute>
              </Suspense>
            }
          />
        </Routes>
      </RouteTransitionProvider>
    </BrowserRouter>
  )
}
