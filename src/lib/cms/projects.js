import { supabase } from '../supabase'

const TABLE = 'projects'
const STORAGE_BUCKET = 'media'
const STORAGE_FOLDER = 'projects'
const ALLOWED_IMAGE_TYPES = ['image/webp', 'image/jpeg', 'image/png']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // matches the `media` bucket's file_size_limit

const COLUMNS = [
  'id', 'slug', 'title', 'client', 'location', 'status',
  'start_date', 'end_date', 'completion_date',
  'description_az', 'description_en', 'description_ru', 'description_tr',
  'work_performed_az', 'work_performed_en', 'work_performed_ru', 'work_performed_tr',
  'image_url', 'sort_order', 'published', 'created_at', 'updated_at',
].join(', ')

// Never surface raw Supabase/Postgres error internals to the admin UI —
// this is the one seam every CRUD function below funnels through.
function toSafeError(action, error) {
  console.error(`[cms/projects] ${action} failed:`, error)
  if (error?.code === '23505') return new Error('Bu slug artıq istifadə olunub.')
  return new Error('Əməliyyat uğursuz oldu. Zəhmət olmasa yenidən cəhd edin.')
}

function requireClient() {
  if (!supabase) throw new Error('Supabase qoşulması mövcud deyil.')
  return supabase
}

/** Admin: every project (published or not), stable order. */
export async function fetchAllProjectsForAdmin() {
  const client = requireClient()
  const { data, error } = await client
    .from(TABLE)
    .select(COLUMNS)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })

  if (error) throw toSafeError('fetchAllProjectsForAdmin', error)
  return data
}

/** Public: published-only, same deterministic order the site renders in. */
export async function fetchPublishedProjects() {
  const client = requireClient()
  const { data, error } = await client
    .from(TABLE)
    .select(COLUMNS)
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })

  if (error) throw toSafeError('fetchPublishedProjects', error)
  return data
}

/**
 * Adapts a Supabase `projects` row into the shape the existing public
 * components already render (Projects.jsx / ProjectDetailModal.jsx).
 */
export function adaptProjectRow(row) {
  return {
    id: row.id,
    title: row.title,
    client: row.client,
    status: row.status,
    location: row.location,
    completionDate: row.completion_date,
    imageWebp: row.image_url,
    startDate: row.start_date,
    endDate: row.end_date,
    description: {
      az: row.description_az,
      en: row.description_en,
      ru: row.description_ru,
      tr: row.description_tr,
    },
    workPerformed: {
      az: row.work_performed_az,
      en: row.work_performed_en,
      ru: row.work_performed_ru,
      tr: row.work_performed_tr,
    },
  }
}

export async function isSlugTaken(slug, excludeId) {
  const client = requireClient()
  let query = client.from(TABLE).select('id').eq('slug', slug).limit(1)
  if (excludeId) query = query.neq('id', excludeId)

  const { data, error } = await query
  if (error) throw toSafeError('isSlugTaken', error)
  return data.length > 0
}

async function nextSortOrder() {
  const client = requireClient()
  const { data, error } = await client
    .from(TABLE)
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)

  if (error) throw toSafeError('nextSortOrder', error)
  return (data[0]?.sort_order ?? -10) + 10
}

export async function createProject(payload) {
  const client = requireClient()
  const sort_order = payload.sort_order ?? (await nextSortOrder())

  const { data, error } = await client
    .from(TABLE)
    .insert({ ...payload, sort_order })
    .select(COLUMNS)
    .single()

  if (error) throw toSafeError('createProject', error)
  return data
}

/**
 * `slug` is intentionally excluded from ordinary edits unless the caller
 * explicitly passes it — see ProjectFormModal, which only ever sends `slug`
 * for brand-new projects. Existing links must not break on a routine edit.
 */
export async function updateProject(id, payload) {
  const client = requireClient()
  const { data, error } = await client
    .from(TABLE)
    .update(payload)
    .eq('id', id)
    .select(COLUMNS)
    .single()

  if (error) throw toSafeError('updateProject', error)
  return data
}

export async function setPublished(id, published) {
  return updateProject(id, { published })
}

/**
 * Swaps `sort_order` with the immediate neighbour in the given direction.
 * `orderedProjects` must be the same array currently rendered (already
 * sorted by sort_order) so "neighbour" matches what the admin sees.
 */
