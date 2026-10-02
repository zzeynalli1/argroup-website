import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { deleteCategory, fetchAllCategoriesForAdmin, moveCategory, setPublished } from '../../../lib/cms/teamCategories'
import ConfirmDialog from '../../../components/admin/ConfirmDialog'
import TeamCategoryFormModal from './TeamCategoryFormModal'

/**
 * Purely organizational labels for team members (category_id) — deliberately
 * NOT the reporting hierarchy (see TeamMembersAdminView's own parent_id tree,
 * a sibling tab). No categories are seeded here; the client creates whatever
 * matches their real organization.
 */
export default function TeamCategoriesAdminView() {
  const [categories, setCategories] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [formState, setFormState] = useState(null) // null | 'create' | <category>
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setLoadError('')
    try {
      const data = await fetchAllCategoriesForAdmin()
      setCategories(data)
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

  async function handleTogglePublished(category) {
    setActionError('')
    setBusyId(category.id)
    try {
      await setPublished(category.id, !category.published)
      await load()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleMove(category, direction) {
    setActionError('')
    setBusyId(category.id)
    try {
      await moveCategory(categories, category.id, direction)
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
      await deleteCategory(deleteTarget.id)
      setDeleteTarget(null)
      await load()
    } catch (err) {
      // Friendly FK-restrict message (cms/teamCategories.js) shown inline —
      // the dialog itself is closed so the message reads in the page, not
      // trapped behind the confirm modal.
      setDeleteTarget(null)
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="max-w-lg text-sm text-neutral-custom-600">
          Komanda üzvlərini qruplaşdırmaq üçün təşkilati kateqoriyalar. Bu, "Kimə tabedir?" iyerarxiyasından asılı deyil.
        </p>
        <button
          type="button"
          onClick={() => setFormState('create')}
          className="flex shrink-0 items-center gap-2 rounded-sm bg-ember-600 px-4 py-2.5 text-sm font-semibold text-base-50 transition-colors hover:bg-ember-800"
        >
          <Plus size={16} />
          Yeni kateqoriya
        </button>
      </div>

      {(loadError || actionError) && (
        <p className="mt-4 rounded-sm border border-ember-600/30 bg-ember-600/5 px-4 py-3 text-sm text-ember-800">
          {loadError || actionError}
        </p>
      )}

      {categories === null && !loadError ? (
        <div className="mt-10 flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-neutral-custom-400" size={24} />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-sm border border-industrial-950/10 bg-base-50">
          <table className="w-full min-w-[600px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-industrial-950/10 bg-industrial-950/[0.03] text-left text-xs uppercase tracking-wide text-neutral-custom-600">
                <th className="px-4 py-3 font-semibold">Ad (AZ)</th>
                <th className="px-4 py-3 font-semibold">Dərc</th>
                <th className="px-4 py-3 font-semibold">Sıra</th>
                <th className="px-4 py-3 text-right font-semibold">Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {(categories ?? []).map((category, index) => (
                <tr key={category.id} className="border-b border-industrial-950/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-industrial-950">{category.name_az}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={busyId === category.id}
                      onClick={() => handleTogglePublished(category)}
                      className={`flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                        category.published ? 'text-success-600' : 'text-neutral-custom-600'
                      }`}
                    >
                      {category.published ? <Eye size={14} /> : <EyeOff size={14} />}
                      {category.published ? 'Dərc olunub' : 'Gizli'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0 || busyId === category.id}
                        onClick={() => handleMove(category, 'up')}
                        className="flex h-7 w-7 items-center justify-center rounded-sm text-neutral-custom-600 transition-colors hover:bg-industrial-950/5 disabled:opacity-30"
                        aria-label="Yuxarı"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={index === categories.length - 1 || busyId === category.id}
                        onClick={() => handleMove(category, 'down')}
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
                        onClick={() => setFormState(category)}
                        className="flex h-8 w-8 items-center justify-center rounded-sm text-neutral-custom-600 transition-colors hover:bg-industrial-950/5 hover:text-industrial-950"
                        aria-label="Redaktə et"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(category)}
                        className="flex h-8 w-8 items-center justify-center rounded-sm text-neutral-custom-600 transition-colors hover:bg-ember-600/10 hover:text-ember-600"
                        aria-label="Sil"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-neutral-custom-600">
                    Hələ komanda kateqoriyası yaradılmayıb.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {formState && (
        <TeamCategoryFormModal
          category={formState === 'create' ? null : formState}
          onClose={() => setFormState(null)}
          onSaved={() => {
            setFormState(null)
            load()
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Kateqoriyanı sil"
          message={`"${deleteTarget.name_az}" kateqoriyasını silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.`}
          confirmLabel="Sil"
          busy={busyId === deleteTarget.id}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  )
}
