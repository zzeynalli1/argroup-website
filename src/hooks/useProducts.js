import { useEffect, useMemo, useState } from 'react'
import { adaptProductRow, fetchPublishedProducts } from '../lib/cms/products'

/**
 * `products` is `null` while the initial fetch is in flight. A failed read
 * resolves to an empty array — ExpandedProductCategory.jsx already treats
 * `products ?? []` as "no CMS products for this category" the same way it
 * would for a category with none published.
 */
export function useProducts(locale) {
  const [state, setState] = useState({ rows: null, loading: true })

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const rows = await fetchPublishedProducts()
        if (!active) return
        setState({ rows, loading: false })
      } catch (err) {
        console.error('[useProducts] Supabase read failed, showing empty state:', err)
        if (!active) return
        setState({ rows: [], loading: false })
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const products = useMemo(() => {
    if (state.loading) return null
    return state.rows.map((row) => adaptProductRow(row, locale))
  }, [state.rows, state.loading, locale])

  return { products, loading: state.loading }
}
