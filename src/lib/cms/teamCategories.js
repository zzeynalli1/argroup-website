import { supabase } from '../supabase'

const TABLE = 'team_categories'
const FALLBACK_LOCALE = 'az'

// team_members.category_id ON DELETE RESTRICT (0007_team_categories.sql) —
// raised when deleting a category still assigned to at least one member.
const FK_RESTRICT_CODE = '23503'

const COLUMNS = ['id', 'name_az', 'name_en', 'name_ru', 'name_tr', 'sort_order', 'published', 'created_at', 'updated_at'].join(', ')

function toSafeError(action, error) {
  console.error(`[cms/teamCategories] ${action} failed:`, error)
  if (error?.code === FK_RESTRICT_CODE) {
    return new Error('Bu kateqoriyaya bağlı komanda üzvləri var. Kateqoriyanı silməzdən əvvəl həmin əməkdaşların kateqoriyasını dəyişin.')
  }
  return new Error('Əməliyyat uğursuz oldu. Zəhmət olmasa yenidən cəhd edin.')
}

function requireClient() {
  if (!supabase) throw new Error('Supabase qoşulması mövcud deyil.')
  return supabase
}

/** Admin: every category (published or not), stable order — also what the
 * Team member form's "Kateqoriya" dropdown reads from, since assigning a
 * currently-unpublished category to a member is still a valid admin action. */
export async function fetchAllCategoriesForAdmin() {
  const client = requireClient()
  const { data, error } = await client.from(TABLE).select(COLUMNS).order('sort_order', { ascending: true }).order('id', { ascending: true })
  if (error) throw toSafeError('fetchAllCategoriesForAdmin', error)
  return data
}

/** Public: published-only — what the public hierarchy's category badge reads from. */
export async function fetchPublishedCategories() {
  const client = requireClient()
  const { data, error } = await client
    .from(TABLE)
    .select(COLUMNS)
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })
  if (error) throw toSafeError('fetchPublishedCategories', error)
  return data
}

/** Resolves the given locale's name with the site's existing az-is-primary fallback convention. */
export function adaptTeamCategoryRow(row, locale) {
  const name = row[`name_${locale}`] || row[`name_${FALLBACK_LOCALE}`] || ''
  return { id: row.id, name }
}

async function nextSortOrder() {
  const client = requireClient()
  const { data, error } = await client.from(TABLE).select('sort_order').order('sort_order', { ascending: false }).limit(1)
  if (error) throw toSafeError('nextSortOrder', error)
  return (data[0]?.sort_order ?? -10) + 10
}

export async function createCategory(payload) {
  const client = requireClient()
  const sort_order = payload.sort_order ?? (await nextSortOrder())
  const { data, error } = await client.from(TABLE).insert({ ...payload, sort_order }).select(COLUMNS).single()
  if (error) throw toSafeError('createCategory', error)
  return data
}

export async function updateCategory(id, payload) {
  const client = requireClient()
  const { data, error } = await client.from(TABLE).update(payload).eq('id', id).select(COLUMNS).single()
  if (error) throw toSafeError('updateCategory', error)
  return data
}

export async function setPublished(id, published) {
  return updateCategory(id, { published })
}

/**
 * Swaps `sort_order` with the immediate neighbour in the given direction.
 * `orderedCategories` must be the same array currently rendered (already
 * sorted by sort_order).
 */
export async function moveCategory(orderedCategories, id, direction) {
  const index = orderedCategories.findIndex((c) => c.id === id)
  const neighbourIndex = direction === 'up' ? index - 1 : index + 1
  if (index === -1 || neighbourIndex < 0 || neighbourIndex >= orderedCategories.length) return

  const current = orderedCategories[index]
  const neighbour = orderedCategories[neighbourIndex]

  const client = requireClient()
  const { error: err1 } = await client.from(TABLE).update({ sort_order: neighbour.sort_order }).eq('id', current.id)
  if (err1) throw toSafeError('moveCategory', err1)

  const { error: err2 } = await client.from(TABLE).update({ sort_order: current.sort_order }).eq('id', neighbour.id)
  if (err2) throw toSafeError('moveCategory', err2)
}

/** Fails with a friendly message (see toSafeError's FK_RESTRICT_CODE
 * branch) if any team_members row still references this category — the
 * DB's ON DELETE RESTRICT is the actual enforcement, this never reassigns
 * or nulls out members to force the delete through. */
export async function deleteCategory(id) {
  const client = requireClient()
  const { error } = await client.from(TABLE).delete().eq('id', id)
  if (error) throw toSafeError('deleteCategory', error)
}
