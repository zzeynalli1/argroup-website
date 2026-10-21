import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { I18nProvider } from './lib/i18n/I18nContext'
import { AuthProvider } from './lib/auth/AuthContext'

// Starts Hero3DScene's chunk (+ HDRI) download the instant this module runs
// on the homepage — earlier than App.jsx's own `HeroScenePrefetch`, which
// can only fire from a `useEffect` after React has mounted/committed the
// whole app tree first. Dynamic import()/fetch are both deduped by the
// module loader/HTTP cache, so this is a pure head start, not a duplicate
// request; HeroScenePrefetch still runs too as the fallback for any other
// route that navigates to "/" client-side later in the session.
if (window.location.pathname === '/') {
  import('./components/3d/Hero3DScene').catch(() => {})
  fetch('/hdr/potsdamer_platz_512.hdr', { credentials: 'omit' }).catch(() => {})
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
