import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Eye, EyeOff, ImageOff, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { deleteProject, fetchAllProjectsForAdmin, moveProject, setPublished } from '../../../lib/cms/projects'
import ConfirmDialog from '../../../components/admin/ConfirmDialog'
import ProjectFormModal from './ProjectFormModal'

function formatDate(isoDate) {
  if (!isoDate) return null
  const [year, month, day] = isoDate.split('-')
  return `${day}.${month}.${year}`
}

// Mirrors the public card's own completion_date-vs-end_date precedence
// (see components/sections/Projects.jsx) so the admin list shows the same
// date a visitor would see.
function relevantDate(project) {
  if (project.status === 'completed' && project.completion_date) return formatDate(project.completion_date)
  if (project.end_date) return formatDate(project.end_date)
  return null
}

export default function ProjectsAdminView() {
  const [projects, setProjects] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [formState, setFormState] = useState(null) // null | 'create' | <project>
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setLoadError('')
    try {
      const data = await fetchAllProjectsForAdmin()
      setProjects(data)
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

  async function handleTogglePublished(project) {
    setActionError('')
    setBusyId(project.id)
    try {
      await setPublished(project.id, !project.published)
      await load()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleMove(project, direction) {
    setActionError('')
    setBusyId(project.id)
    try {
      await moveProject(projects, project.id, direction)
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
      await deleteProject(deleteTarget.id)
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
          <h1 className="font-heading text-2xl font-bold text-industrial-950">Layihələr</h1>
          <p className="mt-1 text-sm text-neutral-custom-600">Sayt üzərindəki layihələrin idarə edilməsi.</p>
        </div>
        <button
          type="button"
          onClick={() => setFormState('create')}
          className="flex shrink-0 items-center gap-2 rounded-sm bg-ember-600 px-4 py-2.5 text-sm font-semibold text-base-50 transition-colors hover:bg-ember-800"
        >
          <Plus size={16} />
          Yeni layihə
        </button>
      </div>

      {(loadError || actionError) && (
        <p className="mt-4 rounded-sm border border-ember-600/30 bg-ember-600/5 px-4 py-3 text-sm text-ember-800">
          {loadError || actionError}
        </p>
      )}

      {projects === null && !loadError ? (
        <div className="mt-10 flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-neutral-custom-400" size={24} />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-sm border border-industrial-950/10 bg-base-50">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-industrial-950/10 bg-industrial-950/[0.03] text-left text-xs uppercase tracking-wide text-neutral-custom-600">
                <th className="px-4 py-3 font-semibold">Şəkil</th>
                <th className="px-4 py-3 font-semibold">Başlıq</th>
                <th className="px-4 py-3 font-semibold">Müştəri</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Tarix</th>
                <th className="px-4 py-3 font-semibold">Dərc</th>
                <th className="px-4 py-3 font-semibold">Sıra</th>
                <th className="px-4 py-3 text-right font-semibold">Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {(projects ?? []).map((project, index) => (
                <tr key={project.id} className="border-b border-industrial-950/5 last:border-0">
                  <td className="px-4 py-3">
                    {project.image_url ? (
                      <img src={project.image_url} alt="" className="h-12 w-20 rounded-sm object-cover" />
                    ) : (
                      <div className="flex h-12 w-20 items-center justify-center rounded-sm bg-industrial-950/5 text-neutral-custom-400">
                        <ImageOff size={16} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-industrial-950">{project.title}</td>
                  <td className="px-4 py-3 text-neutral-custom-600">{project.client}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                        project.status === 'ongoing' ? 'bg-amber-500/15 text-amber-500' : 'bg-neutral-custom-600/10 text-neutral-custom-600'
                      }`}
                    >
                      {project.status === 'ongoing' ? 'Davam edir' : 'Tamamlanıb'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-custom-600">{relevantDate(project) ?? '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={busyId === project.id}
                      onClick={() => handleTogglePublished(project)}
                      className={`flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                        project.published ? 'text-success-600' : 'text-neutral-custom-600'
                      }`}
                    >
                      {project.published ? <Eye size={14} /> : <EyeOff size={14} />}
                      {project.published ? 'Dərc olunub' : 'Gizli'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0 || busyId === project.id}
                        onClick={() => handleMove(project, 'up')}
                        className="flex h-7 w-7 items-center justify-center rounded-sm text-neutral-custom-600 transition-colors hover:bg-industrial-950/5 disabled:opacity-30"
                        aria-label="Yuxarı"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={index === projects.length - 1 || busyId === project.id}
                        onClick={() => handleMove(project, 'down')}
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
                        onClick={() => setFormState(project)}
                        className="flex h-8 w-8 items-center justify-center rounded-sm text-neutral-custom-600 transition-colors hover:bg-industrial-950/5 hover:text-industrial-950"
                        aria-label="Redaktə et"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(project)}
                        className="flex h-8 w-8 items-center justify-center rounded-sm text-neutral-custom-600 transition-colors hover:bg-ember-600/10 hover:text-ember-600"
                        aria-label="Sil"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {projects?.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-neutral-custom-600">
                    Hələ heç bir layihə əlavə edilməyib.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {formState && (
        <ProjectFormModal
          project={formState === 'create' ? null : formState}
          onClose={() => setFormState(null)}
          onSaved={() => {
            setFormState(null)
            load()
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Layihəni sil"
          message={`"${deleteTarget.title}" layihəsini silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.`}
          confirmLabel="Sil"
          busy={busyId === deleteTarget.id}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  )
}
