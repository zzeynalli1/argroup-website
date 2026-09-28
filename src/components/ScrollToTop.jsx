import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * React Router doesn't reset scroll position on navigation the way a normal
 * multi-page site does — without this, clicking a link to another route
 * (e.g. a related-service link) keeps whatever scroll offset the previous
 * page had, which can land the new page mid-content or nowhere near its top.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  // The browser's own scroll-restoration heuristic otherwise fights this
  // component on revisited URLs, silently re-applying a prior offset after
  // the reset below runs.
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    // The site sets `scroll-behavior: smooth` globally (src/index.css) for
    // in-page anchor/CTA scrolling — without overriding it here, this reset
    // would inherit that and slowly animate down from wherever the previous
    // page was scrolled, instead of the new page simply starting at its top.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return null
}
