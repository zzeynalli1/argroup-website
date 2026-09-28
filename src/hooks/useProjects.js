import { useEffect, useState } from 'react'
import { adaptProjectRow, fetchPublishedProjects } from '../lib/cms/projects'

/**
 * `projects` is `null` while the initial fetch is in flight. A failed read
 * resolves to an empty array so Projects.jsx renders its existing
 * empty-grid/pager state rather than throwing.
 */
export function useProjects() {
  const [state, setState] = useState({ projects: null, loading: true })

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const rows = await fetchPublishedProjects()
        if (!active) return
        setState({ projects: rows.map(adaptProjectRow), loading: false })
      } catch (err) {
        console.error('[useProjects] Supabase read failed, showing empty state:', err)
        if (!active) return
        setState({ projects: [], loading: false })
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  return state
}
