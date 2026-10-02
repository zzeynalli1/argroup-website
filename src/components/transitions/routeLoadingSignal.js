import { createContext, useContext, useEffect } from 'react'

export const LoadingSignalContext = createContext(null)

/**
 * Call from any component that wants to tell the transition overlay
 * "a route's content isn't ready yet" — used by App.jsx's Suspense
 * fallback so a slow lazy chunk keeps the branded overlay held instead of
 * revealing to a half-loaded page. Safe to call outside the provider (no-op).
 */
export function useRegisterRouteLoading() {
  const ctx = useContext(LoadingSignalContext)
  useEffect(() => {
    if (!ctx) return undefined
    ctx.markLoading()
    return () => ctx.markLoaded()
  }, [ctx])
}
