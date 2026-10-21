import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoute from './components/admin/ProtectedRoute'
import RouteTransitionProvider from './components/transitions/RouteTransitionProvider'
import { useRegisterRouteLoading } from './components/transitions/routeLoadingSignal'
import { useHeavyContentPreload } from './components/transitions/heavyContentGate'
import { detectStrongDevice } from './lib/deviceCapability'
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
// existing spinner/accent treatment rather than a generic full-screen
// overlay.
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

// Starts downloading Hero3DScene's chunk (1.26MB raw / ~375KB gzip, by far
// the heaviest single chunk on the site) the instant the "/" route is
// requested AND the heavy-content PRELOAD gate is open (see
// heavyContentGate.js's `useHeavyContentPreload` — deliberately the earlier
// of its two gates: opens the moment the intro STARTS covering, not once it
// finishes, since a background network fetch doesn't compete for the main
// thread the way Building3DSection's actual Canvas/WebGL MOUNT does — that
// one still waits for the later `useHeavyContentGate` signal). On every
// other case (reduced motion, admin routes, intro already shown this
// session) this gate is already open at mount, so the fetch fires
// immediately, same as before this split existed. Still ahead of
// Building3DSection's own lazy()+Suspense, which otherwise only fires once
// Home has loaded AND mounted AND rendered down to that point, a fully
// sequential waterfall. Needs to be a child of RouteTransitionProvider (not
// a sibling, which is where this used to sit) to read either gate from
// context at all. Scoped to the home route only — no other route pays for
// any of this.
//
// Also gated on `detectStrongDevice()` (same check Building3DSection uses
// to decide whether the scene auto-mounts at full quality) — a weak device
// still eventually loads the scene itself (in lowPower mode, later and on
// its own schedule, see Building3DSection), but shouldn't ALSO pay for this
// earlier, purely speculative background fetch racing ahead of that
// schedule on a device/connection this heuristic has already flagged as
// constrained.
function HeroScenePrefetch() {
  const { pathname } = useLocation()
  const canPreloadHeavyContent = useHeavyContentPreload()
  const [isStrongDevice] = useState(detectStrongDevice)
  useEffect(() => {
    if (pathname !== '/' || !canPreloadHeavyContent || !isStrongDevice) return

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
  }, [pathname, canPreloadHeavyContent, isStrongDevice])
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
