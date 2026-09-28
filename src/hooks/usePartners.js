import { useEffect, useState } from 'react'
import { adaptPartnerRow, fetchPublishedPartners } from '../lib/cms/partners'

/**
 * `partners` is `null` while the initial fetch is in flight. A failed read
 * resolves to an empty array so the public Partners row renders its
 * existing empty-row state rather than throwing.
 */
export function usePartners() {
  const [state, setState] = useState({ partners: null, loading: true })

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const rows = await fetchPublishedPartners()
        if (!active) return
        setState({ partners: rows.map(adaptPartnerRow), loading: false })
      } catch (err) {
        console.error('[usePartners] Supabase read failed, showing empty state:', err)
        if (!active) return
        setState({ partners: [], loading: false })
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  return state
}
