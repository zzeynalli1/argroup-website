import { supabase } from '../supabase'
import { products as categoryTaxonomy } from '../../data/products'
import { toWebpForUpload } from './imageOptimization'

const TABLE = 'products'
const STORAGE_BUCKET = 'media'
const STORAGE_FOLDER = 'products'
const ALLOWED_IMAGE_TYPES = ['image/webp', 'image/jpeg', 'image/png']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // matches the `media` bucket's file_size_limit
const FALLBACK_LOCALE = 'az'

// The 9 fixed categories are frontend-controlled (see data/products.js's own
// header comment) — this is the SAME source of truth the `category_key`
// CHECK constraint in 0001_init_schema.sql was written from, re-exported so
// the admin dropdown can never drift from what the DB actually accepts.
// Category CRUD is intentionally not implemented anywhere in this module.
export const FIXED_CATEGORY_KEYS = categoryTaxonomy.map((c) => c.key)

const COLUMNS = [
  'id', 'category_key', 'name',
  'description_az', 'description_en', 'description_ru', 'description_tr',
  'brand', 'external_link', 'image_urls', 'sort_order', 'published', 'created_at', 'updated_at',
].join(', ')

function toSafeError(action, error) {
  console.error(`[cms/products] ${action} failed:`, error)
  if (error?.code === '23514') return new Error('Yalnız mövcud 9 kateqoriyadan biri seçilə bilər.')
  return new Error('Əməliyyat uğursuz oldu. Zəhmət olmasa yenidən cəhd edin.')
}

function requireClient() {
  if (!supabase) throw new Error('Supabase qoşulması mövcud deyil.')
  return supabase
}

function assertValidCategory(category_key) {
  if (!FIXED_CATEGORY_KEYS.includes(category_key)) {
    throw new Error('Yalnız mövcud 9 kateqoriyadan biri seçilə bilər.')
  }
}

/** Admin: every product (published or not), stable order. */
export async function fetchAllProductsForAdmin() {
  const client = requireClient()
  const { data, error } = await client.from(TABLE).select(COLUMNS).order('sort_order', { ascending: true }).order('id', { ascending: true })
  if (error) throw toSafeError('fetchAllProductsForAdmin', error)
  return data
}

/** Public: published-only, same deterministic order the site renders in. */
export async function fetchPublishedProducts() {
  const client = requireClient()
  const { data, error } = await client
    .from(TABLE)
    .select(COLUMNS)
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })
  if (error) throw toSafeError('fetchPublishedProducts', error)
  return data
}

/**
 * Adapts a Supabase `products` row into the shape the public product tiles
 * consume, resolving the given locale's description with the site's
 * existing az-is-primary fallback convention. `name`/`brand` are single
 * values by design — see 0001_init_schema.sql's own comment: proper-noun
 * product/product-line names are identical across locales today, same
 * convention as brands/partners/customers/team member names.
 */
export function adaptProductRow(row, locale) {
  const description = row[`description_${locale}`] || row[`description_${FALLBACK_LOCALE}`] || null
  return {
    id: row.id,
    slug: String(row.id),
    categoryKey: row.category_key,
    name: row.name,
    brand: row.brand,
    externalLink: row.external_link,
    images: row.image_urls ?? [],
    image: row.image_urls?.[0] ?? null,
    description,
  }
}

async function nextSortOrder(categoryKey) {
  const client = requireClient()
  const { data, error } = await client
    .from(TABLE)
    .select('sort_order')
    .eq('category_key', categoryKey)
    .order('sort_order', { ascending: false })
    .limit(1)
  if (error) throw toSafeError('nextSortOrder', error)
  return (data[0]?.sort_order ?? -10) + 10
}

export async function createProduct(payload) {
  assertValidCategory(payload.category_key)
  const client = requireClient()
  const sort_order = payload.sort_order ?? (await nextSortOrder(payload.category_key))
  const { data, error } = await client.from(TABLE).insert({ ...payload, sort_order }).select(COLUMNS).single()
  if (error) throw toSafeError('createProduct', error)
  return data
}

export async function updateProduct(id, payload) {
  if ('category_key' in payload) assertValidCategory(payload.category_key)
  const client = requireClient()
  const { data, error } = await client.from(TABLE).update(payload).eq('id', id).select(COLUMNS).single()
  if (error) throw toSafeError('updateProduct', error)
  return data
}

export async function setPublished(id, published) {
  return updateProduct(id, { published })
}

/**
 * Swaps `sort_order` with the immediate neighbour in the given direction.
 * `orderedSiblings` must be the SAME-CATEGORY sibling group currently
 * rendered (already sorted by sort_order) — ordering is only ever
 * deterministic within a category, never across the whole table.
 */
export async function moveProduct(orderedSiblings, id, direction) {
  const index = orderedSiblings.findIndex((p) => p.id === id)
  const neighbourIndex = direction === 'up' ? index - 1 : index + 1
  if (index === -1 || neighbourIndex < 0 || neighbourIndex >= orderedSiblings.length) return

  const current = orderedSiblings[index]
  const neighbour = orderedSiblings[neighbourIndex]

  const client = requireClient()
  const { error: err1 } = await client.from(TABLE).update({ sort_order: neighbour.sort_order }).eq('id', current.id)
  if (err1) throw toSafeError('moveProduct', err1)

  const { error: err2 } = await client.from(TABLE).update({ sort_order: current.sort_order }).eq('id', neighbour.id)
  if (err2) throw toSafeError('moveProduct', err2)
}

