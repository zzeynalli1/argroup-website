import { createContext, useContext } from 'react'

export const HeavyContentGateContext = createContext(true)
export const HeavyContentPreloadContext = createContext(true)

/**
 * True once it's safe to MOUNT heavy same-viewport page content — right
 * now just Building3DSection's Hero3DScene Canvas/WebGL. False only for the
 * narrow window where the first-load branded intro (see
 * RouteTransitionProvider) is about to play or is actively playing, so the
 * intro's own tight ~0.6-0.8s timing budget never has to compete with
 * WebGL/shader setup for the main thread — see that provider's
 * `heavyContentGateOpen` state for exactly which cases start already open
 * (reduced motion, admin routes, intro already shown this session) versus
 * which wait for the intro's reveal to finish. Defaults to `true` so
 * anything using this outside the provider (tests, Storybook-style
 * isolation) never gates on a signal that will never fire.
 */
export function useHeavyContentGate() {
  return useContext(HeavyContentGateContext)
}

/**
 * True once it's safe to start DOWNLOADING heavy assets in the background
 * (Hero3DScene's JS chunk, its HDRI) — deliberately a separate, EARLIER
 * signal than `useHeavyContentGate` above: opens the instant the intro
 * starts covering (not once it finishes), since a background network
 * fetch doesn't compete with the intro's main-thread budget the way
 * parsing/mounting/compiling a WebGL scene does. Mounting still waits for
 * the later `useHeavyContentGate` signal — this only lets the bytes start
 * arriving earlier so they're more likely already cached by the time that
 * happens. Same fast-path cases as `useHeavyContentGate` start this open
 * immediately too (reduced motion, admin routes, intro already shown).
 */
export function useHeavyContentPreload() {
  return useContext(HeavyContentPreloadContext)
}
