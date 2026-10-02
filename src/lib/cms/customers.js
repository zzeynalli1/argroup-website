import { supabase } from '../supabase'
import { slugify } from './slugify'
import { toWebpForUpload } from './imageOptimization'

const TABLE = 'customers'
const STORAGE_BUCKET = 'media'
const STORAGE_FOLDER = 'customers'
const ALLOWED_IMAGE_TYPES = ['image/webp', 'image/jpeg', 'image/png']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // matches the `media` bucket's file_size_limit

const COLUMNS = ['id', 'name', 'logo_url', 'sort_order', 'published', 'created_at', 'updated_at'].join(', ')

function toSafeError(action, error) {
  console.error(`[cms/customers] ${action} failed:`, error)
  return new Error('Əməliyyat uğursuz oldu. Zəhmət olmasa yenidən cəhd edin.')
}

function requireClient() {
  if (!supabase) throw new Error('Supabase qoşulması mövcud deyil.')
  return supabase
}

/** Admin: every customer (published or not), stable order. */
export async function fetchAllCustomersForAdmin() {
  const client = requireClient()
  const { data, error } = await client.from(TABLE).select(COLUMNS).order('sort_order', { ascending: true }).order('id', { ascending: true })
  if (error) throw toSafeError('fetchAllCustomersForAdmin', error)
  return data
}

/** Public: published-only, same deterministic order the site renders in. */
export async function fetchPublishedCustomers() {
  const client = requireClient()
  const { data, error } = await client
    .from(TABLE)
    .select(COLUMNS)
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })
  if (error) throw toSafeError('fetchPublishedCustomers', error)
  return data
}

/** Adapts a Supabase `customers` row into the shape CustomersSection.jsx renders. */
export function adaptCustomerRow(row) {
  return { id: row.id, logoSrc: row.logo_url, name: row.name }
}

async function nextSortOrder() {
  const client = requireClient()
  const { data, error } = await client.from(TABLE).select('sort_order').order('sort_order', { ascending: false }).limit(1)
  if (error) throw toSafeError('nextSortOrder', error)
  return (data[0]?.sort_order ?? -10) + 10
}

export async function createCustomer(payload) {
  const client = requireClient()
  const sort_order = payload.sort_order ?? (await nextSortOrder())
  const { data, error } = await client.from(TABLE).insert({ ...payload, sort_order }).select(COLUMNS).single()
  if (error) throw toSafeError('createCustomer', error)
  return data
}

export async function updateCustomer(id, payload) {
  const client = requireClient()
  const { data, error } = await client.from(TABLE).update(payload).eq('id', id).select(COLUMNS).single()
  if (error) throw toSafeError('updateCustomer', error)
  return data
}

export async function setPublished(id, published) {
  return updateCustomer(id, { published })
}

/**
 * Swaps `sort_order` with the immediate neighbour in the given direction.
 * `orderedCustomers` must be the same array currently rendered (already
 * sorted by sort_order) so "neighbour" matches what the admin sees.
 */
export async function moveCustomer(orderedCustomers, id, direction) {
  const index = orderedCustomers.findIndex((c) => c.id === id)
  const neighbourIndex = direction === 'up' ? index - 1 : index + 1
  if (index === -1 || neighbourIndex < 0 || neighbourIndex >= orderedCustomers.length) return

  const current = orderedCustomers[index]
  const neighbour = orderedCustomers[neighbourIndex]

  const client = requireClient()
  const { error: err1 } = await client.from(TABLE).update({ sort_order: neighbour.sort_order }).eq('id', current.id)
  if (err1) throw toSafeError('moveCustomer', err1)

  const { error: err2 } = await client.from(TABLE).update({ sort_order: current.sort_order }).eq('id', neighbour.id)
  if (err2) throw toSafeError('moveCustomer', err2)
}

export async function deleteCustomer(id) {
  const client = requireClient()

  const { data: existing, error: fetchError } = await client.from(TABLE).select('logo_url').eq('id', id).single()
  if (fetchError) throw toSafeError('deleteCustomer', fetchError)

  const { error } = await client.from(TABLE).delete().eq('id', id)
  if (error) throw toSafeError('deleteCustomer', error)

  if (existing?.logo_url) {
    await removeImageIfUnreferenced(existing.logo_url)
  }
}

/** Only deletes a Storage object if no remaining customer row still points at it. */
async function removeImageIfUnreferenced(logoUrl) {
  const client = requireClient()
  const path = storagePathFromPublicUrl(logoUrl)
  if (!path) return

  const { data: stillUsed, error } = await client.from(TABLE).select('id').eq('logo_url', logoUrl).limit(1)
  if (error) {
    console.error('[cms/customers] referenced-check before Storage delete failed:', error)
    return
  }
  if (stillUsed.length > 0) return

  const { error: removeError } = await client.storage.from(STORAGE_BUCKET).remove([path])
  if (removeError) {
    console.error('[cms/customers] orphan Storage cleanup failed:', removeError)
  }
}

function storagePathFromPublicUrl(url) {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`
  const index = url.indexOf(marker)
  if (index === -1) return null
  return url.slice(index + marker.length)
}

export function validateCustomerLogoFile(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Yalnız WebP, JPEG və ya PNG formatlı şəkil qəbul olunur.'
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Şəkil 5 MB-dan böyük ola bilməz.'
  }
  return null
}

/**
 * Uploads a new object under media/customers/ and returns its public URL —
 * does NOT touch the database or delete anything. `name` may be null
 * (unnamed customer logos are expected — see 0001_init_schema.sql).
 */
export async function uploadCustomerLogo(file, name) {
  const client = requireClient()
  const validationError = validateCustomerLogoFile(file)
  if (validationError) throw new Error(validationError)

  const optimized = await toWebpForUpload(file)

  const ext = optimized.name.split('.').pop().toLowerCase()
  const base = slugify(name) || 'customer'
  const suffix = crypto.randomUUID().slice(0, 8)
  const path = `${STORAGE_FOLDER}/${base}-${suffix}.${ext}`

  const { error } = await client.storage.from(STORAGE_BUCKET).upload(path, optimized, { contentType: optimized.type, upsert: false })
  if (error) throw toSafeError('uploadCustomerLogo', error)

  const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return { path, publicUrl: data.publicUrl }
}

/** Best-effort cleanup of an upload that never made it into the database. */
export async function deleteUploadedObject(path) {
  const client = requireClient()
  const { error } = await client.storage.from(STORAGE_BUCKET).remove([path])
  if (error) console.error('[cms/customers] orphan upload cleanup failed:', error)
}

/**
 * Full replace flow (spec order): upload new -> confirm DB update -> only
 * then remove the old object, and only if it's a managed media/customers/
 * object no other customer still references.
 */
export async function replaceCustomerLogo(customer, file) {
  const { path, publicUrl } = await uploadCustomerLogo(file, customer.name)

  let updated
  try {
    updated = await updateCustomer(customer.id, { logo_url: publicUrl })
  } catch (err) {
    await deleteUploadedObject(path)
    throw err
  }

  if (customer.logo_url) {
    await removeImageIfUnreferenced(customer.logo_url)
  }

  return updated
}
