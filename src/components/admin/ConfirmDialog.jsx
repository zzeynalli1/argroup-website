import { AlertTriangle, Loader2 } from 'lucide-react'

/**
 * Generic destructive-action confirmation — used by Projects delete today,
 * reusable as-is by future CMS modules (Brands, Partners, ...).
 */
export default function ConfirmDialog({ title, message, confirmLabel = 'Təsdiqlə', busy, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-industrial-950/60 px-6" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-sm border border-industrial-950/10 bg-base-50 p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ember-600/10 text-ember-600">
            <AlertTriangle size={18} />
          </span>
          <div>
            <h2 className="font-heading text-base font-bold text-industrial-950">{title}</h2>
            <p className="mt-1.5 text-sm text-neutral-custom-600">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-sm px-4 py-2 text-sm font-medium text-neutral-custom-600 transition-colors hover:bg-industrial-950/5 disabled:opacity-50"
          >
            İmtina
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex items-center gap-2 rounded-sm bg-ember-600 px-4 py-2 text-sm font-semibold text-base-50 transition-colors hover:bg-ember-800 disabled:opacity-60"
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
