import { supabase } from '../supabase'
import { slugify } from './slugify'

const TABLE = 'partners'
const STORAGE_BUCKET = 'media'
const STORAGE_FOLDER = 'partners'
const ALLOWED_IMAGE_TYPES = ['image/webp', 'image/jpeg', 'image/png']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // matches the `media` bucket's file_size_limit

const COLUMNS = ['id', 'name', 'logo_url', 'website_url', 'sort_order', 'published', 'created_at', 'updated_at'].join(', ')

function toSafeError(action, error) {
  console.error(`[cms/partners] ${action} failed:`, error)
  return new Error('Əməliyyat uğursuz oldu. Zəhmət olmasa yenidən cəhd edin.')
}

function requireClient() {
  if (!supabase) throw new Error('Supabase qoşulması mövcud deyil.')
  return supabase
}

/** Admin: every partner (published or not), stable order. */
export async function fetchAllPartnersForAdmin() {
  const client = requireClient()
  const { data, error } = await client.from(TABLE).select(COLUMNS).order('sort_order', { ascending: true }).order('id', { ascending: true })
  if (error) throw toSafeError('fetchAllPartnersForAdmin', error)
  return data
}

/** Public: published-only, same deterministic order the site renders in. */
export async function fetchPublishedPartners() {
  const client = requireClient()
  const { data, error } = await client
    .from(TABLE)
    .select(COLUMNS)
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })
  if (error) throw toSafeError('fetchPublishedPartners', error)
  return data
}

/** Adapts a Supabase `partners` row into the shape PartnersSection.jsx renders. */
export function adaptPartnerRow(row) {
  return { id: row.id, logoSrc: row.logo_url, name: row.name, url: row.website_url }
}

async function nextSortOrder() {
  const client = requireClient()
  const { data, error } = await client.from(TABLE).select('sort_order').order('sort_order', { ascending: false }).limit(1)
  if (error) throw toSafeError('nextSortOrder', error)
  return (data[0]?.sort_order ?? -10) + 10
}

export async function createPartner(payload) {
  const client = requireClient()
  const sort_order = payload.sort_order ?? (await nextSortOrder())
  const { data, error } = await client.from(TABLE).insert({ ...payload, sort_order }).select(COLUMNS).single()
  if (error) throw toSafeError('createPartner', error)
  return data
}

export async function updatePartner(id, payload) {
  const client = requireClient()
  const { data, error } = await client.from(TABLE).update(payload).eq('id', id).select(COLUMNS).single()
  if (error) throw toSafeError('updatePartner', error)
  return data
}

export async function setPublished(id, published) {
  return updatePartner(id, { published })
}

/**
 * Swaps `sort_order` with the immediate neighbour in the given direction.
 * `orderedPartners` must be the same array currently rendered (already
 * sorted by sort_order) so "neighbour" matches what the admin sees.
 */
export async function movePartner(orderedPartners, id, direction) {
  const index = orderedPartners.findIndex((p) => p.id === id)
  const neighbourIndex = direction === 'up' ? index - 1 : index + 1
  if (index === -1 || neighbourIndex < 0 || neighbourIndex >= orderedPartners.length) return

  const current = orderedPartners[index]
  const neighbour = orderedPartners[neighbourIndex]

  const client = requireClient()
  const { error: err1 } = await client.from(TABLE).update({ sort_order: neighbour.sort_order }).eq('id', current.id)
  if (err1) throw toSafeError('movePartner', err1)

  const { error: err2 } = await client.from(TABLE).update({ sort_order: current.sort_order }).eq('id', neighbour.id)
  if (err2) throw toSafeError('movePartner', err2)
}

export async function deletePartner(id) {
  const client = requireClient()

  const { data: existing, error: fetchError } = await client.from(TABLE).select('logo_url').eq('id', id).single()
  if (fetchError) throw toSafeError('deletePartner', fetchError)

  const { error } = await client.from(TABLE).delete().eq('id', id)
  if (error) throw toSafeError('deletePartner', error)

  if (existing?.logo_url) {
    await removeImageIfUnreferenced(existing.logo_url)
  }
}

/** Only deletes a Storage object if no remaining partner row still points at it. */
async function removeImageIfUnreferenced(logoUrl) {
  const client = requireClient()
  const path = storagePathFromPublicUrl(logoUrl)
  if (!path) return

  const { data: stillUsed, error } = await client.from(TABLE).select('id').eq('logo_url', logoUrl).limit(1)
  if (error) {
    console.error('[cms/partners] referenced-check before Storage delete failed:', error)
    return
  }
  if (stillUsed.length > 0) return

  const { error: removeError } = await client.storage.from(STORAGE_BUCKET).remove([path])
  if (removeError) {
    console.error('[cms/partners] orphan Storage cleanup failed:', removeError)
  }
}

function storagePathFromPublicUrl(url) {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`
  const index = url.indexOf(marker)
  if (index === -1) return null
  return url.slice(index + marker.length)
}

export function validatePartnerLogoFile(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Yalnız WebP, JPEG və ya PNG formatlı şəkil qəbul olunur.'
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Şəkil 5 MB-dan böyük ola bilməz.'
  }
  return null
}

/**
 * Uploads a new object under media/partners/ and returns its public URL —
 * does NOT touch the database or delete anything. `name` may be null
 * (unnamed partner logos are expected — see 0001_init_schema.sql).
 */
export async function uploadPartnerLogo(file, name) {
  const client = requireClient()
  const validationError = validatePartnerLogoFile(file)
  if (validationError) throw new Error(validationError)

  const ext = file.name.split('.').pop().toLowerCase()
  const base = slugify(name) || 'partner'
  const suffix = crypto.randomUUID().slice(0, 8)
  const path = `${STORAGE_FOLDER}/${base}-${suffix}.${ext}`

  const { error } = await client.storage.from(STORAGE_BUCKET).upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw toSafeError('uploadPartnerLogo', error)

  const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return { path, publicUrl: data.publicUrl }
}

/** Best-effort cleanup of an upload that never made it into the database. */
export async function deleteUploadedObject(path) {
  const client = requireClient()
  const { error } = await client.storage.from(STORAGE_BUCKET).remove([path])
  if (error) console.error('[cms/partners] orphan upload cleanup failed:', error)
}

/**
 * Full replace flow (spec order): upload new -> confirm DB update -> only
 * then remove the old object, and only if it's a managed media/partners/
 * object no other partner still references.
 */
export async function replacePartnerLogo(partner, file) {
  const { path, publicUrl } = await uploadPartnerLogo(file, partner.name)

  let updated
  try {
    updated = await updatePartner(partner.id, { logo_url: publicUrl })
  } catch (err) {
    await deleteUploadedObject(path)
    throw err
  }

  if (partner.logo_url) {
    await removeImageIfUnreferenced(partner.logo_url)
  }

  return updated
}
