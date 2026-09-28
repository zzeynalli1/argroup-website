import { supabase } from '../supabase'
import { slugify } from './slugify'

const TABLE = 'brands'
const STORAGE_BUCKET = 'media'
const STORAGE_FOLDER = 'brands'
const ALLOWED_IMAGE_TYPES = ['image/webp', 'image/jpeg', 'image/png']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // matches the `media` bucket's file_size_limit

// Mirrors the "restrained nudge, not a free-form CSS control" guardrail from
// the 0001_init_schema.sql comment on brands.logo_scale — the original
// pre-migration local data ranged 0.88-1.8, so this gives real headroom on
// both sides without exposing arbitrary CSS scale values.
export const LOGO_SCALE_MIN = 0.5
export const LOGO_SCALE_MAX = 2.5

const COLUMNS = ['id', 'name', 'logo_url', 'website_url', 'logo_scale', 'sort_order', 'published', 'created_at', 'updated_at'].join(', ')

function toSafeError(action, error) {
  console.error(`[cms/brands] ${action} failed:`, error)
  return new Error('Əməliyyat uğursuz oldu. Zəhmət olmasa yenidən cəhd edin.')
}

function requireClient() {
  if (!supabase) throw new Error('Supabase qoşulması mövcud deyil.')
  return supabase
}

export function clampLogoScale(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 1
  return Math.min(LOGO_SCALE_MAX, Math.max(LOGO_SCALE_MIN, n))
}

/** Admin: every brand (published or not), stable order. */
export async function fetchAllBrandsForAdmin() {
  const client = requireClient()
  const { data, error } = await client.from(TABLE).select(COLUMNS).order('sort_order', { ascending: true }).order('id', { ascending: true })
  if (error) throw toSafeError('fetchAllBrandsForAdmin', error)
  return data
}

/** Public: published-only, same deterministic order the site renders in. */
export async function fetchPublishedBrands() {
  const client = requireClient()
  const { data, error } = await client
    .from(TABLE)
    .select(COLUMNS)
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })
  if (error) throw toSafeError('fetchPublishedBrands', error)
  return data
}

/** Adapts a Supabase `brands` row into the shape BrandsSection.jsx already renders. */
export function adaptBrandRow(row) {
  return { id: row.id, logoSrc: row.logo_url, name: row.name, url: row.website_url, logoScale: Number(row.logo_scale) }
}

async function nextSortOrder() {
  const client = requireClient()
  const { data, error } = await client.from(TABLE).select('sort_order').order('sort_order', { ascending: false }).limit(1)
  if (error) throw toSafeError('nextSortOrder', error)
  return (data[0]?.sort_order ?? -10) + 10
}

export async function createBrand(payload) {
  const client = requireClient()
  const sort_order = payload.sort_order ?? (await nextSortOrder())
  const { data, error } = await client
    .from(TABLE)
    .insert({ ...payload, logo_scale: clampLogoScale(payload.logo_scale ?? 1), sort_order })
    .select(COLUMNS)
    .single()
  if (error) throw toSafeError('createBrand', error)
  return data
}

export async function updateBrand(id, payload) {
  const client = requireClient()
  const cleanPayload = 'logo_scale' in payload ? { ...payload, logo_scale: clampLogoScale(payload.logo_scale) } : payload
  const { data, error } = await client.from(TABLE).update(cleanPayload).eq('id', id).select(COLUMNS).single()
  if (error) throw toSafeError('updateBrand', error)
  return data
}

export async function setPublished(id, published) {
  return updateBrand(id, { published })
}

/**
 * Swaps `sort_order` with the immediate neighbour in the given direction.
 * `orderedBrands` must be the same array currently rendered (already sorted
 * by sort_order) so "neighbour" matches what the admin sees.
 */
