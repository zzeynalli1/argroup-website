import { supabase } from '../supabase'

const TABLE = 'team_members'
const STORAGE_BUCKET = 'media'
const STORAGE_FOLDER = 'team'
const ALLOWED_IMAGE_TYPES = ['image/webp', 'image/jpeg', 'image/png']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // matches the `media` bucket's file_size_limit
const FALLBACK_LOCALE = 'az'

const COLUMNS = [
  'id', 'name',
  'position_az', 'position_en', 'position_ru', 'position_tr',
  'photo_url', 'parent_id', 'sort_order', 'published', 'created_at', 'updated_at',
].join(', ')

// team_members_no_self_parent CHECK constraint (0001_init_schema.sql).
const SELF_PARENT_CODE = '23514'
// FK restrict on parent_id — raised on DELETE while children still exist.
const FK_RESTRICT_CODE = '23503'
// team_members_prevent_cycle trigger's `raise exception` (0001_init_schema.sql).
const CYCLE_TRIGGER_SQLSTATE = 'P0001'

function toSafeError(action, error) {
  console.error(`[cms/teamMembers] ${action} failed:`, error)

  if (error?.code === FK_RESTRICT_CODE) {
    return new Error('Bu üzvün alt komandası var. Əvvəlcə alt üzvləri başqa yerə köçürün və ya silin.')
  }
  if (error?.code === SELF_PARENT_CODE) {
    return new Error('Bir üzv öz-özünün rəhbəri ola bilməz.')
  }
  if (error?.code === CYCLE_TRIGGER_SQLSTATE) {
    return new Error('Bu təyinat iyerarxiyada dövr yaradır — fərqli bir rəhbər seçin.')
  }
  return new Error('Əməliyyat uğursuz oldu. Zəhmət olmasa yenidən cəhd edin.')
}

function requireClient() {
  if (!supabase) throw new Error('Supabase qoşulması mövcud deyil.')
  return supabase
}

/** Admin: every team member (published or not), stable order. */
export async function fetchAllTeamMembersForAdmin() {
  const client = requireClient()
  const { data, error } = await client.from(TABLE).select(COLUMNS).order('sort_order', { ascending: true }).order('id', { ascending: true })
  if (error) throw toSafeError('fetchAllTeamMembersForAdmin', error)
  return data
}

/** Public: published-only, same deterministic order the site renders in. */
export async function fetchPublishedTeamMembers() {
  const client = requireClient()
  const { data, error } = await client
    .from(TABLE)
    .select(COLUMNS)
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })
  if (error) throw toSafeError('fetchPublishedTeamMembers', error)
  return data
}

/**
 * Adapts a Supabase `team_members` row into the shape TeamTree.jsx renders,
 * resolving the given locale's position with the site's existing
 * az-is-primary fallback convention (see useTranslation.js). Position is
 * free CMS text now (not a translation-key lookup), so this is a straight
 * per-row field resolution, not an i18n call.
 */
export function adaptTeamMemberRow(row, locale) {
  const position = row[`position_${locale}`] || row[`position_${FALLBACK_LOCALE}`] || ''
  return {
    id: row.id,
    name: row.name,
    position,
    photo: row.photo_url,
    parentId: row.parent_id,
    sortOrder: row.sort_order,
  }
}

/**
 * Builds the nested tree TeamTree.jsx / the admin tree view walk, from a
 * flat `team_members` row list (already adapted via adaptTeamMemberRow or
 * left raw — this only reads `id`/`parentId`(or `parent_id`)/sort order).
 * Returns an array of root nodes (parent_id null) — today's data has
 * exactly one root, but this doesn't assume that.
 */
export function buildTeamTree(rows) {
  const byParent = new Map()
  for (const row of rows) {
    const parentId = row.parentId ?? row.parent_id ?? null
    if (!byParent.has(parentId)) byParent.set(parentId, [])
    byParent.get(parentId).push(row)
  }
  for (const siblings of byParent.values()) {
    siblings.sort((a, b) => (a.sortOrder ?? a.sort_order) - (b.sortOrder ?? b.sort_order))
  }

  function attachChildren(node) {
    const children = byParent.get(node.id) ?? []
    return { ...node, children: children.map(attachChildren) }
  }

  return (byParent.get(null) ?? []).map(attachChildren)
}

/**
 * Options for the admin's parent-selection dropdown: every member except
 * `excludeId` itself and its descendants (the DB's cycle trigger is the
 * final guard, but the UI shouldn't offer an obviously-invalid choice).
 */
export function getValidParentOptions(allMembers, excludeId) {
  if (excludeId == null) return allMembers

  const excluded = new Set([excludeId])
  let grew = true
  while (grew) {
    grew = false
    for (const member of allMembers) {
      if (excluded.has(member.parent_id) && !excluded.has(member.id)) {
        excluded.add(member.id)
        grew = true
      }
    }
  }

  return allMembers.filter((m) => !excluded.has(m.id))
}

async function nextSortOrder(parentId) {
  const client = requireClient()
  let query = client.from(TABLE).select('sort_order').order('sort_order', { ascending: false }).limit(1)
  query = parentId == null ? query.is('parent_id', null) : query.eq('parent_id', parentId)
  const { data, error } = await query
  if (error) throw toSafeError('nextSortOrder', error)
  return (data[0]?.sort_order ?? -10) + 10
}

