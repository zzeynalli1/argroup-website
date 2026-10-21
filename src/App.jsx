import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoute from './components/admin/ProtectedRoute'
import RouteTransitionProvider from './components/transitions/RouteTransitionProvider'
import { useRegisterRouteLoading } from './components/transitions/routeLoadingSignal'
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

// Hero3DScene's own HDRI path — kept here, not imported, so importing it
// doesn't pull the whole Three.js/R3F chunk into this eagerly-bundled file.
const HERO_SCENE_HDRI_URL = '/hdr/potsdamer_platz_512.hdr'

// Starts downloading Hero3DScene's chunk (~360KB gzip, the heaviest single
// chunk on the site) AND its HDRI the instant the "/" route is requested —
// unconditional, no gate/wait on the intro or anything else, just the
// earliest possible start. This lives here (App.jsx, part of the main
// eagerly-loaded bundle), not inside Building3DSection, specifically so it
// fires IN PARALLEL with the Home route's own lazy chunk download instead
// of after it: Building3DSection only exists once Home's chunk has already
// loaded, so its own lazy()+Suspense import of Hero3DScene is one full
// network round-trip later than this. Fire-and-forget — a real failure is
// handled later by Building3DSection's own lazy()+Suspense+ErrorBoundary
// when it imports the same chunk/asset for real.
function HeroScenePrefetch() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (pathname !== '/') return
    import('./components/3d/Hero3DScene').catch(() => {})
    fetch(HERO_SCENE_HDRI_URL, { credentials: 'omit' }).catch(() => {})
  }, [pathname])
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
