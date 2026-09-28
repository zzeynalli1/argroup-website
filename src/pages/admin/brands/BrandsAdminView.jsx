import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Eye, EyeOff, ImageOff, Link2, Link2Off, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { deleteBrand, fetchAllBrandsForAdmin, moveBrand, setPublished } from '../../../lib/cms/brands'
import ConfirmDialog from '../../../components/admin/ConfirmDialog'
import BrandFormModal from './BrandFormModal'

export default function BrandsAdminView() {
  const [brands, setBrands] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [formState, setFormState] = useState(null) // null | 'create' | <brand>
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setLoadError('')
    try {
      const data = await fetchAllBrandsForAdmin()
      setBrands(data)
    } catch (err) {
      setLoadError(err.message)
    }
  }

  useEffect(() => {
    async function run() {
      await load()
    }
    run()
  }, [])

  async function handleTogglePublished(brand) {
    setActionError('')
    setBusyId(brand.id)
    try {
      await setPublished(brand.id, !brand.published)
      await load()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleMove(brand, direction) {
    setActionError('')
    setBusyId(brand.id)
    try {
      await moveBrand(brands, brand.id, direction)
      await load()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setActionError('')
    setBusyId(deleteTarget.id)
    try {
      await deleteBrand(deleteTarget.id)
      setDeleteTarget(null)
      await load()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-industrial-950">Brendlər</h1>
          <p className="mt-1 text-sm text-neutral-custom-600">Ana səhifədəki Brendlər şəbəkəsinin idarə edilməsi.</p>
        </div>
        <button
          type="button"
          onClick={() => setFormState('create')}
          className="flex shrink-0 items-center gap-2 rounded-sm bg-ember-600 px-4 py-2.5 text-sm font-semibold text-base-50 transition-colors hover:bg-ember-800"
        >
          <Plus size={16} />
          Yeni brend
        </button>
      </div>

      {(loadError || actionError) && (
        <p className="mt-4 rounded-sm border border-ember-600/30 bg-ember-600/5 px-4 py-3 text-sm text-ember-800">
          {loadError || actionError}
        </p>
      )}

      {brands === null && !loadError ? (
        <div className="mt-10 flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-neutral-custom-400" size={24} />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-sm border border-industrial-950/10 bg-base-50">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-industrial-950/10 bg-industrial-950/[0.03] text-left text-xs uppercase tracking-wide text-neutral-custom-600">
                <th className="px-4 py-3 font-semibold">Loqo</th>
                <th className="px-4 py-3 font-semibold">Ad</th>
                <th className="px-4 py-3 font-semibold">Link</th>
                <th className="px-4 py-3 font-semibold">Dərc</th>
                <th className="px-4 py-3 font-semibold">Sıra</th>
                <th className="px-4 py-3 text-right font-semibold">Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {(brands ?? []).map((brand, index) => (
                <tr key={brand.id} className="border-b border-industrial-950/5 last:border-0">
                  <td className="px-4 py-3">
                    {brand.logo_url ? (
                      <img src={brand.logo_url} alt="" className="h-12 w-20 rounded-sm border border-industrial-950/10 object-contain p-1" />
                    ) : (
                      <div className="flex h-12 w-20 items-center justify-center rounded-sm bg-industrial-950/5 text-neutral-custom-400">
                        <ImageOff size={16} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-industrial-950">{brand.name}</td>
                  <td className="px-4 py-3">
                    {brand.website_url ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-neutral-custom-600">
                        <Link2 size={13} className="text-ember-600" />
                        Var
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-neutral-custom-400">
                        <Link2Off size={13} />
                        Yoxdur
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={busyId === brand.id}
                      onClick={() => handleTogglePublished(brand)}
                      className={`flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                        brand.published ? 'text-success-600' : 'text-neutral-custom-600'
                      }`}
                    >
                      {brand.published ? <Eye size={14} /> : <EyeOff size={14} />}
                      {brand.published ? 'Dərc olunub' : 'Gizli'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0 || busyId === brand.id}
                        onClick={() => handleMove(brand, 'up')}
                        className="flex h-7 w-7 items-center justify-center rounded-sm text-neutral-custom-600 transition-colors hover:bg-industrial-950/5 disabled:opacity-30"
                        aria-label="Yuxarı"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={index === brands.length - 1 || busyId === brand.id}
                        onClick={() => handleMove(brand, 'down')}
                        className="flex h-7 w-7 items-center justify-center rounded-sm text-neutral-custom-600 transition-colors hover:bg-industrial-950/5 disabled:opacity-30"
                        aria-label="Aşağı"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setFormState(brand)}
                        className="flex h-8 w-8 items-center justify-center rounded-sm text-neutral-custom-600 transition-colors hover:bg-industrial-950/5 hover:text-industrial-950"
                        aria-label="Redaktə et"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(brand)}
                        className="flex h-8 w-8 items-center justify-center rounded-sm text-neutral-custom-600 transition-colors hover:bg-ember-600/10 hover:text-ember-600"
                        aria-label="Sil"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {brands?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-neutral-custom-600">
                    Hələ heç bir brend əlavə edilməyib.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {formState && (
        <BrandFormModal
          brand={formState === 'create' ? null : formState}
          onClose={() => setFormState(null)}
          onSaved={() => {
            setFormState(null)
            load()
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Brendi sil"
          message={`"${deleteTarget.name}" brendini silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.`}
          confirmLabel="Sil"
          busy={busyId === deleteTarget.id}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  )
}
