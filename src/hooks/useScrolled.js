import { useEffect, useState } from 'react'

/**
 * Tracks whether the page has scrolled past `threshold`, as a single
 * boolean flip rather than a raw scrollY number — callers only need the
 * two visual states, and this way they don't re-render on every pixel.
 */
export function useScrolled(threshold = 50) {
  const [scrolled, setScrolled] = useState(() => window.scrollY >= threshold)

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY >= threshold)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [threshold])

  return scrolled
}
