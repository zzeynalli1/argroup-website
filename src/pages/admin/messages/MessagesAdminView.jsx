import { useEffect, useState } from 'react'
import { Loader2, Mail, MailOpen, Trash2, X } from 'lucide-react'
import { deleteMessage, fetchAllMessagesForAdmin, setMessageStatus } from '../../../lib/cms/contactMessages'
import ConfirmDialog from '../../../components/admin/ConfirmDialog'

function formatDateTime(isoString) {
  const date = new Date(isoString)
  return date.toLocaleString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** Read-only — admins inspect a submitted message, they never edit its content. */
function MessageDetailModal({ message, onClose, onToggleStatus, busy }) {
  const isUnread = message.status === 'unread'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-industrial-950/60 px-4 py-8" onClick={onClose}>
      <div
        className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-sm border border-industrial-950/10 bg-base-50"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-industrial-950/10 px-6 py-4">
          <h2 className="font-heading text-lg font-bold text-industrial-950">{message.name}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-sm text-neutral-custom-600 transition-colors hover:bg-industrial-950/5"
            aria-label="Bağla"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-medium text-neutral-custom-600">E-poçt</p>
              <p className="mt-1 text-industrial-950">{message.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-custom-600">Telefon</p>
              <p className="mt-1 text-industrial-950">{message.phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-custom-600">Xidmət</p>
              <p className="mt-1 text-industrial-950">{message.service || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-custom-600">Tarix</p>
              <p className="mt-1 text-industrial-950">{formatDateTime(message.created_at)}</p>
            </div>
          </div>

          <div className="mt-5 border-t border-industrial-950/10 pt-5">
            <p className="text-xs font-medium text-neutral-custom-600">Mesaj</p>
            {/* Plain text only — never dangerouslySetInnerHTML. Submitted content is untrusted. */}
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-industrial-950">{message.message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-industrial-950/10 px-6 py-4">
          <button
            type="button"
            disabled={busy}
            onClick={onToggleStatus}
            className="flex items-center gap-2 rounded-sm border border-industrial-950/15 px-4 py-2.5 text-sm font-medium text-industrial-950 transition-colors hover:border-ember-600 disabled:opacity-50"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : isUnread ? <MailOpen size={15} /> : <Mail size={15} />}
            {isUnread ? 'Oxunmuş kimi işarələ' : 'Oxunmamış kimi işarələ'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MessagesAdminView() {
  const [messages, setMessages] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [viewTarget, setViewTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setLoadError('')
    try {
      const data = await fetchAllMessagesForAdmin()
      setMessages(data)
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

  async function handleToggleStatus(message) {
    setActionError('')
    setBusyId(message.id)
    try {
      const updated = await setMessageStatus(message.id, message.status === 'unread' ? 'read' : 'unread')
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
      setViewTarget((prev) => (prev?.id === updated.id ? updated : prev))
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
      await deleteMessage(deleteTarget.id)
      setDeleteTarget(null)
      if (viewTarget?.id === deleteTarget.id) setViewTarget(null)
      await load()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div>
        <h1 className="font-heading text-2xl font-bold text-industrial-950">Mesajlar</h1>
        <p className="mt-1 text-sm text-neutral-custom-600">Əlaqə formundan göndərilən mesajlar.</p>
      </div>

      {(loadError || actionError) && (
        <p className="mt-4 rounded-sm border border-ember-600/30 bg-ember-600/5 px-4 py-3 text-sm text-ember-800">
          {loadError || actionError}
        </p>
      )}

      {messages === null && !loadError ? (
        <div className="mt-10 flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-neutral-custom-400" size={24} />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-sm border border-industrial-950/10 bg-base-50">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-industrial-950/10 bg-industrial-950/[0.03] text-left text-xs uppercase tracking-wide text-neutral-custom-600">
                <th className="px-4 py-3 font-semibold">Vəziyyət</th>
                <th className="px-4 py-3 font-semibold">Ad</th>
                <th className="px-4 py-3 font-semibold">E-poçt</th>
                <th className="px-4 py-3 font-semibold">Xidmət</th>
                <th className="px-4 py-3 font-semibold">Tarix</th>
                <th className="px-4 py-3 text-right font-semibold">Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {(messages ?? []).map((message) => {
                const isUnread = message.status === 'unread'
                return (
                  <tr
                    key={message.id}
                    onClick={() => setViewTarget(message)}
                    className="cursor-pointer border-b border-industrial-950/5 last:border-0 hover:bg-industrial-950/[0.02]"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex h-2 w-2 rounded-full ${isUnread ? 'bg-ember-600' : 'bg-neutral-custom-400/40'}`}
                        aria-label={isUnread ? 'Oxunmayıb' : 'Oxunub'}
                      />
                    </td>
                    <td className={`px-4 py-3 ${isUnread ? 'font-semibold text-industrial-950' : 'font-medium text-neutral-custom-600'}`}>
                      {message.name}
                    </td>
                    <td className="px-4 py-3 text-neutral-custom-600">{message.email}</td>
                    <td className="px-4 py-3 text-neutral-custom-600">{message.service || '—'}</td>
                    <td className="px-4 py-3 text-neutral-custom-600">{formatDateTime(message.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          disabled={busyId === message.id}
                          onClick={(event) => {
                            event.stopPropagation()
                            handleToggleStatus(message)
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-sm text-neutral-custom-600 transition-colors hover:bg-industrial-950/5 hover:text-industrial-950 disabled:opacity-50"
                          aria-label={isUnread ? 'Oxunmuş kimi işarələ' : 'Oxunmamış kimi işarələ'}
                        >
                          {busyId === message.id ? <Loader2 size={15} className="animate-spin" /> : isUnread ? <MailOpen size={15} /> : <Mail size={15} />}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            setDeleteTarget(message)
                          }}
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
              {messages?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-neutral-custom-600">
                    Hələ heç bir mesaj yoxdur.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewTarget && (
        <MessageDetailModal
          message={viewTarget}
          onClose={() => setViewTarget(null)}
          onToggleStatus={() => handleToggleStatus(viewTarget)}
          busy={busyId === viewTarget.id}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Mesajı sil"
          message={`"${deleteTarget.name}" tərəfindən göndərilən mesajı silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.`}
          confirmLabel="Sil"
          busy={busyId === deleteTarget.id}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  )
}
