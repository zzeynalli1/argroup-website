import { useEffect, useMemo, useState } from 'react'
import { Loader2, Upload, X } from 'lucide-react'
import {
  LOCALES,
  createAward,
  deleteUploadedObject,
  replaceAwardImage,
  updateAward,
  uploadAwardImage,
  validateAwardImageFile,
} from '../../../lib/cms/awards'

const LOCALE_LABELS = { az: 'AZ', en: 'EN', ru: 'RU', tr: 'TR' }

const FIELD_CLASSES =
  'w-full rounded-sm border border-industrial-950/15 bg-base-50 px-3.5 py-2.5 text-sm text-industrial-950 placeholder:text-neutral-custom-400 outline-none transition-colors focus:border-ember-600'

function emptyLocaleValues() {
  return { az: '', en: '', ru: '', tr: '' }
}

function valuesFromAward(award) {
  if (!award) {
    return {
      year: '',
      sort_order: '',
      published: true,
      title: emptyLocaleValues(),
      organization: emptyLocaleValues(),
      description: emptyLocaleValues(),
    }
  }

  const title = emptyLocaleValues()
  const organization = emptyLocaleValues()
  const description = emptyLocaleValues()
  for (const locale of LOCALES) {
    title[locale] = award[`title_${locale}`] ?? ''
    organization[locale] = award[`organization_${locale}`] ?? ''
    description[locale] = award[`description_${locale}`] ?? ''
  }

  return {
    year: award.year ?? '',
    sort_order: award.sort_order ?? '',
    published: award.published ?? true,
    title,
    organization,
    description,
  }
}

function buildPayload(values) {
  const payload = {
    year: values.year === '' ? null : Number(values.year),
    published: values.published,
  }
  if (values.sort_order !== '') payload.sort_order = Number(values.sort_order)

  for (const locale of LOCALES) {
    payload[`title_${locale}`] = values.title[locale].trim() || null
    payload[`organization_${locale}`] = values.organization[locale].trim() || null
    payload[`description_${locale}`] = values.description[locale].trim() || null
  }

  return payload
}

export default function AwardFormModal({ award, onClose, onSaved }) {
  const isEdit = Boolean(award)
  const [values, setValues] = useState(() => valuesFromAward(award))
  const [activeLocale, setActiveLocale] = useState('az')
  const [imageFile, setImageFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const imagePreview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : (award?.image_url ?? null)),
    [imageFile, award],
  )

  useEffect(() => {
    if (!imageFile) return undefined
    return () => URL.revokeObjectURL(imagePreview)
  }, [imageFile, imagePreview])

  function handleImageChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const validationError = validateAwardImageFile(file)
    if (validationError) {
      setFormError(validationError)
      event.target.value = ''
      return
    }
    setFormError('')
    setImageFile(file)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    if (!values.title.az.trim()) {
      setFormError('Başlıq (AZ) sahəsi məcburidir.')
      return
    }

    setSaving(true)
    try {
      const payload = buildPayload(values)

      if (isEdit) {
        await updateAward(award.id, payload)
        if (imageFile) {
          await replaceAwardImage(award, imageFile)
        }
      } else {
        let image_url = null
        let uploadedPath = null
        if (imageFile) {
          const uploaded = await uploadAwardImage(imageFile)
          image_url = uploaded.publicUrl
          uploadedPath = uploaded.path
        }
        try {
          await createAward({ ...payload, image_url })
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-industrial-950/60 px-4 py-8" onClick={onClose}>
      <div
        className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-sm border border-industrial-950/10 bg-base-50"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-industrial-950/10 px-6 py-4">
          <h2 className="font-heading text-lg font-bold text-industrial-950">{isEdit ? 'Mükafatı redaktə et' : 'Yeni mükafat'}</h2>
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
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">İl</label>
              <input
                type="number"
                value={values.year}
                onChange={(e) => setValues((prev) => ({ ...prev, year: e.target.value }))}
                placeholder="məs. 2023"
                className={FIELD_CLASSES}
              />
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

          <div className="mt-6 border-t border-industrial-950/10 pt-5">
            <div className="flex gap-1">
              {LOCALES.map((locale) => (
                <button
                  key={locale}
                  type="button"
                  onClick={() => setActiveLocale(locale)}
                  className={`rounded-sm px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeLocale === locale
                      ? 'bg-industrial-950 text-base-50'
                      : 'bg-industrial-950/5 text-neutral-custom-600 hover:bg-industrial-950/10'
                  }`}
                >
                  {LOCALE_LABELS[locale]}
                  {locale === 'az' && ' (əsas)'}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">
                Başlıq — {LOCALE_LABELS[activeLocale]} {activeLocale === 'az' && '*'}
              </label>
              <input
                type="text"
                value={values.title[activeLocale]}
                onChange={(e) => setValues((prev) => ({ ...prev, title: { ...prev.title, [activeLocale]: e.target.value } }))}
                className={FIELD_CLASSES}
              />
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">Təşkilat — {LOCALE_LABELS[activeLocale]}</label>
              <input
                type="text"
                value={values.organization[activeLocale]}
                onChange={(e) => setValues((prev) => ({ ...prev, organization: { ...prev.organization, [activeLocale]: e.target.value } }))}
                className={FIELD_CLASSES}
              />
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">Təsvir — {LOCALE_LABELS[activeLocale]}</label>
              <textarea
                rows={3}
                value={values.description[activeLocale]}
                onChange={(e) => setValues((prev) => ({ ...prev, description: { ...prev.description, [activeLocale]: e.target.value } }))}
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
