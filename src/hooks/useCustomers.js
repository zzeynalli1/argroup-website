import { useEffect, useState } from 'react'
import { adaptCustomerRow, fetchPublishedCustomers } from '../lib/cms/customers'

/**
 * `customers` is `null` while the initial fetch is in flight. A failed read
 * resolves to an empty array so the public Customers grid renders its
 * existing empty-grid state rather than throwing.
 */
export function useCustomers() {
  const [state, setState] = useState({ customers: null, loading: true })

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const rows = await fetchPublishedCustomers()
        if (!active) return
        setState({ customers: rows.map(adaptCustomerRow), loading: false })
      } catch (err) {
        console.error('[useCustomers] Supabase read failed, showing empty state:', err)
        if (!active) return
        setState({ customers: [], loading: false })
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  return state
}
