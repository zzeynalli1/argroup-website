import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { createCategory, updateCategory } from '../../../lib/cms/teamCategories'

const LOCALES = ['az', 'en', 'ru', 'tr']
const LOCALE_LABELS = { az: 'AZ', en: 'EN', ru: 'RU', tr: 'TR' }

const FIELD_CLASSES =
  'w-full rounded-sm border border-industrial-950/15 bg-base-50 px-3.5 py-2.5 text-sm text-industrial-950 placeholder:text-neutral-custom-400 outline-none transition-colors focus:border-ember-600'

function emptyLocaleValues() {
  return { az: '', en: '', ru: '', tr: '' }
}

function valuesFromCategory(category) {
  if (!category) {
    return { sort_order: '', published: true, name: emptyLocaleValues() }
  }

  const name = emptyLocaleValues()
  for (const locale of LOCALES) {
    name[locale] = category[`name_${locale}`] ?? ''
  }

  return { sort_order: category.sort_order ?? '', published: category.published ?? true, name }
}

function buildPayload(values) {
  const payload = { published: values.published }
  if (values.sort_order !== '') payload.sort_order = Number(values.sort_order)

  for (const locale of LOCALES) {
    payload[`name_${locale}`] = values.name[locale].trim() || null
  }

  return payload
}

/** Minimal CRUD form — organizational label only (name per locale, order,
 * published). Deliberately has no position/photo/parent fields; those
 * belong to team members, not categories (see the approved spec's
 * "categories and hierarchy serve different purposes" distinction). */
export default function TeamCategoryFormModal({ category, onClose, onSaved }) {
  const isEdit = Boolean(category)
  const [values, setValues] = useState(() => valuesFromCategory(category))
  const [activeLocale, setActiveLocale] = useState('az')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    if (!values.name.az.trim()) {
      setFormError('Ad (AZ) sahəsi məcburidir.')
      return
    }

    setSaving(true)
    try {
      const payload = buildPayload(values)
      if (isEdit) {
        await updateCategory(category.id, payload)
      } else {
        await createCategory(payload)
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
        className="flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-sm border border-industrial-950/10 bg-base-50"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-industrial-950/10 px-6 py-4">
          <h2 className="font-heading text-lg font-bold text-industrial-950">{isEdit ? 'Kateqoriyanı redaktə et' : 'Yeni kateqoriya'}</h2>
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
              Ad — {LOCALE_LABELS[activeLocale]} {activeLocale === 'az' && '*'}
            </label>
            <input
              type="text"
              value={values.name[activeLocale]}
              onChange={(e) => setValues((prev) => ({ ...prev, name: { ...prev.name, [activeLocale]: e.target.value } }))}
              className={FIELD_CLASSES}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
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

            <div className="flex items-center gap-2 self-end pb-2.5">
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
