import { useEffect, useMemo, useState } from 'react'
import { adaptTeamMemberRow, buildTeamTree, fetchPublishedTeamMembers } from '../lib/cms/teamMembers'

/**
 * `root` is `null` while the initial fetch is in flight, and also if a
 * failed read leaves no rows to build a tree from — TeamTree.jsx's existing
 * `root && (...)` guard already handles that the same way as loading.
 */
export function useTeam(locale) {
  const [state, setState] = useState({ rows: null, loading: true })

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const rows = await fetchPublishedTeamMembers()
        if (!active) return
        setState({ rows, loading: false })
      } catch (err) {
        console.error('[useTeam] Supabase read failed, showing empty state:', err)
        if (!active) return
        setState({ rows: [], loading: false })
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const root = useMemo(() => {
    if (state.loading) return null
    const adapted = state.rows.map((row) => adaptTeamMemberRow(row, locale))
    const roots = buildTeamTree(adapted)
    return roots[0] ?? null
  }, [state.rows, state.loading, locale])

  return { root, loading: state.loading }
}
