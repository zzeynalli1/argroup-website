import { useEffect, useState } from 'react'
import { adaptBrandRow, fetchPublishedBrands } from '../lib/cms/brands'

/**
 * `brands` is `null` while the initial fetch is in flight. A failed read
 * resolves to an empty array so the public Brands grid renders its existing
 * empty-grid state rather than throwing.
 */
export function useBrands() {
  const [state, setState] = useState({ brands: null, loading: true })

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const rows = await fetchPublishedBrands()
        if (!active) return
        setState({ brands: rows.map(adaptBrandRow), loading: false })
      } catch (err) {
        console.error('[useBrands] Supabase read failed, showing empty state:', err)
        if (!active) return
        setState({ brands: [], loading: false })
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  return state
}