export async function moveBrand(orderedBrands, id, direction) {
  const index = orderedBrands.findIndex((b) => b.id === id)
  const neighbourIndex = direction === 'up' ? index - 1 : index + 1
  if (index === -1 || neighbourIndex < 0 || neighbourIndex >= orderedBrands.length) return

  const current = orderedBrands[index]
  const neighbour = orderedBrands[neighbourIndex]

  const client = requireClient()
  const { error: err1 } = await client.from(TABLE).update({ sort_order: neighbour.sort_order }).eq('id', current.id)
  if (err1) throw toSafeError('moveBrand', err1)

  const { error: err2 } = await client.from(TABLE).update({ sort_order: current.sort_order }).eq('id', neighbour.id)
  if (err2) throw toSafeError('moveBrand', err2)
}

export async function deleteBrand(id) {
  const client = requireClient()

  const { data: existing, error: fetchError } = await client.from(TABLE).select('logo_url').eq('id', id).single()
  if (fetchError) throw toSafeError('deleteBrand', fetchError)

  const { error } = await client.from(TABLE).delete().eq('id', id)
  if (error) throw toSafeError('deleteBrand', error)

  if (existing?.logo_url) {
    await removeImageIfUnreferenced(existing.logo_url)
  }
}

/** Only deletes a Storage object if no remaining brand row still points at it. */
async function removeImageIfUnreferenced(logoUrl) {
  const client = requireClient()
  const path = storagePathFromPublicUrl(logoUrl)
  if (!path) return

  const { data: stillUsed, error } = await client.from(TABLE).select('id').eq('logo_url', logoUrl).limit(1)
  if (error) {
    console.error('[cms/brands] referenced-check before Storage delete failed:', error)
    return
  }
  if (stillUsed.length > 0) return

  const { error: removeError } = await client.storage.from(STORAGE_BUCKET).remove([path])
  if (removeError) {
    console.error('[cms/brands] orphan Storage cleanup failed:', removeError)
  }
}

function storagePathFromPublicUrl(url) {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`
  const index = url.indexOf(marker)
  if (index === -1) return null
  return url.slice(index + marker.length)
}

export function validateBrandLogoFile(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Yalnız WebP, JPEG və ya PNG formatlı şəkil qəbul olunur.'
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Şəkil 5 MB-dan böyük ola bilməz.'
  }
  return null
}

/**
 * Uploads a new object under media/brands/ and returns its public URL — does
 * NOT touch the database or delete anything. Filename includes a short
 * random suffix so replacing a logo always produces a fresh URL (avoids
 * serving a stale cached image at a reused path).
 */
export async function uploadBrandLogo(file, name) {
  const client = requireClient()
  const validationError = validateBrandLogoFile(file)
  if (validationError) throw new Error(validationError)

  const ext = file.name.split('.').pop().toLowerCase()
  const base = slugify(name) || 'brand'
  const suffix = crypto.randomUUID().slice(0, 8)
  const path = `${STORAGE_FOLDER}/${base}-${suffix}.${ext}`

  const { error } = await client.storage.from(STORAGE_BUCKET).upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw toSafeError('uploadBrandLogo', error)

  const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return { path, publicUrl: data.publicUrl }
}

/** Best-effort cleanup of an upload that never made it into the database. */
export async function deleteUploadedObject(path) {
  const client = requireClient()
  const { error } = await client.storage.from(STORAGE_BUCKET).remove([path])
  if (error) console.error('[cms/brands] orphan upload cleanup failed:', error)
}

/**
 * Full replace flow (spec order): upload new -> confirm DB update -> only
 * then remove the old object, and only if it's a managed media/brands/
 * object no other brand still references.
 */
export async function replaceBrandLogo(brand, file) {
  const { path, publicUrl } = await uploadBrandLogo(file, brand.name)

  let updated
  try {
    updated = await updateBrand(brand.id, { logo_url: publicUrl })
  } catch (err) {
    await deleteUploadedObject(path)
    throw err
  }

  if (brand.logo_url) {
    await removeImageIfUnreferenced(brand.logo_url)
  }

  return updated
}
