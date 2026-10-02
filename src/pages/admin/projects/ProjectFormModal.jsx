import { useEffect, useMemo, useState } from 'react'
import { Loader2, Upload, X } from 'lucide-react'
import {
  createProject,
  deleteUploadedObject,
  isSlugTaken,
  replaceProjectImage,
  updateProject,
  uploadProjectImage,
  validateProjectImageFile,
} from '../../../lib/cms/projects'
import { slugify } from '../../../lib/cms/slugify'
import ImageCropModal from '../../../components/admin/ImageCropModal'

const LOCALES = [
  { key: 'az', label: 'AZ' },
  { key: 'en', label: 'EN' },
  { key: 'ru', label: 'RU' },
  { key: 'tr', label: 'TR' },
]

const FIELD_CLASSES =
  'w-full rounded-sm border border-industrial-950/15 bg-base-50 px-3.5 py-2.5 text-sm text-industrial-950 placeholder:text-neutral-custom-400 outline-none transition-colors focus:border-ember-600'

function emptyLocaleValues() {
  return { az: '', en: '', ru: '', tr: '' }
}

function valuesFromProject(project) {
  if (!project) {
    return {
      title: '',
      slug: '',
      client: '',
      location: '',
      status: 'ongoing',
      start_date: '',
      end_date: '',
      completion_date: '',
      sort_order: '',
      published: true,
      description: emptyLocaleValues(),
      workPerformed: emptyLocaleValues(),
    }
  }

  const description = emptyLocaleValues()
  const workPerformed = emptyLocaleValues()
  for (const { key } of LOCALES) {
    description[key] = project[`description_${key}`] ?? ''
    workPerformed[key] = (project[`work_performed_${key}`] ?? []).join('\n')
  }

  return {
    title: project.title ?? '',
    slug: project.slug ?? '',
    client: project.client ?? '',
    location: project.location ?? '',
    status: project.status ?? 'ongoing',
    start_date: project.start_date ?? '',
    end_date: project.end_date ?? '',
    completion_date: project.completion_date ?? '',
    sort_order: project.sort_order ?? '',
    published: project.published ?? true,
    description,
    workPerformed,
  }
}

function buildPayload(values) {
  const payload = {
    title: values.title.trim(),
    client: values.client.trim(),
    location: values.location.trim(),
    status: values.status,
    start_date: values.start_date || null,
    end_date: values.end_date || null,
    completion_date: values.completion_date || null,
    published: values.published,
  }

  if (values.sort_order !== '') payload.sort_order = Number(values.sort_order)

  for (const { key } of LOCALES) {
    payload[`description_${key}`] = values.description[key].trim() || null
    payload[`work_performed_${key}`] = values.workPerformed[key]
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  }

  return payload
}

