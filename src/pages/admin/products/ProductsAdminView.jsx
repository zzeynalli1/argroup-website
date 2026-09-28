import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Eye, EyeOff, ImageOff, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { deleteProduct, fetchAllProductsForAdmin, moveProduct, setPublished } from '../../../lib/cms/products'
import { useTranslation } from '../../../lib/i18n/useTranslation'
import ConfirmDialog from '../../../components/admin/ConfirmDialog'
import ProductFormModal from './ProductFormModal'

export default function ProductsAdminView() {
  const { t } = useTranslation('products')
  const [products, setProducts] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [formState, setFormState] = useState(null) // null | 'create' | <product>
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setLoadError('')
    try {
      const data = await fetchAllProductsForAdmin()
      setProducts(data)
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

  function siblingsOf(product) {
    return (products ?? []).filter((p) => p.category_key === product.category_key).sort((a, b) => a.sort_order - b.sort_order)
  }

  async function handleTogglePublished(product) {
    setActionError('')
    setBusyId(product.id)
    try {
      await setPublished(product.id, !product.published)
      await load()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleMove(product, direction) {
    setActionError('')
    setBusyId(product.id)
    try {
      await moveProduct(siblingsOf(product), product.id, direction)
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
      await deleteProduct(deleteTarget.id)
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
          <h1 className="font-heading text-2xl font-bold text-industrial-950">Məhsullar</h1>
          <p className="mt-1 text-sm text-neutral-custom-600">Məhsul kateqoriyaları daxilindəki məhsulların idarə edilməsi.</p>
        </div>
        <button
          type="button"
          onClick={() => setFormState('create')}
          className="flex shrink-0 items-center gap-2 rounded-sm bg-ember-600 px-4 py-2.5 text-sm font-semibold text-base-50 transition-colors hover:bg-ember-800"
        >
          <Plus size={16} />
          Yeni məhsul
        </button>
      </div>

      {(loadError || actionError) && (
        <p className="mt-4 rounded-sm border border-ember-600/30 bg-ember-600/5 px-4 py-3 text-sm text-ember-800">
          {loadError || actionError}
        </p>
      )}

      {products === null && !loadError ? (
        <div className="mt-10 flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-neutral-custom-400" size={24} />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-sm border border-industrial-950/10 bg-base-50">
          <table className="w-full min-w-[880px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-industrial-950/10 bg-industrial-950/[0.03] text-left text-xs uppercase tracking-wide text-neutral-custom-600">
                <th className="px-4 py-3 font-semibold">Şəkil</th>
                <th className="px-4 py-3 font-semibold">Ad</th>
                <th className="px-4 py-3 font-semibold">Kateqoriya</th>
                <th className="px-4 py-3 font-semibold">Brend</th>
                <th className="px-4 py-3 font-semibold">Şəkil sayı</th>
                <th className="px-4 py-3 font-semibold">Dərc</th>
                <th className="px-4 py-3 font-semibold">Sıra</th>
                <th className="px-4 py-3 text-right font-semibold">Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {(products ?? []).map((product) => {
                const siblings = siblingsOf(product)
                const siblingIndex = siblings.findIndex((s) => s.id === product.id)
                return (
                  <tr key={product.id} className="border-b border-industrial-950/5 last:border-0">
                    <td className="px-4 py-3">
                      {product.image_urls?.[0] ? (
                        <img src={product.image_urls[0]} alt="" className="h-12 w-16 rounded-sm border border-industrial-950/10 object-contain p-1" />
                      ) : (
                        <div className="flex h-12 w-16 items-center justify-center rounded-sm bg-industrial-950/5 text-neutral-custom-400">
                          <ImageOff size={16} />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-industrial-950">{product.name}</td>
                    <td className="px-4 py-3 text-neutral-custom-600">{t(`items.${product.category_key}.name`)}</td>
                    <td className="px-4 py-3 text-neutral-custom-600">{product.brand || '—'}</td>
                    <td className="px-4 py-3 text-neutral-custom-600">{product.image_urls?.length ?? 0}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={busyId === product.id}
                        onClick={() => handleTogglePublished(product)}
                        className={`flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                          product.published ? 'text-success-600' : 'text-neutral-custom-600'
                        }`}
                      >
                        {product.published ? <Eye size={14} /> : <EyeOff size={14} />}
                        {product.published ? 'Dərc olunub' : 'Gizli'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={siblingIndex === 0 || busyId === product.id}
                          onClick={() => handleMove(product, 'up')}
                          className="flex h-7 w-7 items-center justify-center rounded-sm text-neutral-custom-600 transition-colors hover:bg-industrial-950/5 disabled:opacity-30"
                          aria-label="Yuxarı"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={siblingIndex === siblings.length - 1 || busyId === product.id}
                          onClick={() => handleMove(product, 'down')}
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
                          onClick={() => setFormState(product)}
                          className="flex h-8 w-8 items-center justify-center rounded-sm text-neutral-custom-600 transition-colors hover:bg-industrial-950/5 hover:text-industrial-950"
                          aria-label="Redaktə et"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(product)}
                          className="flex h-8 w-8 items-center justify-center rounded-sm text-neutral-custom-600 transition-colors hover:bg-ember-600/10 hover:text-ember-600"
                          aria-label="Sil"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {products?.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-neutral-custom-600">
                    Hələ heç bir məhsul əlavə edilməyib.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {formState && (
        <ProductFormModal
          product={formState === 'create' ? null : formState}
          onClose={() => setFormState(null)}
          onSaved={() => {
            setFormState(null)
            load()
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Məhsulu sil"
          message={`"${deleteTarget.name}" məhsulunu silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.`}
          confirmLabel="Sil"
          busy={busyId === deleteTarget.id}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  )
}
