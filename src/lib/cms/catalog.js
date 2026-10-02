import { supabase } from '../supabase'

const TABLE = 'catalog_document'
const STORAGE_BUCKET = 'media'
const STORAGE_FOLDER = 'catalog'
const ALLOWED_TYPES = ['application/pdf']
const MAX_CATALOG_BYTES = 20 * 1024 * 1024 // matches the `media` bucket's file_size_limit (0004_catalog.sql)

const COLUMNS = ['id', 'file_name', 'file_path', 'file_url', 'file_size', 'updated_at'].join(', ')

// PostgREST's "relation not in schema cache" code — surfaces here specifically
// whenever supabase/migrations/0004_catalog.sql hasn't been applied to the
// project yet (the `catalog_document` table doesn't exist), so the generic
// fallback message below would otherwise be misleadingly vague about a
// setup step rather than a real runtime failure.
const TABLE_MISSING_CODE = 'PGRST205'

function toSafeError(action, error) {
  console.error(`[cms/catalog] ${action} failed:`, error)
  if (error?.code === TABLE_MISSING_CODE) {
    return new Error(
      'Kataloq cədvəli hələ yaradılmayıb — supabase/migrations/0004_catalog.sql migrasiyası Supabase layihəsinə tətbiq olunmalıdır.',
    )
  }
  return new Error('Əməliyyat uğursuz oldu. Zəhmət olmasa yenidən cəhd edin.')
}

function requireClient() {
  if (!supabase) throw new Error('Supabase qoşulması mövcud deyil.')
  return supabase
}

/** The current catalog row (singleton, id=1), or null if none has been uploaded yet. */
export async function fetchCatalog() {
  const client = requireClient()
  const { data, error } = await client.from(TABLE).select(COLUMNS).eq('id', 1).maybeSingle()
  if (error) throw toSafeError('fetchCatalog', error)
  return data
}

export function validateCatalogFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Yalnız PDF formatlı fayl qəbul olunur.'
  }
  if (file.size > MAX_CATALOG_BYTES) {
    return 'Fayl 20 MB-dan böyük ola bilməz.'
  }
  return null
}

async function uploadCatalogFile(file) {
  const client = requireClient()
  const suffix = crypto.randomUUID().slice(0, 8)
  const path = `${STORAGE_FOLDER}/catalog-${suffix}.pdf`

  const { error } = await client.storage.from(STORAGE_BUCKET).upload(path, file, { contentType: 'application/pdf', upsert: false })
  if (error) throw toSafeError('uploadCatalogFile', error)

  const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return { path, publicUrl: data.publicUrl }
}

/** Best-effort cleanup of an upload that never made it into the database. */
async function deleteUploadedObject(path) {
  const client = requireClient()
  const { error } = await client.storage.from(STORAGE_BUCKET).remove([path])
  if (error) console.error('[cms/catalog] orphan upload cleanup failed:', error)
}

/**
 * Full replace flow (same spec order as every other CMS uploader): upload
 * new -> confirm DB upsert (id is always 1 — singleton) -> only then remove
 * the previous Storage object. `currentCatalog` is the row already loaded
 * by the caller (or null on first upload) — since this is a singleton,
 * there's never a "still referenced elsewhere" check to make first.
 */
export async function replaceCatalog(file, currentCatalog) {
  const validationError = validateCatalogFile(file)
  if (validationError) throw new Error(validationError)

  const { path, publicUrl } = await uploadCatalogFile(file)
  const client = requireClient()

  let updated
  try {
    const { data, error } = await client
      .from(TABLE)
      .upsert({ id: 1, file_name: file.name, file_path: path, file_url: publicUrl, file_size: file.size })
      .select(COLUMNS)
      .single()
    if (error) throw error
    updated = data
  } catch (err) {
    await deleteUploadedObject(path)
    throw toSafeError('replaceCatalog', err)
  }

  if (currentCatalog?.file_path) {
    await deleteUploadedObject(currentCatalog.file_path)
  }

  return updated
}

/** Removes the current catalog row and its Storage object. No-op if none exists. */
export async function removeCatalog(currentCatalog) {
  if (!currentCatalog) return
  const client = requireClient()

  const { error } = await client.from(TABLE).delete().eq('id', 1)
  if (error) throw toSafeError('removeCatalog', error)

  if (currentCatalog.file_path) {
    await deleteUploadedObject(currentCatalog.file_path)
  }
}
