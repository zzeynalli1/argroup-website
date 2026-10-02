import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Pencil, Plus, Trash2, User } from 'lucide-react'
import { buildTeamTree, deleteTeamMember, fetchAllTeamMembersForAdmin, moveTeamMember, setPublished } from '../../../lib/cms/teamMembers'
import { fetchAllCategoriesForAdmin } from '../../../lib/cms/teamCategories'
import ConfirmDialog from '../../../components/admin/ConfirmDialog'
import TeamMemberFormModal from './TeamMemberFormModal'

/** Flattens the tree back into a depth-annotated list for a simple indented
 * table — the tree shape only exists to compute depth/order; the DB never
 * stores it, it's derived fresh from parent_id + sort_order every load. */
function flattenWithDepth(nodes, depth = 0, out = []) {
  for (const node of nodes) {
    out.push({ ...node, depth })
    if (node.children?.length) flattenWithDepth(node.children, depth + 1, out)
  }
  return out
}

/** Team member CRUD — the actual parent_id reporting hierarchy. Category
 * (see TeamCategoriesAdminView, a sibling tab) is a separate, independent
 * organizational label carried on category_id; it never drives this table's
 * depth/indentation, which is derived purely from parent_id as before. */
export default function TeamMembersAdminView({ onGoToCategories }) {
  const [members, setMembers] = useState(null)
  const [categories, setCategories] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [formState, setFormState] = useState(null) // null | 'create' | <member>
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setLoadError('')
    try {
      const [memberData, categoryData] = await Promise.all([fetchAllTeamMembersForAdmin(), fetchAllCategoriesForAdmin()])
      setMembers(memberData)
      setCategories(categoryData)
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

  const rows = useMemo(() => {
    if (!members) return []
    const tree = buildTeamTree(members)
    return flattenWithDepth(tree)
  }, [members])

  const categoryNameById = useMemo(() => {
    const map = new Map()
    for (const category of categories ?? []) map.set(category.id, category.name_az)
    return map
  }, [categories])

  // "Reports to" needs the person's name/position label, never a raw id —
  // same `name — position` convention the form's parent-select dropdown uses.
  const memberLabelById = useMemo(() => {
    const map = new Map()
    for (const member of members ?? []) map.set(member.id, member.name || member.position_az)
    return map
  }, [members])

  function siblingsOf(member) {
    return (members ?? [])
      .filter((m) => m.parent_id === member.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order)
  }

  async function handleTogglePublished(member) {
    setActionError('')
    setBusyId(member.id)
    try {
      await setPublished(member.id, !member.published)
      await load()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleMove(member, direction) {
    setActionError('')
    setBusyId(member.id)
    try {
      await moveTeamMember(siblingsOf(member), member.id, direction)
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
      await deleteTeamMember(deleteTarget.id)
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
      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => setFormState('create')}
          className="flex shrink-0 items-center gap-2 rounded-sm bg-ember-600 px-4 py-2.5 text-sm font-semibold text-base-50 transition-colors hover:bg-ember-800"
        >
          <Plus size={16} />
          Yeni üzv/rol
        </button>
      </div>

      {(loadError || actionError) && (
        <p className="mt-4 rounded-sm border border-ember-600/30 bg-ember-600/5 px-4 py-3 text-sm text-ember-800">
          {loadError || actionError}
        </p>
      )}

      {members === null && !loadError ? (
        <div className="mt-10 flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-neutral-custom-400" size={24} />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-sm border border-industrial-950/10 bg-base-50">
          <table className="w-full min-w-[1180px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-industrial-950/10 bg-industrial-950/[0.03] text-left text-xs uppercase tracking-wide text-neutral-custom-600">
                <th className="px-4 py-3 font-semibold">Şəkil</th>
                <th className="px-4 py-3 font-semibold">Ad / Rol (iyerarxiya)</th>
                <th className="px-4 py-3 font-semibold">Vəzifə (AZ)</th>
                <th className="px-4 py-3 font-semibold">Kateqoriya</th>
                <th className="px-4 py-3 font-semibold">Kimə tabedir?</th>
                <th className="px-4 py-3 font-semibold">Telefon</th>
                <th className="px-4 py-3 font-semibold">E-poçt</th>
                <th className="px-4 py-3 font-semibold">Dərc</th>
                <th className="px-4 py-3 font-semibold">Sıra</th>
                <th className="px-4 py-3 text-right font-semibold">Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((member) => {
                const siblings = siblingsOf(member)
                const siblingIndex = siblings.findIndex((s) => s.id === member.id)
                return (
                  <tr key={member.id} className="border-b border-industrial-950/5 last:border-0">
                    <td className="px-4 py-3">
                      {member.photo_url ? (
                        <img src={member.photo_url} alt="" className="h-10 w-10 rounded-full border border-industrial-950/10 object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-industrial-950/5 text-neutral-custom-400">
                          <User size={16} />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-industrial-950" style={{ paddingLeft: `${16 + member.depth * 24}px` }}>
                      {member.depth > 0 && <span className="mr-1.5 text-neutral-custom-400">└</span>}
                      {member.name || <span className="font-normal text-neutral-custom-400">— (ad təsdiqlənməyib)</span>}
                    </td>
                    <td className="px-4 py-3 text-neutral-custom-600">{member.position_az}</td>
                    <td className="px-4 py-3 text-neutral-custom-600">
                      {member.category_id ? (categoryNameById.get(member.category_id) ?? '—') : <span className="text-neutral-custom-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-neutral-custom-600">
                      {member.parent_id ? (memberLabelById.get(member.parent_id) ?? '—') : <span className="text-neutral-custom-400">— (üst səviyyə)</span>}
                    </td>
                    <td className="px-4 py-3 text-neutral-custom-600">
                      {member.phone || <span className="text-neutral-custom-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-neutral-custom-600">
                      {member.email || <span className="text-neutral-custom-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={busyId === member.id}
                        onClick={() => handleTogglePublished(member)}
                        className={`flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                          member.published ? 'text-success-600' : 'text-neutral-custom-600'
                        }`}
                      >
                        {member.published ? <Eye size={14} /> : <EyeOff size={14} />}
                        {member.published ? 'Dərc olunub' : 'Gizli'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={siblingIndex === 0 || busyId === member.id}
                          onClick={() => handleMove(member, 'up')}
                          className="flex h-7 w-7 items-center justify-center rounded-sm text-neutral-custom-600 transition-colors hover:bg-industrial-950/5 disabled:opacity-30"
                          aria-label="Yuxarı"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={siblingIndex === siblings.length - 1 || busyId === member.id}
                          onClick={() => handleMove(member, 'down')}
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
                          onClick={() => setFormState(member)}
                          className="flex h-8 w-8 items-center justify-center rounded-sm text-neutral-custom-600 transition-colors hover:bg-industrial-950/5 hover:text-industrial-950"
                          aria-label="Redaktə et"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(member)}
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
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-neutral-custom-600">
                    Hələ heç bir komanda üzvü/rolu əlavə edilməyib.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {formState && (
        <TeamMemberFormModal
          member={formState === 'create' ? null : formState}
          allMembers={members ?? []}
          categories={categories ?? []}
          onGoToCategories={onGoToCategories}
          onClose={() => setFormState(null)}
          onSaved={() => {
            setFormState(null)
            load()
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Üzvü/Rolu sil"
          message={`"${deleteTarget.name || deleteTarget.position_az}" silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz. Əgər bu üzvün alt komandası varsa, silinmə rədd ediləcək.`}
          confirmLabel="Sil"
          busy={busyId === deleteTarget.id}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  )
}
