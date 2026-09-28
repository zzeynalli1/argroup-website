import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Loader2, Trash2, Upload, X } from 'lucide-react'
import {
  FIXED_CATEGORY_KEYS,
  addProductImages,
  createProduct,
  removeProductImage,
  reorderProductImages,
  replaceProductImage,
  updateProduct,
  validateProductImageFile,
} from '../../../lib/cms/products'
import { useTranslation } from '../../../lib/i18n/useTranslation'

const LOCALES = ['az', 'en', 'ru', 'tr']
const LOCALE_LABELS = { az: 'AZ', en: 'EN', ru: 'RU', tr: 'TR' }

const FIELD_CLASSES =
  'w-full rounded-sm border border-industrial-950/15 bg-base-50 px-3.5 py-2.5 text-sm text-industrial-950 placeholder:text-neutral-custom-400 outline-none transition-colors focus:border-ember-600'

function emptyLocaleValues() {
  return { az: '', en: '', ru: '', tr: '' }
}

function valuesFromProduct(product) {
  if (!product) {
    return {
      category_key: FIXED_CATEGORY_KEYS[0],
      name: '',
      brand: '',
      external_link: '',
      sort_order: '',
      published: true,
      description: emptyLocaleValues(),
    }
  }

  const description = emptyLocaleValues()
  for (const locale of LOCALES) {
    description[locale] = product[`description_${locale}`] ?? ''
  }

  return {
    category_key: product.category_key,
    name: product.name ?? '',
    brand: product.brand ?? '',
    external_link: product.external_link ?? '',
    sort_order: product.sort_order ?? '',
    published: product.published ?? true,
    description,
  }
}

function buildPayload(values) {
  const payload = {
    category_key: values.category_key,
    name: values.name.trim(),
    brand: values.brand.trim() || null,
    external_link: values.external_link.trim() || null,
    published: values.published,
  }
  if (values.sort_order !== '') payload.sort_order = Number(values.sort_order)

  for (const locale of LOCALES) {
    payload[`description_${locale}`] = values.description[locale].trim() || null
  }

  return payload
}

/** Staged, unsaved file with a local preview URL — used only in create mode. */
function StagedImageRow({ file, previewUrl, onRemove }) {
  return (
    <div className="flex items-center gap-3 rounded-sm border border-industrial-950/10 bg-base-50 p-2">
      <img src={previewUrl} alt="" className="h-12 w-16 shrink-0 rounded-sm border border-industrial-950/10 object-contain p-1" />
      <span className="min-w-0 flex-1 truncate text-xs text-neutral-custom-600">{file.name}</span>
      <button type="button" onClick={onRemove} className="shrink-0 text-neutral-custom-400 hover:text-ember-600" aria-label="Sil">
        <Trash2 size={15} />
      </button>
    </div>
  )
}

/** Live, already-persisted image — every action here hits the DB immediately. */
function LiveImageRow({ url, index, total, busy, onMoveUp, onMoveDown, onReplace, onRemove }) {
  return (
    <div className="flex items-center gap-3 rounded-sm border border-industrial-950/10 bg-base-50 p-2">
      <img src={url} alt="" className="h-12 w-16 shrink-0 rounded-sm border border-industrial-950/10 object-contain p-1" />
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          disabled={index === 0 || busy}
          onClick={onMoveUp}
          className="flex h-7 w-7 items-center justify-center rounded-sm text-neutral-custom-600 transition-colors hover:bg-industrial-950/5 disabled:opacity-30"
          aria-label="Sola"
        >
          <ArrowUp size={14} />
        </button>
        <button
          type="button"
          disabled={index === total - 1 || busy}
          onClick={onMoveDown}
          className="flex h-7 w-7 items-center justify-center rounded-sm text-neutral-custom-600 transition-colors hover:bg-industrial-950/5 disabled:opacity-30"
          aria-label="Sağa"
        >
          <ArrowDown size={14} />
        </button>
      </div>
      <label className="cursor-pointer rounded-sm border border-industrial-950/15 px-2.5 py-1.5 text-xs font-medium text-industrial-950 transition-colors hover:border-ember-600">
        {busy ? <Loader2 size={13} className="animate-spin" /> : 'Əvəz et'}
        <input type="file" accept="image/webp,image/jpeg,image/png" onChange={onReplace} disabled={busy} className="hidden" />
      </label>
      <button type="button" disabled={busy} onClick={onRemove} className="shrink-0 text-neutral-custom-400 hover:text-ember-600 disabled:opacity-50" aria-label="Sil">
        <Trash2 size={15} />
      </button>
    </div>
  )
}

