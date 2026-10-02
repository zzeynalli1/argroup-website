import { useEffect, useMemo, useState } from 'react'
import { Loader2, Upload, X } from 'lucide-react'
import {
  LOGO_SCALE_MAX,
  LOGO_SCALE_MIN,
  clampLogoScale,
  createBrand,
  deleteUploadedObject,
  replaceBrandLogo,
  updateBrand,
  uploadBrandLogo,
  validateBrandLogoFile,
} from '../../../lib/cms/brands'
import { validateExternalUrl } from '../../../lib/cms/urlValidation'
import ImageCropModal from '../../../components/admin/ImageCropModal'

const FIELD_CLASSES =
  'w-full rounded-sm border border-industrial-950/15 bg-base-50 px-3.5 py-2.5 text-sm text-industrial-950 placeholder:text-neutral-custom-400 outline-none transition-colors focus:border-ember-600'

function valuesFromBrand(brand) {
  if (!brand) {
    return { name: '', website_url: '', logo_scale: '1', sort_order: '', published: true }
  }
  return {
    name: brand.name ?? '',
    website_url: brand.website_url ?? '',
    logo_scale: String(brand.logo_scale ?? 1),
    sort_order: brand.sort_order ?? '',
    published: brand.published ?? true,
  }
}

function buildPayload(values) {
  const payload = {
    name: values.name.trim(),
    website_url: values.website_url.trim() || null,
    logo_scale: clampLogoScale(values.logo_scale),
    published: values.published,
  }
  if (values.sort_order !== '') payload.sort_order = Number(values.sort_order)
  return payload
}

export default function BrandFormModal({ brand, onClose, onSaved }) {
  const isEdit = Boolean(brand)
  const [values, setValues] = useState(() => valuesFromBrand(brand))
  const [logoFile, setLogoFile] = useState(null)
  const [cropTarget, setCropTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const logoPreview = useMemo(
    () => (logoFile ? URL.createObjectURL(logoFile) : (brand?.logo_url ?? null)),
    [logoFile, brand],
  )

  useEffect(() => {
    if (!logoFile) return undefined
    return () => URL.revokeObjectURL(logoPreview)
  }, [logoFile, logoPreview])

  function handleLogoChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const validationError = validateBrandLogoFile(file)
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

    if (!values.name.trim()) {
      setFormError('Ad sahəsi məcburidir.')
      return
    }
    if (!isEdit && !logoFile) {
      setFormError('Loqo şəkli məcburidir.')
      return
    }
    const urlError = validateExternalUrl(values.website_url)
    if (urlError) {
      setFormError(urlError)
      return
    }

    setSaving(true)
    try {
      const payload = buildPayload(values)

      if (isEdit) {
        await updateBrand(brand.id, payload)
        if (logoFile) {
          await replaceBrandLogo({ ...brand, name: values.name }, logoFile)
        }
      } else {
        const uploaded = await uploadBrandLogo(logoFile, values.name)
        try {
          await createBrand({ ...payload, logo_url: uploaded.publicUrl })
        } catch (err) {
          await deleteUploadedObject(uploaded.path)
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
        className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-sm border border-industrial-950/10 bg-base-50"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-industrial-950/10 px-6 py-4">
          <h2 className="font-heading text-lg font-bold text-industrial-950">{isEdit ? 'Brendi redaktə et' : 'Yeni brend'}</h2>
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
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">Ad *</label>
              <input
                type="text"
                value={values.name}
                onChange={(e) => setValues((prev) => ({ ...prev, name: e.target.value }))}
                className={FIELD_CLASSES}
                required
              />
            </div>

            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">Veb sayt (istəyə bağlı)</label>
              <input
                type="url"
                value={values.website_url}
                onChange={(e) => setValues((prev) => ({ ...prev, website_url: e.target.value }))}
                placeholder="https://..."
                className={FIELD_CLASSES}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">
                Loqo ölçüsü ({LOGO_SCALE_MIN}–{LOGO_SCALE_MAX})
              </label>
              <input
                type="number"
                step="0.01"
                min={LOGO_SCALE_MIN}
                max={LOGO_SCALE_MAX}
                value={values.logo_scale}
                onChange={(e) => setValues((prev) => ({ ...prev, logo_scale: e.target.value }))}
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
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">Loqo {!isEdit && '*'}</label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <img src={logoPreview} alt="" className="h-16 w-28 rounded-sm border border-industrial-950/10 object-contain p-1" />
                ) : (
                  <div className="flex h-16 w-28 items-center justify-center rounded-sm border border-dashed border-industrial-950/20 text-neutral-custom-400">
                    <Upload size={18} />
                  </div>
                )}
                <label className="cursor-pointer rounded-sm border border-industrial-950/15 px-3.5 py-2 text-xs font-medium text-industrial-950 transition-colors hover:border-ember-600">
                  {logoFile ? 'Loqonu dəyiş' : logoPreview ? 'Loqonu əvəz et' : 'Loqo seç'}
                  <input type="file" accept="image/webp,image/jpeg,image/png" onChange={handleLogoChange} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {cropTarget && (
            <ImageCropModal
              file={cropTarget}
              aspectRatio={2 / 1}
              mode="preview"
              onCancel={() => setCropTarget(null)}
              onConfirm={(confirmedFile) => {
                setLogoFile(confirmedFile)
                setCropTarget(null)
              }}
            />
          )}

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