export async function deleteProduct(id) {
  const client = requireClient()

  const { data: existing, error: fetchError } = await client.from(TABLE).select('image_urls').eq('id', id).single()
  if (fetchError) throw toSafeError('deleteProduct', fetchError)

  const { error } = await client.from(TABLE).delete().eq('id', id)
  if (error) throw toSafeError('deleteProduct', error)

  for (const url of existing?.image_urls ?? []) {
    await removeImageIfUnreferenced(url)
  }
}

/** Only deletes a Storage object if no remaining product row still references it (in any position of its image_urls array). */
async function removeImageIfUnreferenced(imageUrl) {
  const client = requireClient()
  const path = storagePathFromPublicUrl(imageUrl)
  if (!path) return

  const { data: stillUsed, error } = await client.from(TABLE).select('id').contains('image_urls', [imageUrl]).limit(1)
  if (error) {
    console.error('[cms/products] referenced-check before Storage delete failed:', error)
    return
  }
  if (stillUsed.length > 0) return

  const { error: removeError } = await client.storage.from(STORAGE_BUCKET).remove([path])
  if (removeError) {
    console.error('[cms/products] orphan Storage cleanup failed:', removeError)
  }
}

function storagePathFromPublicUrl(url) {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`
  const index = url.indexOf(marker)
  if (index === -1) return null
  return url.slice(index + marker.length)
}

export function validateProductImageFile(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Yalnız WebP, JPEG və ya PNG formatlı şəkil qəbul olunur.'
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Şəkil 5 MB-dan böyük ola bilməz.'
  }
  return null
}

/**
 * Uploads a new object under media/products/ and returns its public URL —
 * does NOT touch the database. Filename includes a short random suffix so
 * every upload produces a fresh, unique URL.
 */
export async function uploadProductImage(file, name) {
  const client = requireClient()
  const validationError = validateProductImageFile(file)
  if (validationError) throw new Error(validationError)

  const optimized = await toWebpForUpload(file)

  const ext = optimized.name.split('.').pop().toLowerCase()
  const base = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : 'product'
  const suffix = crypto.randomUUID().slice(0, 8)
  const path = `${STORAGE_FOLDER}/${base || 'product'}-${suffix}.${ext}`

  const { error } = await client.storage.from(STORAGE_BUCKET).upload(path, optimized, { contentType: optimized.type, upsert: false })
  if (error) throw toSafeError('uploadProductImage', error)

  const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return { path, publicUrl: data.publicUrl }
}

/** Best-effort cleanup of an upload that never made it into the database. */
export async function deleteUploadedObject(path) {
  const client = requireClient()
  const { error } = await client.storage.from(STORAGE_BUCKET).remove([path])
  if (error) console.error('[cms/products] orphan upload cleanup failed:', error)
}

/**
 * Appends one or more newly-uploaded image URLs to a product's image_urls
 * (upload-first, then DB update, per the safe-replace ordering) — never
 * removes anything. New images are added to the END, preserving existing
 * order.
 */
export async function addProductImages(product, files) {
  const uploaded = []
  for (const file of files) {
    uploaded.push(await uploadProductImage(file, product.name))
  }

  try {
    const image_urls = [...(product.image_urls ?? []), ...uploaded.map((u) => u.publicUrl)]
    return await updateProduct(product.id, { image_urls })
  } catch (err) {
    for (const u of uploaded) await deleteUploadedObject(u.path)
    throw err
  }
}

/**
 * Removes one image URL from a product's image_urls (DB update first),
 * then deletes the Storage object only if no other product still
 * references it.
 */
export async function removeProductImage(product, imageUrl) {
  const image_urls = (product.image_urls ?? []).filter((u) => u !== imageUrl)
  const updated = await updateProduct(product.id, { image_urls })
  await removeImageIfUnreferenced(imageUrl)
  return updated
}

/** Persists a caller-supplied reorder of the existing image_urls — no Storage change, DB-only. */
export async function reorderProductImages(product, orderedImageUrls) {
  return updateProduct(product.id, { image_urls: orderedImageUrls })
}

/**
 * Full single-image replace flow (spec order): upload new -> confirm DB
 * update -> only then remove the old object, and only if it's a managed
 * media/products/ object no other product still references. Replaces the
 * image at `imageUrl`'s position, preserving order.
 */
export async function replaceProductImage(product, imageUrl, file) {
  const { path, publicUrl } = await uploadProductImage(file, product.name)

  let updated
  try {
    const image_urls = (product.image_urls ?? []).map((u) => (u === imageUrl ? publicUrl : u))
    updated = await updateProduct(product.id, { image_urls })
  } catch (err) {
    await deleteUploadedObject(path)
    throw err
  }

  await removeImageIfUnreferenced(imageUrl)
  return updated
}
