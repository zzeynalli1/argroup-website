import { useEffect, useMemo, useState } from 'react'
import { adaptTeamMemberRow, buildTeamTree, fetchPublishedTeamMembers } from '../lib/cms/teamMembers'
import { adaptTeamCategoryRow, fetchPublishedCategories } from '../lib/cms/teamCategories'

/**
 * `root` is `null` while the initial fetch is in flight, and also if a
 * failed read leaves no rows to build a tree from — TeamTree.jsx's existing
 * `root && (...)` guard already handles that the same way as loading.
 *
 * Category is resolved here (published categories only — an unpublished
 * category's name never appears publicly, even on an otherwise-published
 * member) and attached as a plain `category` name string per member. This
 * is purely a display label; it never feeds into buildTeamTree, which still
 * derives the actual reporting hierarchy from parent_id alone, exactly as
 * before — category and hierarchy stay independent per the approved spec.
 */
export function useTeam(locale) {
  const [state, setState] = useState({ rows: null, categories: null, loading: true })

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [rows, categories] = await Promise.all([fetchPublishedTeamMembers(), fetchPublishedCategories()])
        if (!active) return
        setState({ rows, categories, loading: false })
      } catch (err) {
        console.error('[useTeam] Supabase read failed, showing empty state:', err)
        if (!active) return
        setState({ rows: [], categories: [], loading: false })
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const root = useMemo(() => {
    if (state.loading) return null
    const categoryNameById = new Map(
      state.categories.map((row) => [row.id, adaptTeamCategoryRow(row, locale).name]),
    )
    const adapted = state.rows.map((row) => ({
      ...adaptTeamMemberRow(row, locale),
      category: row.category_id != null ? (categoryNameById.get(row.category_id) ?? null) : null,
    }))
    const roots = buildTeamTree(adapted)
    return roots[0] ?? null
  }, [state.rows, state.categories, state.loading, locale])

  return { root, loading: state.loading }
}
