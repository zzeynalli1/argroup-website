import { useEffect, useState } from 'react'

// Measures the fixed <header>'s real rendered height via ResizeObserver
// instead of a hardcoded px guess — Header.jsx's own height changes between
// its unscrolled (py-6) and scrolled (py-3) padding states, so a static
// number drifts out of sync with whichever state is actually on screen.
// Returns null until the header is found/measured (the first paint before
// layout), so callers should keep a CSS fallback for that one frame.
export function useHeaderHeight() {
  const [height, setHeight] = useState(null)

  useEffect(() => {
    const header = document.querySelector('header')
    if (!header || typeof ResizeObserver === 'undefined') return undefined

    const observer = new ResizeObserver(([entry]) => {
      setHeight(entry.target.getBoundingClientRect().height)
    })
    observer.observe(header)
    setHeight(header.getBoundingClientRect().height)

    return () => observer.disconnect()
  }, [])

  return height
}