export async function createTeamMember(payload) {
  const client = requireClient()
  const sort_order = payload.sort_order ?? (await nextSortOrder(payload.parent_id ?? null))
  const { data, error } = await client.from(TABLE).insert({ ...payload, sort_order }).select(COLUMNS).single()
  if (error) throw toSafeError('createTeamMember', error)
  return data
}

export async function updateTeamMember(id, payload) {
  const client = requireClient()
  const { data, error } = await client.from(TABLE).update(payload).eq('id', id).select(COLUMNS).single()
  if (error) throw toSafeError('updateTeamMember', error)
  return data
}

export async function setPublished(id, published) {
  return updateTeamMember(id, { published })
}

/**
 * Swaps `sort_order` with the immediate neighbour in the given direction.
 * `orderedSiblings` must be the SAME-PARENT sibling group currently
 * rendered (already sorted by sort_order) — reordering only ever happens
 * within one parent's children, never across the whole table.
 */
export async function moveTeamMember(orderedSiblings, id, direction) {
  const index = orderedSiblings.findIndex((m) => m.id === id)
  const neighbourIndex = direction === 'up' ? index - 1 : index + 1
  if (index === -1 || neighbourIndex < 0 || neighbourIndex >= orderedSiblings.length) return

  const current = orderedSiblings[index]
  const neighbour = orderedSiblings[neighbourIndex]

  const client = requireClient()
  const { error: err1 } = await client.from(TABLE).update({ sort_order: neighbour.sort_order }).eq('id', current.id)
  if (err1) throw toSafeError('moveTeamMember', err1)

  const { error: err2 } = await client.from(TABLE).update({ sort_order: current.sort_order }).eq('id', neighbour.id)
  if (err2) throw toSafeError('moveTeamMember', err2)
}

/**
 * Deleting a member with existing children fails with a friendly message
 * (see toSafeError's FK_RESTRICT_CODE branch) — the DB's ON DELETE RESTRICT
 * is the enforcement, this never attempts to cascade.
 */
export async function deleteTeamMember(id) {
  const client = requireClient()

  const { data: existing, error: fetchError } = await client.from(TABLE).select('photo_url').eq('id', id).single()
  if (fetchError) throw toSafeError('deleteTeamMember', fetchError)

  const { error } = await client.from(TABLE).delete().eq('id', id)
  if (error) throw toSafeError('deleteTeamMember', error)

  if (existing?.photo_url) {
    await removeImageIfUnreferenced(existing.photo_url)
  }
}

/** Only deletes a Storage object if no remaining member row still points at it. */
async function removeImageIfUnreferenced(photoUrl) {
  const client = requireClient()
  const path = storagePathFromPublicUrl(photoUrl)
  if (!path) return

  const { data: stillUsed, error } = await client.from(TABLE).select('id').eq('photo_url', photoUrl).limit(1)
  if (error) {
    console.error('[cms/teamMembers] referenced-check before Storage delete failed:', error)
    return
  }
  if (stillUsed.length > 0) return

  const { error: removeError } = await client.storage.from(STORAGE_BUCKET).remove([path])
  if (removeError) {
    console.error('[cms/teamMembers] orphan Storage cleanup failed:', removeError)
  }
}

function storagePathFromPublicUrl(url) {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`
  const index = url.indexOf(marker)
  if (index === -1) return null
  return url.slice(index + marker.length)
}

export function validateTeamPhotoFile(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Yalnız WebP, JPEG və ya PNG formatlı şəkil qəbul olunur.'
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Şəkil 5 MB-dan böyük ola bilməz.'
  }
  return null
}

/**
 * Uploads a new object under media/team/ and returns its public URL — does
 * NOT touch the database or delete anything. `name` may be null (roles
 * with no verified individual are expected — see 0001_init_schema.sql).
 */
export async function uploadTeamPhoto(file, name) {
  const client = requireClient()
  const validationError = validateTeamPhotoFile(file)
  if (validationError) throw new Error(validationError)

  const ext = file.name.split('.').pop().toLowerCase()
  const base = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : 'member'
  const suffix = crypto.randomUUID().slice(0, 8)
  const path = `${STORAGE_FOLDER}/${base || 'member'}-${suffix}.${ext}`

  const { error } = await client.storage.from(STORAGE_BUCKET).upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw toSafeError('uploadTeamPhoto', error)

  const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return { path, publicUrl: data.publicUrl }
}

/** Best-effort cleanup of an upload that never made it into the database. */
export async function deleteUploadedObject(path) {
  const client = requireClient()
  const { error } = await client.storage.from(STORAGE_BUCKET).remove([path])
  if (error) console.error('[cms/teamMembers] orphan upload cleanup failed:', error)
}

/**
 * Full replace flow (spec order): upload new -> confirm DB update -> only
 * then remove the old object, and only if it's a managed media/team/
 * object no other member still references.
 */
export async function replaceTeamPhoto(member, file) {
  const { path, publicUrl } = await uploadTeamPhoto(file, member.name)

  let updated
  try {
    updated = await updateTeamMember(member.id, { photo_url: publicUrl })
  } catch (err) {
    await deleteUploadedObject(path)
    throw err
  }

  if (member.photo_url) {
    await removeImageIfUnreferenced(member.photo_url)
  }

  return updated
}
