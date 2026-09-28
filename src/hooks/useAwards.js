import { useEffect, useMemo, useState } from 'react'
import { adaptAwardRow, fetchPublishedAwards } from '../lib/cms/awards'

/**
 * A failed Supabase read resolves to an empty array (no local fallback
 * data), so AboutAwards.jsx's existing empty state renders — the same
 * state it already shows for zero real published awards.
 */
export function useAwards(locale) {
  const [state, setState] = useState({ rows: null, loading: true })

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const rows = await fetchPublishedAwards()
        if (!active) return
        setState({ rows, loading: false })
      } catch (err) {
        console.error('[useAwards] Supabase read failed, showing empty state (no placeholder fallback):', err)
        if (!active) return
        setState({ rows: [], loading: false })
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const awards = useMemo(() => (state.rows ? state.rows.map((row) => adaptAwardRow(row, locale)) : null), [state.rows, locale])

  return { awards, loading: state.loading }
}
