import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Loader2, Upload, X } from 'lucide-react'
import {
  createTeamMember,
  deleteUploadedObject,
  getValidParentOptions,
  replaceTeamPhoto,
  updateTeamMember,
  uploadTeamPhoto,
  validateTeamPhotoFile,
} from '../../../lib/cms/teamMembers'
import ImageCropModal from '../../../components/admin/ImageCropModal'

const LOCALES = ['az', 'en', 'ru', 'tr']
const LOCALE_LABELS = { az: 'AZ', en: 'EN', ru: 'RU', tr: 'TR' }

const FIELD_CLASSES =
  'w-full rounded-sm border border-industrial-950/15 bg-base-50 px-3.5 py-2.5 text-sm text-industrial-950 placeholder:text-neutral-custom-400 outline-none transition-colors focus:border-ember-600'

function emptyLocaleValues() {
  return { az: '', en: '', ru: '', tr: '' }
}

function valuesFromMember(member) {
  if (!member) {
    return { name: '', phone: '', email: '', category_id: '', parent_id: '', sort_order: '', published: true, position: emptyLocaleValues() }
  }

  const position = emptyLocaleValues()
  for (const locale of LOCALES) {
    position[locale] = member[`position_${locale}`] ?? ''
  }

  return {
    name: member.name ?? '',
    phone: member.phone ?? '',
    email: member.email ?? '',
    category_id: member.category_id == null ? '' : String(member.category_id),
    parent_id: member.parent_id == null ? '' : String(member.parent_id),
    sort_order: member.sort_order ?? '',
    published: member.published ?? true,
    position,
  }
}

function buildPayload(values) {
  const payload = {
    name: values.name.trim() || null,
    phone: values.phone.trim() || null,
    email: values.email.trim() || null,
    category_id: values.category_id === '' ? null : Number(values.category_id),
    parent_id: values.parent_id === '' ? null : Number(values.parent_id),
    published: values.published,
  }
  if (values.sort_order !== '') payload.sort_order = Number(values.sort_order)

  for (const locale of LOCALES) {
    payload[`position_${locale}`] = values.position[locale].trim() || null
  }

  return payload
}