export default function ProjectFormModal({ project, onClose, onSaved }) {
  const isEdit = Boolean(project)
  const [values, setValues] = useState(() => valuesFromProject(project))
  const [slugTouched, setSlugTouched] = useState(isEdit)
  const [activeLocale, setActiveLocale] = useState('az')
  const [imageFile, setImageFile] = useState(null)
  const [cropTarget, setCropTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Derived, not state — imagePreview is a pure function of imageFile (or
  // the existing project's image_url). The effect below only owns cleanup
  // of the blob URL as an external browser resource; it never sets state.
  const imagePreview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : (project?.image_url ?? null)),
    [imageFile, project],
  )

  useEffect(() => {
    if (!imageFile) return undefined
    return () => URL.revokeObjectURL(imagePreview)
  }, [imageFile, imagePreview])

  function handleTitleChange(title) {
    setValues((prev) => ({
      ...prev,
      title,
      // Only new projects get their slug auto-derived, and only until the
      // admin edits the slug field directly — never re-touch an existing
      // project's slug from a title edit.
      slug: !isEdit && !slugTouched ? slugify(title) : prev.slug,
    }))
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const validationError = validateProjectImageFile(file)
    if (validationError) {
      setFormError(validationError)
      event.target.value = ''
      return
    }
    setFormError('')
    setCropTarget(file)
    event.target.value = ''
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    if (!values.title.trim() || !values.slug.trim() || !values.client.trim() || !values.location.trim()) {
      setFormError('Başlıq, slug, müştəri və məkan sahələri məcburidir.')
      return
    }

    setSaving(true)
    try {
      const slugChanged = !isEdit || values.slug !== project.slug
      if (slugChanged) {
        const taken = await isSlugTaken(values.slug, isEdit ? project.id : undefined)
        if (taken) {
          setFormError('Bu slug artıq istifadə olunub. Fərqli slug seçin.')
          setSaving(false)
          return
        }
      }

      const payload = buildPayload(values)
      if (slugChanged) payload.slug = values.slug.trim()

      if (isEdit) {
        await updateProject(project.id, payload)
        if (imageFile) {
          await replaceProjectImage({ ...project, slug: values.slug }, imageFile)
        }
      } else {
        let image_url = null
        let uploadedPath = null
        if (imageFile) {
          const uploaded = await uploadProjectImage(imageFile, values.slug)
          image_url = uploaded.publicUrl
          uploadedPath = uploaded.path
        }
        try {
          await createProject({ ...payload, image_url })
        } catch (err) {
          if (uploadedPath) await deleteUploadedObject(uploadedPath)
          throw err
        }
      }

      onSaved()
    } catch (err) {
      setFormError(err.message)
      setSaving(false)
    }
  }

  const localeTabLabel = useMemo(
    () => Object.fromEntries(LOCALES.map(({ key, label }) => [key, label])),
    [],
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-industrial-950/60 px-4 py-8" onClick={onClose}>
      <div
        className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-sm border border-industrial-950/10 bg-base-50"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-industrial-950/10 px-6 py-4">
          <h2 className="font-heading text-lg font-bold text-industrial-950">
            {isEdit ? 'Layihəni redaktə et' : 'Yeni layihə'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-sm text-neutral-custom-600 transition-colors hover:bg-industrial-950/5"
            aria-label="Bağla"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">Başlıq *</label>
              <input
                type="text"
                value={values.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className={FIELD_CLASSES}
                required
              />
            </div>

            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">Slug *</label>
              <input
                type="text"
                value={values.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setValues((prev) => ({ ...prev, slug: e.target.value }))
                }}
                className={FIELD_CLASSES}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">Müştəri *</label>
              <input
                type="text"
                value={values.client}
                onChange={(e) => setValues((prev) => ({ ...prev, client: e.target.value }))}
                className={FIELD_CLASSES}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">Məkan *</label>
              <input
                type="text"
                value={values.location}
                onChange={(e) => setValues((prev) => ({ ...prev, location: e.target.value }))}
                className={FIELD_CLASSES}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">Status</label>
              <select
                value={values.status}
                onChange={(e) => setValues((prev) => ({ ...prev, status: e.target.value }))}
                className={FIELD_CLASSES}
              >
                <option value="ongoing">Davam edir</option>
                <option value="completed">Tamamlanıb</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">Sıra nömrəsi</label>
              <input
                type="number"
                value={values.sort_order}
                onChange={(e) => setValues((prev) => ({ ...prev, sort_order: e.target.value }))}
                placeholder="avtomatik"
                className={FIELD_CLASSES}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">Başlanğıc tarixi</label>
              <input
                type="date"
                value={values.start_date}
                onChange={(e) => setValues((prev) => ({ ...prev, start_date: e.target.value }))}
                className={FIELD_CLASSES}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">Bitmə tarixi</label>
              <input
                type="date"
                value={values.end_date}
                onChange={(e) => setValues((prev) => ({ ...prev, end_date: e.target.value }))}
                className={FIELD_CLASSES}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">Təsdiqlənmiş bitmə tarixi</label>
              <input
                type="date"
                value={values.completion_date}
                onChange={(e) => setValues((prev) => ({ ...prev, completion_date: e.target.value }))}
                className={FIELD_CLASSES}
              />
            </div>

            <div className="col-span-2 flex items-center gap-2">
              <input
                id="published"
                type="checkbox"
                checked={values.published}
                onChange={(e) => setValues((prev) => ({ ...prev, published: e.target.checked }))}
                className="h-4 w-4 accent-ember-600"
              />
              <label htmlFor="published" className="text-sm text-industrial-950">
                Saytda dərc olunsun
              </label>
            </div>

            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">Şəkil</label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <img src={imagePreview} alt="" className="h-16 w-28 rounded-sm border border-industrial-950/10 object-cover" />
                ) : (
                  <div className="flex h-16 w-28 items-center justify-center rounded-sm border border-dashed border-industrial-950/20 text-neutral-custom-400">
                    <Upload size={18} />
                  </div>
                )}
                <label className="cursor-pointer rounded-sm border border-industrial-950/15 px-3.5 py-2 text-xs font-medium text-industrial-950 transition-colors hover:border-ember-600">
                  {imageFile ? 'Şəkli dəyiş' : imagePreview ? 'Şəkli əvəz et' : 'Şəkil seç'}
                  <input type="file" accept="image/webp,image/jpeg,image/png" onChange={handleImageChange} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {cropTarget && (
            <ImageCropModal
              file={cropTarget}
              aspectRatio={16 / 9}
              mode="crop"
              onCancel={() => setCropTarget(null)}
              onConfirm={(croppedFile) => {
                setImageFile(croppedFile)
                setCropTarget(null)
              }}
            />
          )}

          <div className="mt-6 border-t border-industrial-950/10 pt-5">
            <div className="flex gap-1">
              {LOCALES.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveLocale(key)}
                  className={`rounded-sm px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeLocale === key
                      ? 'bg-industrial-950 text-base-50'
                      : 'bg-industrial-950/5 text-neutral-custom-600 hover:bg-industrial-950/10'
                  }`}
                >
                  {label}
                  {key === 'az' && ' (əsas)'}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">
                Təsvir — {localeTabLabel[activeLocale]}
              </label>
              <textarea
                rows={4}
                value={values.description[activeLocale]}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    description: { ...prev.description, [activeLocale]: e.target.value },
                  }))
                }
                className={`${FIELD_CLASSES} resize-none`}
              />
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">
                Görülən işlər — {localeTabLabel[activeLocale]} <span className="font-normal normal-case text-neutral-custom-400">(hər sətir bir bənd)</span>
              </label>
              <textarea
                rows={4}
                value={values.workPerformed[activeLocale]}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    workPerformed: { ...prev.workPerformed, [activeLocale]: e.target.value },
                  }))
                }
                className={`${FIELD_CLASSES} resize-none`}
              />
            </div>
          </div>

          {formError && <p className="mt-5 text-sm text-ember-600">{formError}</p>}

          <div className="mt-6 flex justify-end gap-2 border-t border-industrial-950/10 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-sm px-4 py-2.5 text-sm font-medium text-neutral-custom-600 transition-colors hover:bg-industrial-950/5 disabled:opacity-50"
            >
              İmtina
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-sm bg-ember-600 px-5 py-2.5 text-sm font-semibold text-base-50 transition-colors hover:bg-ember-800 disabled:opacity-60"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              Yadda saxla
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