export async function moveProject(orderedProjects, id, direction) {
  const index = orderedProjects.findIndex((p) => p.id === id)
  const neighbourIndex = direction === 'up' ? index - 1 : index + 1
  if (index === -1 || neighbourIndex < 0 || neighbourIndex >= orderedProjects.length) return

  const current = orderedProjects[index]
  const neighbour = orderedProjects[neighbourIndex]

  const client = requireClient()
  const { error: err1 } = await client
    .from(TABLE)
    .update({ sort_order: neighbour.sort_order })
    .eq('id', current.id)
  if (err1) throw toSafeError('moveProject', err1)

  const { error: err2 } = await client
    .from(TABLE)
    .update({ sort_order: current.sort_order })
    .eq('id', neighbour.id)
  if (err2) throw toSafeError('moveProject', err2)
}

export async function deleteProject(id) {
  const client = requireClient()

  // Read the row first so we know which Storage object (if any) to clean up.
  const { data: existing, error: fetchError } = await client
    .from(TABLE)
    .select('image_url')
    .eq('id', id)
    .single()
  if (fetchError) throw toSafeError('deleteProject', fetchError)

  const { error } = await client.from(TABLE).delete().eq('id', id)
  if (error) throw toSafeError('deleteProject', error)

  if (existing?.image_url) {
    await removeImageIfUnreferenced(existing.image_url)
  }
}

/** Only deletes a Storage object if no remaining project row still points at it. */
async function removeImageIfUnreferenced(imageUrl) {
  const client = requireClient()
  const path = storagePathFromPublicUrl(imageUrl)
  if (!path) return

  const { data: stillUsed, error } = await client
    .from(TABLE)
    .select('id')
    .eq('image_url', imageUrl)
    .limit(1)

  if (error) {
    console.error('[cms/projects] referenced-check before Storage delete failed:', error)
    return
  }
  if (stillUsed.length > 0) return

  const { error: removeError } = await client.storage.from(STORAGE_BUCKET).remove([path])
  if (removeError) {
    console.error('[cms/projects] orphan Storage cleanup failed:', removeError)
  }
}

function storagePathFromPublicUrl(url) {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`
  const index = url.indexOf(marker)
  if (index === -1) return null
  return url.slice(index + marker.length)
}

export function validateProjectImageFile(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Yalnız WebP, JPEG və ya PNG formatlı şəkil qəbul olunur.'
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Şəkil 5 MB-dan böyük ola bilməz.'
  }
  return null
}

/**
 * Uploads a new object under media/projects/ and returns its public URL —
 * does NOT touch the database or delete anything. Filename includes a
 * short random suffix so replacing an image always produces a fresh URL
 * (avoids serving a stale cached image at a reused path).
 */
export async function uploadProjectImage(file, slug) {
  const client = requireClient()
  const validationError = validateProjectImageFile(file)
  if (validationError) throw new Error(validationError)

  const ext = file.name.split('.').pop().toLowerCase()
  const suffix = crypto.randomUUID().slice(0, 8)
  const path = `${STORAGE_FOLDER}/${slug}-${suffix}.${ext}`

  const { error } = await client.storage.from(STORAGE_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (error) throw toSafeError('uploadProjectImage', error)

  const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return { path, publicUrl: data.publicUrl }
}

/** Best-effort cleanup of an upload that never made it into the database. */
export async function deleteUploadedObject(path) {
  const client = requireClient()
  const { error } = await client.storage.from(STORAGE_BUCKET).remove([path])
  if (error) console.error('[cms/projects] orphan upload cleanup failed:', error)
}

/**
 * Full replace flow (spec order): upload new -> confirm DB update -> only
 * then remove the old object, and only if it's a managed media/projects/
 * object no other project still references.
 */
export async function replaceProjectImage(project, file) {
  const { path, publicUrl } = await uploadProjectImage(file, project.slug)

  let updated
  try {
    updated = await updateProject(project.id, { image_url: publicUrl })
  } catch (err) {
    await deleteUploadedObject(path)
    throw err
  }

  if (project.image_url) {
    await removeImageIfUnreferenced(project.image_url)
  }

  return updated
}
