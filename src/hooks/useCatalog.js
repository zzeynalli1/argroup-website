import { useEffect, useState } from 'react'
import { fetchCatalog } from '../lib/cms/catalog'

/**
 * `catalog` is `null` while the initial fetch is in flight, and stays `null`
 * if no catalog has ever been uploaded (or the read fails) — CatalogDownload.jsx
 * treats both the same way: hide the download action rather than show a
 * broken link.
 */
export function useCatalog() {
  const [state, setState] = useState({ catalog: null, loading: true })

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const catalog = await fetchCatalog()
        if (!active) return
        setState({ catalog, loading: false })
      } catch (err) {
        console.error('[useCatalog] Supabase read failed, showing empty state:', err)
        if (!active) return
        setState({ catalog: null, loading: false })
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  return state
}
