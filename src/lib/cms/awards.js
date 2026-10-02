import { supabase } from '../supabase'
import { toWebpForUpload } from './imageOptimization'

const TABLE = 'awards'
const STORAGE_BUCKET = 'media'
const STORAGE_FOLDER = 'awards'
const ALLOWED_IMAGE_TYPES = ['image/webp', 'image/jpeg', 'image/png']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // matches the `media` bucket's file_size_limit
const LOCALES = ['az', 'en', 'ru', 'tr']
const FALLBACK_LOCALE = 'az'

const COLUMNS = [
  'id',
  'title_az', 'title_en', 'title_ru', 'title_tr',
  'organization_az', 'organization_en', 'organization_ru', 'organization_tr',
  'year', 'image_url',
  'description_az', 'description_en', 'description_ru', 'description_tr',
  'sort_order', 'published', 'created_at', 'updated_at',
].join(', ')

function toSafeError(action, error) {
  console.error(`[cms/awards] ${action} failed:`, error)
  return new Error('Əməliyyat uğursuz oldu. Zəhmət olmasa yenidən cəhd edin.')
}

function requireClient() {
  if (!supabase) throw new Error('Supabase qoşulması mövcud deyil.')
  return supabase
}

/** Admin: every award (published or not), stable order. */
export async function fetchAllAwardsForAdmin() {
  const client = requireClient()
  const { data, error } = await client.from(TABLE).select(COLUMNS).order('sort_order', { ascending: true }).order('id', { ascending: true })
  if (error) throw toSafeError('fetchAllAwardsForAdmin', error)
  return data
}

/** Public: published-only, same deterministic order the site renders in. */
export async function fetchPublishedAwards() {
  const client = requireClient()
  const { data, error } = await client
    .from(TABLE)
    .select(COLUMNS)
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })
  if (error) throw toSafeError('fetchPublishedAwards', error)
  return data
}

/**
 * Adapts a Supabase `awards` row into the shape AboutAwards.jsx renders,
 * resolving the given locale's title/organization/description with the
 * site's existing az-is-primary fallback convention (see useTranslation.js).
 */
export function adaptAwardRow(row, locale) {
  function localized(field) {
    return row[`${field}_${locale}`] || row[`${field}_${FALLBACK_LOCALE}`] || null
  }

  return {
    id: row.id,
    title: localized('title'),
    organization: localized('organization'),
    year: row.year,
    image: row.image_url,
    description: localized('description'),
  }
}

async function nextSortOrder() {
  const client = requireClient()
  const { data, error } = await client.from(TABLE).select('sort_order').order('sort_order', { ascending: false }).limit(1)
  if (error) throw toSafeError('nextSortOrder', error)
  return (data[0]?.sort_order ?? -10) + 10
}

export async function createAward(payload) {
  const client = requireClient()
  const sort_order = payload.sort_order ?? (await nextSortOrder())
  const { data, error } = await client.from(TABLE).insert({ ...payload, sort_order }).select(COLUMNS).single()
  if (error) throw toSafeError('createAward', error)
  return data
}

export async function updateAward(id, payload) {
  const client = requireClient()
  const { data, error } = await client.from(TABLE).update(payload).eq('id', id).select(COLUMNS).single()
  if (error) throw toSafeError('updateAward', error)
  return data
}

export async function setPublished(id, published) {
  return updateAward(id, { published })
}

/**
 * Swaps `sort_order` with the immediate neighbour in the given direction.
 * `orderedAwards` must be the same array currently rendered (already sorted
 * by sort_order) so "neighbour" matches what the admin sees.
 */
export async function moveAward(orderedAwards, id, direction) {
  const index = orderedAwards.findIndex((a) => a.id === id)
  const neighbourIndex = direction === 'up' ? index - 1 : index + 1
  if (index === -1 || neighbourIndex < 0 || neighbourIndex >= orderedAwards.length) return

  const current = orderedAwards[index]
  const neighbour = orderedAwards[neighbourIndex]

  const client = requireClient()
  const { error: err1 } = await client.from(TABLE).update({ sort_order: neighbour.sort_order }).eq('id', current.id)
  if (err1) throw toSafeError('moveAward', err1)

  const { error: err2 } = await client.from(TABLE).update({ sort_order: current.sort_order }).eq('id', neighbour.id)
  if (err2) throw toSafeError('moveAward', err2)
}

export async function deleteAward(id) {
  const client = requireClient()

  const { data: existing, error: fetchError } = await client.from(TABLE).select('image_url').eq('id', id).single()
  if (fetchError) throw toSafeError('deleteAward', fetchError)

  const { error } = await client.from(TABLE).delete().eq('id', id)
  if (error) throw toSafeError('deleteAward', error)

  if (existing?.image_url) {
    await removeImageIfUnreferenced(existing.image_url)
  }
}

/** Only deletes a Storage object if no remaining award row still points at it. */
async function removeImageIfUnreferenced(imageUrl) {
  const client = requireClient()
  const path = storagePathFromPublicUrl(imageUrl)
  if (!path) return

  const { data: stillUsed, error } = await client.from(TABLE).select('id').eq('image_url', imageUrl).limit(1)
  if (error) {
    console.error('[cms/awards] referenced-check before Storage delete failed:', error)
    return
  }
  if (stillUsed.length > 0) return

  const { error: removeError } = await client.storage.from(STORAGE_BUCKET).remove([path])
  if (removeError) {
    console.error('[cms/awards] orphan Storage cleanup failed:', removeError)
  }
}

function storagePathFromPublicUrl(url) {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`
  const index = url.indexOf(marker)
  if (index === -1) return null
  return url.slice(index + marker.length)
}

export function validateAwardImageFile(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Yalnız WebP, JPEG və ya PNG formatlı şəkil qəbul olunur.'
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Şəkil 5 MB-dan böyük ola bilməz.'
  }
  return null
}

/**
 * Uploads a new object under media/awards/ and returns its public URL —
 * does NOT touch the database or delete anything. Filename includes a
 * short random suffix so replacing an image always produces a fresh URL.
 */
export async function uploadAwardImage(file) {
  const client = requireClient()
  const validationError = validateAwardImageFile(file)
  if (validationError) throw new Error(validationError)

  const optimized = await toWebpForUpload(file)

  const ext = optimized.name.split('.').pop().toLowerCase()
  const suffix = crypto.randomUUID().slice(0, 8)
  const path = `${STORAGE_FOLDER}/award-${suffix}.${ext}`

  const { error } = await client.storage.from(STORAGE_BUCKET).upload(path, optimized, { contentType: optimized.type, upsert: false })
  if (error) throw toSafeError('uploadAwardImage', error)

  const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return { path, publicUrl: data.publicUrl }
}

/** Best-effort cleanup of an upload that never made it into the database. */
export async function deleteUploadedObject(path) {
  const client = requireClient()
  const { error } = await client.storage.from(STORAGE_BUCKET).remove([path])
  if (error) console.error('[cms/awards] orphan upload cleanup failed:', error)
}

/**
 * Full replace flow (spec order): upload new -> confirm DB update -> only
 * then remove the old object, and only if it's a managed media/awards/
 * object no other award still references.
 */
export async function replaceAwardImage(award, file) {
  const { path, publicUrl } = await uploadAwardImage(file)

  let updated
  try {
    updated = await updateAward(award.id, { image_url: publicUrl })
  } catch (err) {
    await deleteUploadedObject(path)
    throw err
  }

  if (award.image_url) {
    await removeImageIfUnreferenced(award.image_url)
  }

  return updated
}

export { LOCALES }
