import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

/**
 * Detail dossier opened when an award row in AboutAwards.jsx is clicked —
 * same focus-trap/Escape/body-scroll-lock treatment as ProjectDetailModal.jsx
 * (the site's one other public content modal), just with award fields
 * (image/title/organization/year/description) instead of a project's. The
 * image renders large and uncropped (object-contain on a dark backdrop)
 * since award photos vary in aspect ratio (certificate scans vs trophy
 * shots) — unlike ProjectDetailModal's fixed 16:9 hero crop, which assumes
 * landscape site photography.
 */
export default function AwardDetailModal({ award, onClose, closeLabel }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!award) return undefined

    const previouslyFocused = document.activeElement
    document.body.style.overflow = 'hidden'

    const focusFrame = requestAnimationFrame(() => {
      dialogRef.current?.querySelector(FOCUSABLE_SELECTOR)?.focus()
    })

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return

      const focusable = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR))
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      cancelAnimationFrame(focusFrame)
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
    }
  }, [award, onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {award && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-industrial-950/85 backdrop-blur-sm md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={award.title}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
            className="relative flex h-full w-full flex-col overflow-y-auto bg-base-50 md:h-auto md:max-h-[90vh] md:w-[80vw] md:max-w-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-industrial-950/10 bg-base-50 text-industrial-950 transition-colors duration-200 hover:border-ember-600 hover:text-ember-600"
            >
              <X size={18} />
            </button>

            {award.image && (
              <div className="relative flex aspect-[4/3] w-full shrink-0 items-center justify-center overflow-hidden bg-industrial-950 md:aspect-[16/10]">
                <img src={award.image} alt={award.title} className="h-full w-full object-contain" />
              </div>
            )}

            <div className="px-6 py-8 md:px-10 md:py-10">
              <span aria-hidden="true" className="block h-0.5 w-10 bg-ember-600" />
              <h2 className="mt-4 font-heading text-2xl font-bold text-industrial-950 md:text-3xl">{award.title}</h2>

              {(award.organization || award.year) && (
                <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-[0.15em] text-neutral-custom-600">
                  {award.organization && <span>{award.organization}</span>}
                  {award.organization && award.year && (
                    <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-neutral-custom-400/50" />
                  )}
                  {award.year && <span>{award.year}</span>}
                </div>
              )}

              {award.description && (
                <p className="mt-6 max-w-xl leading-relaxed text-neutral-custom-600">{award.description}</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
