import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { I18nProvider } from './lib/i18n/I18nContext'
import { AuthProvider } from './lib/auth/AuthContext'
import { detectLowPower } from './lib/deviceCapability'
import { prefetchHeroHdri } from './lib/heroHdri'

// Starts Hero3DScene's chunk (+ HDRI) download the instant this module runs
// on the homepage — earlier than App.jsx's own `HeroScenePrefetch`, which
// can only fire from a `useEffect` after React has mounted/committed the
// whole app tree first. Dynamic import()/`prefetchHeroHdri()` are both
// deduped (module loader / module-scope promise cache), so this is a pure
// head start, not a duplicate request; HeroScenePrefetch still runs too as
// the fallback for any other route that navigates to "/" client-side later
// in the session. HDRI itself is skipped here on mobile/weak-hardware
// devices (`detectLowPower`) — Hero3DScene never loads an environment map
// for those anyway (see its own `lowPower`-gated HDRI skip), so fetching the
// bytes here would just waste mobile data/bandwidth for nothing.
if (window.location.pathname === '/') {
  import('./components/3d/Hero3DScene').catch(() => {})
  if (!detectLowPower()) {
    prefetchHeroHdri().catch(() => {})
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </I18nProvider>
  </StrictMode>,
)
