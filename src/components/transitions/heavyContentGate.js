import { createContext, useContext } from 'react'

export const HeavyContentGateContext = createContext(true)

/**
 * True once it's safe to start loading/mounting heavy same-viewport page
 * content — right now just Building3DSection's Hero3DScene (lazy import +
 * Canvas/WebGL mount). False only for the narrow window where the
 * first-load branded intro (see RouteTransitionProvider) is about to play
 * or is actively playing, so the intro's own tight ~0.6-0.8s timing budget
 * never has to compete with WebGL/shader setup for the main thread — see
 * that provider's `heavyContentGateOpen` state for exactly which cases
 * start already open (reduced motion, admin routes, intro already shown
 * this session) versus which wait for the intro's reveal to finish.
 * Defaults to `true` so anything using this outside the provider (tests,
 * Storybook-style isolation) never gates on a signal that will never fire.
 */
export function useHeavyContentGate() {
  return useContext(HeavyContentGateContext)
}
