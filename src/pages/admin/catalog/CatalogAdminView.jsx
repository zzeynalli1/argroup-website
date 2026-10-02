import { useEffect, useState } from 'react'
import { Download, ExternalLink, FileText, Loader2, Trash2, Upload } from 'lucide-react'
import { fetchCatalog, removeCatalog, replaceCatalog, validateCatalogFile } from '../../../lib/cms/catalog'
import ConfirmDialog from '../../../components/admin/ConfirmDialog'

function formatDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('az-AZ', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatSize(bytes) {
  if (!bytes) return null
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function CatalogAdminView() {
  const [catalog, setCatalog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [status, setStatus] = useState('') // '' | 'Yüklənir...'
  const [busy, setBusy] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  async function load() {
    setLoadError('')
    try {
      const data = await fetchCatalog()
      setCatalog(data)
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function run() {
      await load()
    }
    run()
  }, [])

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    const validationError = validateCatalogFile(file)
    if (validationError) {
      setActionError(validationError)
      event.target.value = ''
      return
    }

    setActionError('')
    setBusy(true)
    setStatus('Yüklənir...')
    try {
      const updated = await replaceCatalog(file, catalog)
      setCatalog(updated)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusy(false)
      setStatus('')
      event.target.value = ''
    }
  }

  async function handleConfirmRemove() {
    setActionError('')
    setBusy(true)
    try {
      await removeCatalog(catalog)
      setCatalog(null)
      setConfirmRemove(false)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-industrial-950">Kataloq</h1>
      <p className="mt-1 text-sm text-neutral-custom-600">
        Saytda göstərilən PDF məhsul kataloqunun idarə edilməsi. Yalnız bir aktiv kataloq mövcud ola bilər — yeni fayl
        yükləndikdə əvvəlkini əvəz edir.
      </p>

      {actionError && (
        <p className="mt-4 rounded-sm border border-ember-600/30 bg-ember-600/5 px-4 py-3 text-sm text-ember-800">
          {actionError}
        </p>
      )}

      {loading ? (
        <div className="mt-10 flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-neutral-custom-400" size={24} />
        </div>
      ) : loadError ? (
        // The read itself failed (e.g. the catalog_document table/migration
        // isn't set up yet) — showing the upload/empty-state panel below
        // this would just invite another failed attempt for the same
        // reason, so this replaces it entirely instead of stacking on top.
        <p className="mt-6 rounded-sm border border-ember-600/30 bg-ember-600/5 px-4 py-3 text-sm text-ember-800">{loadError}</p>
      ) : (
        <div className="mt-6 rounded-sm border border-industrial-950/10 bg-base-50 p-6">
          {catalog ? (
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-industrial-950/5 text-ember-600">
                <FileText size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-industrial-950">{catalog.file_name}</p>
                <p className="mt-1 text-xs text-neutral-custom-600">
                  Yenilənmə tarixi: {formatDate(catalog.updated_at)}
                  {formatSize(catalog.file_size) ? ` · ${formatSize(catalog.file_size)}` : ''}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <a
                    href={catalog.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-sm border border-industrial-950/15 px-3.5 py-2 text-xs font-medium text-industrial-950 transition-colors hover:border-ember-600"
                  >
                    <ExternalLink size={14} />
                    Önizlə
                  </a>
                  <a
                    href={catalog.file_url}
                    download={catalog.file_name}
                    className="flex items-center gap-1.5 rounded-sm border border-industrial-950/15 px-3.5 py-2 text-xs font-medium text-industrial-950 transition-colors hover:border-ember-600"
                  >
                    <Download size={14} />
                    Yüklə
                  </a>
                  <label className="flex cursor-pointer items-center gap-1.5 rounded-sm border border-industrial-950/15 px-3.5 py-2 text-xs font-medium text-industrial-950 transition-colors hover:border-ember-600">
                    {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    Əvəz et
                    <input type="file" accept="application/pdf" onChange={handleFileChange} disabled={busy} className="hidden" />
                  </label>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmRemove(true)}
                    className="flex items-center gap-1.5 rounded-sm px-3.5 py-2 text-xs font-medium text-neutral-custom-600 transition-colors hover:bg-ember-600/10 hover:text-ember-600 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    Sil
                  </button>
                </div>
                {status && <p className="mt-3 text-xs text-neutral-custom-600">{status}</p>}
              </div>
            </div>
          ) : (
            <div className="py-10 text-center">
              <FileText className="mx-auto text-neutral-custom-400" size={28} />
              <p className="mt-3 text-sm text-neutral-custom-600">Hələ kataloq yüklənməyib.</p>
              <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-sm bg-ember-600 px-4 py-2.5 text-sm font-semibold text-base-50 transition-colors hover:bg-ember-800">
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                PDF yüklə
                <input type="file" accept="application/pdf" onChange={handleFileChange} disabled={busy} className="hidden" />
              </label>
              {status && <p className="mt-3 text-xs text-neutral-custom-600">{status}</p>}
            </div>
          )}
        </div>
      )}

      {confirmRemove && (
        <ConfirmDialog
          title="Kataloqu sil"
          message="Hazırkı kataloqu silmək istədiyinizə əminsiniz? Bu əməliyyatdan sonra saytda kataloq yükləmə düyməsi görünməyəcək."
          confirmLabel="Sil"
          busy={busy}
          onCancel={() => setConfirmRemove(false)}
          onConfirm={handleConfirmRemove}
        />
      )}
    </div>
  )
}