export default function TeamMemberFormModal({ member, allMembers, categories = [], onGoToCategories, onClose, onSaved }) {
  const isEdit = Boolean(member)
  const [values, setValues] = useState(() => valuesFromMember(member))
  const [activeLocale, setActiveLocale] = useState('az')
  const [photoFile, setPhotoFile] = useState(null)
  const [cropTarget, setCropTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const parentOptions = useMemo(
    () => getValidParentOptions(allMembers, isEdit ? member.id : undefined),
    [allMembers, isEdit, member],
  )

  const photoPreview = useMemo(
    () => (photoFile ? URL.createObjectURL(photoFile) : (member?.photo_url ?? null)),
    [photoFile, member],
  )

  useEffect(() => {
    if (!photoFile) return undefined
    return () => URL.revokeObjectURL(photoPreview)
  }, [photoFile, photoPreview])

  function handlePhotoChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const validationError = validateTeamPhotoFile(file)
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

    if (!values.position.az.trim()) {
      setFormError('Vəzifə (AZ) sahəsi məcburidir.')
      return
    }

    setSaving(true)
    try {
      const payload = buildPayload(values)

      if (isEdit) {
        await updateTeamMember(member.id, payload)
        if (photoFile) {
          await replaceTeamPhoto({ ...member, name: values.name }, photoFile)
        }
      } else {
        let photo_url = null
        let uploadedPath = null
        if (photoFile) {
          const uploaded = await uploadTeamPhoto(photoFile, values.name)
          photo_url = uploaded.publicUrl
          uploadedPath = uploaded.path
        }
        try {
          await createTeamMember({ ...payload, photo_url })
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
        className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-sm border border-industrial-950/10 bg-base-50"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-industrial-950/10 px-6 py-4">
          <h2 className="font-heading text-lg font-bold text-industrial-950">{isEdit ? 'Üzvü/Rolu redaktə et' : 'Yeni üzv/rol'}</h2>
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
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">Ad və soyad</label>
              <input
                type="text"
                value={values.name}
                onChange={(e) => setValues((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Təsdiqlənmiş şəxs yoxdursa boş buraxın"
                className={FIELD_CLASSES}
              />
            </div>

            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">Kateqoriya</label>
              <p className="mb-1.5 text-xs text-neutral-custom-400">Bu əməkdaş hansı qrupa aiddir?</p>
              {categories.length === 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-dashed border-industrial-950/20 bg-industrial-950/[0.02] px-3.5 py-2.5">
                  <span className="text-sm text-neutral-custom-600">Hələ komanda kateqoriyası yaradılmayıb.</span>
                  {onGoToCategories && (
                    <button
                      type="button"
                      onClick={onGoToCategories}
                      className="flex shrink-0 items-center gap-1 text-xs font-semibold text-ember-600 hover:text-ember-800"
                    >
                      Kateqoriya yarat
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              ) : (
                <select
                  value={values.category_id}
                  onChange={(e) => setValues((prev) => ({ ...prev, category_id: e.target.value }))}
                  className={FIELD_CLASSES}
                >
                  <option value="">— Kateqoriya seçilməyib —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name_az}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">Telefon</label>
              <input
                type="tel"
                value={values.phone}
                onChange={(e) => setValues((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+994 55 490 74 24"
                className={FIELD_CLASSES}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">E-poçt</label>
              <input
                type="email"
                value={values.email}
                onChange={(e) => setValues((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="ad.soyad@argroup.az"
                className={FIELD_CLASSES}
              />
            </div>

            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">Kimə tabedir?</label>
              <p className="mb-1.5 text-xs text-neutral-custom-400">İyerarxiyada əməkdaşın birbaşa tabe olduğu şəxsi seçin.</p>
              <select
                value={values.parent_id}
                onChange={(e) => setValues((prev) => ({ ...prev, parent_id: e.target.value }))}
                className={FIELD_CLASSES}
              >
                <option value="">— Heç kimə (üst səviyyə) —</option>
                {parentOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name ? `${opt.name} — ${opt.position_az}` : opt.position_az}
                  </option>
                ))}
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

            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-neutral-custom-600">Şəkil</label>
              <div className="flex items-center gap-4">
                {photoPreview ? (
                  <img src={photoPreview} alt="" className="h-16 w-16 rounded-full border border-industrial-950/10 object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-industrial-950/20 text-neutral-custom-400">
                    <Upload size={18} />
                  </div>
                )}
                <label className="cursor-pointer rounded-sm border border-industrial-950/15 px-3.5 py-2 text-xs font-medium text-industrial-950 transition-colors hover:border-ember-600">
                  {photoFile ? 'Şəkli dəyiş' : photoPreview ? 'Şəkli əvəz et' : 'Şəkil seç'}
                  <input type="file" accept="image/webp,image/jpeg,image/png" onChange={handlePhotoChange} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {cropTarget && (
            <ImageCropModal
              file={cropTarget}
              aspectRatio={1}
              mode="crop"
              onCancel={() => setCropTarget(null)}
              onConfirm={(croppedFile) => {
                setPhotoFile(croppedFile)
                setCropTarget(null)
              }}
            />
          )}

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
                Vəzifə — {LOCALE_LABELS[activeLocale]} {activeLocale === 'az' && '*'}
              </label>
              <p className="mb-1.5 text-xs text-neutral-custom-400">Bu əməkdaşın konkret vəzifəsi nədir?</p>
              <input
                type="text"
                value={values.position[activeLocale]}
                onChange={(e) => setValues((prev) => ({ ...prev, position: { ...prev.position, [activeLocale]: e.target.value } }))}
                className={FIELD_CLASSES}
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