export default function ProductFormModal({ product, onClose, onSaved }) {
  const { t } = useTranslation('products')
  const isEdit = Boolean(product)
  const [values, setValues] = useState(() => valuesFromProduct(product))
  const [activeLocale, setActiveLocale] = useState('az')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Edit mode: the live persisted product, refreshed after every image
  // action (each one is an immediate DB write — see LiveImageRow above).
  const [liveProduct, setLiveProduct] = useState(product)
  const [imageBusyUrl, setImageBusyUrl] = useState(null)
  const [imageActionError, setImageActionError] = useState('')

  // Create mode only: staged files, uploaded together on first save.
  const [stagedFiles, setStagedFiles] = useState([])
  const stagedPreviews = useMemo(() => stagedFiles.map((f) => URL.createObjectURL(f)), [stagedFiles])
  useEffect(() => {
    return () => stagedPreviews.forEach((url) => URL.revokeObjectURL(url))
  }, [stagedPreviews])

  function handleStagedFilesChange(event) {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return
    for (const file of files) {
      const validationError = validateProductImageFile(file)
      if (validationError) {
        setFormError(validationError)
        event.target.value = ''
        return
      }
    }
    setFormError('')
    setStagedFiles((prev) => [...prev, ...files])
    event.target.value = ''
  }

  function removeStagedFile(index) {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleAddLiveImages(event) {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return
    for (const file of files) {
      const validationError = validateProductImageFile(file)
      if (validationError) {
        setImageActionError(validationError)
        event.target.value = ''
        return
      }
    }
    setImageActionError('')
    setImageBusyUrl('__adding__')
    try {
      const updated = await addProductImages(liveProduct, files)
      setLiveProduct(updated)
    } catch (err) {
      setImageActionError(err.message)
    } finally {
      setImageBusyUrl(null)
      event.target.value = ''
    }
  }

  async function handleRemoveLiveImage(url) {
    setImageActionError('')
    setImageBusyUrl(url)
    try {
      const updated = await removeProductImage(liveProduct, url)
      setLiveProduct(updated)
    } catch (err) {
      setImageActionError(err.message)
    } finally {
      setImageBusyUrl(null)
    }
  }

  async function handleReplaceLiveImage(url, event) {
    const file = event.target.files?.[0]
    if (!file) return
    const validationError = validateProductImageFile(file)
    if (validationError) {
      setImageActionError(validationError)
      event.target.value = ''
      return
    }
    setImageActionError('')
    setImageBusyUrl(url)
    try {
      const updated = await replaceProductImage(liveProduct, url, file)
      setLiveProduct(updated)
    } catch (err) {
      setImageActionError(err.message)
    } finally {
      setImageBusyUrl(null)
      event.target.value = ''
    }
  }

  async function handleMoveLiveImage(index, direction) {
    const urls = [...liveProduct.image_urls]
    const swapWith = direction === 'up' ? index - 1 : index + 1
    if (swapWith < 0 || swapWith >= urls.length) return
    ;[urls[index], urls[swapWith]] = [urls[swapWith], urls[index]]

    setImageActionError('')
    setImageBusyUrl(urls[index])
    try {
      const updated = await reorderProductImages(liveProduct, urls)
      setLiveProduct(updated)
    } catch (err) {
      setImageActionError(err.message)
    } finally {
      setImageBusyUrl(null)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    if (!values.name.trim()) {
      setFormError('Ad sahəsi məcburidir.')
      return
    }

    setSaving(true)
    try {
      const payload = buildPayload(values)

      if (isEdit) {
        await updateProduct(product.id, payload)
      } else {
        const created = await createProduct(payload)
        if (stagedFiles.length > 0) {
          await addProductImages(created, stagedFiles)
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
          <h2 className="font-heading text-lg font-bold text-industrial-950">{isEdit ? 'Məhsulu redaktə et' : 'Yeni məhsul'}</h2>
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
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">Kateqoriya *</label>
              <select
                value={values.category_key}
                onChange={(e) => setValues((prev) => ({ ...prev, category_key: e.target.value }))}
                className={FIELD_CLASSES}
                required
              >
                {FIXED_CATEGORY_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {t(`items.${key}.name`)}
                  </option>
                ))}
              </select>
            </div>

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

            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">Brend (istəyə bağlı)</label>
              <input
                type="text"
                value={values.brand}
                onChange={(e) => setValues((prev) => ({ ...prev, brand: e.target.value }))}
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

            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">Xarici link (istəyə bağlı)</label>
              <input
                type="url"
                value={values.external_link}
                onChange={(e) => setValues((prev) => ({ ...prev, external_link: e.target.value }))}
                placeholder="https://..."
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
          </div>

          <div className="mt-6 border-t border-industrial-950/10 pt-5">
            <label className="mb-2 block text-xs font-medium text-neutral-custom-600">Şəkillər</label>

            {isEdit ? (
              <div className="space-y-2">
                {(liveProduct.image_urls ?? []).map((url, index) => (
                  <LiveImageRow
                    key={url}
                    url={url}
                    index={index}
                    total={liveProduct.image_urls.length}
                    busy={imageBusyUrl === url || imageBusyUrl === '__adding__'}
                    onMoveUp={() => handleMoveLiveImage(index, 'up')}
                    onMoveDown={() => handleMoveLiveImage(index, 'down')}
                    onReplace={(e) => handleReplaceLiveImage(url, e)}
                    onRemove={() => handleRemoveLiveImage(url)}
                  />
                ))}
                {(liveProduct.image_urls ?? []).length === 0 && (
                  <p className="text-xs text-neutral-custom-400">Hələ şəkil əlavə edilməyib.</p>
                )}
                {imageActionError && <p className="text-xs text-ember-600">{imageActionError}</p>}
                <label className="mt-1 flex w-fit cursor-pointer items-center gap-2 rounded-sm border border-industrial-950/15 px-3.5 py-2 text-xs font-medium text-industrial-950 transition-colors hover:border-ember-600">
                  {imageBusyUrl === '__adding__' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  Şəkil əlavə et
                  <input type="file" accept="image/webp,image/jpeg,image/png" multiple onChange={handleAddLiveImages} disabled={Boolean(imageBusyUrl)} className="hidden" />
                </label>
              </div>
            ) : (
              <div className="space-y-2">
                {stagedFiles.map((file, index) => (
                  <StagedImageRow key={`${file.name}-${index}`} file={file} previewUrl={stagedPreviews[index]} onRemove={() => removeStagedFile(index)} />
                ))}
                <label className="mt-1 flex w-fit cursor-pointer items-center gap-2 rounded-sm border border-industrial-950/15 px-3.5 py-2 text-xs font-medium text-industrial-950 transition-colors hover:border-ember-600">
                  <Upload size={14} />
                  Şəkil seç
                  <input type="file" accept="image/webp,image/jpeg,image/png" multiple onChange={handleStagedFilesChange} className="hidden" />
                </label>
              </div>
            )}
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
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">Təsvir — {LOCALE_LABELS[activeLocale]}</label>
              <textarea
                rows={4}
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
