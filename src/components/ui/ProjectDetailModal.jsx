import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useTranslation } from '../../lib/i18n/useTranslation'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

function formatDate(isoDate) {
  if (!isoDate) return null
  const [year, month, day] = isoDate.split('-')
  return `${day}.${month}.${year}`
}

const CONTENT_FALLBACK_LOCALE = 'en'

function localize(value, locale) {
  if (!value) return value
  return value[locale] || value[CONTENT_FALLBACK_LOCALE]
}

function InfoField({ label, value, accent = false }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-1.5 border-l border-white/10 pl-4">
      <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-neutral-custom-400">{label}</span>
      <span className={`font-heading text-sm font-semibold md:text-base ${accent ? 'text-ember-600' : 'text-base-50'}`}>
        {value}
      </span>
    </div>
  )
}

/**
 * Architectural project-dossier modal opened from the Home page's compact
 * Projects section (see components/sections/Projects.jsx). Content is
 * data-driven only — every field comes from the merged
 * data/projects.js + data/projectDetails.js record passed in as `project`;
 * this component never hardcodes copy for a specific project/slug.
 */
export default function ProjectDetailModal({ project, onClose }) {
  const { t, locale } = useTranslation('home')
  const dialogRef = useRef(null)
  const description = localize(project?.description, locale)
  const workPerformed = localize(project?.workPerformed, locale)

  useEffect(() => {
    if (!project) return undefined

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
  }, [project, onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {project && (
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
            aria-label={project.title}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
            className="relative flex h-full w-full flex-col overflow-y-auto bg-base-50 md:h-auto md:max-h-[90vh] md:w-[80vw] md:max-w-5xl"
          >
            <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-industrial-950 md:aspect-[21/9]">
              <picture>
                <source srcSet={project.imageWebp} type="image/webp" />
                <img src={project.imageJpg} alt={project.title} className="h-full w-full object-cover" />
              </picture>
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-industrial-950/70 via-transparent to-transparent" />

              <button
                type="button"
                onClick={onClose}
                aria-label={t('projects.modal.close')}
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-base-50/30 bg-industrial-950/40 text-base-50 backdrop-blur-sm transition-colors duration-200 hover:border-ember-600 hover:text-ember-600"
              >
                <X size={18} />
              </button>

              <span
                className={`absolute left-4 top-4 rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em] ${
                  project.status === 'ongoing' ? 'bg-amber-500/90 text-industrial-950' : 'bg-base-50/90 text-industrial-950'
                }`}
              >
                {t(`projects.status.${project.status}`)}
              </span>
            </div>

            <div className="flex-1">
              <div className="px-6 pt-8 md:px-12 md:pt-10">
                <h2 className="font-heading text-2xl font-bold text-industrial-950 md:text-3xl">{project.title}</h2>
              </div>

              <div className="mt-6 bg-industrial-900 px-6 py-6 md:mt-8 md:px-12 md:py-8">
                <span aria-hidden="true" className="mb-5 block h-px w-10 bg-ember-600" />
                <div className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4">
                  <InfoField label={t('projects.modal.client')} value={project.client} />
                  <InfoField
                    label={t('projects.modal.status')}
                    value={t(`projects.status.${project.status}`)}
                    accent={project.status === 'ongoing'}
                  />
                  <InfoField label={t('projects.modal.startDate')} value={formatDate(project.startDate)} />
                  <InfoField
                    label={t('projects.modal.endDate')}
                    value={project.endDate ? formatDate(project.endDate) : t('projects.modal.ongoing')}
                  />
                </div>
              </div>

              <div className="px-6 py-8 md:px-12 md:py-10">
                {description && (
                  <div className="max-w-3xl">
                    <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-ember-600">
                      {t('projects.modal.descriptionLabel')}
                    </span>
                    <p className="mt-3 leading-relaxed text-neutral-custom-600">{description}</p>
                  </div>
                )}

                {workPerformed?.length > 0 && (
                  <div className={description ? 'mt-10 border-t border-industrial-950/10 pt-8' : ''}>
                    <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-ember-600">
                      {t('projects.modal.workPerformedLabel')}
                    </span>
                    <ul className="mt-4 flex flex-col divide-y divide-industrial-950/10">
                      {workPerformed.map((item) => (
                        <li key={item} className="flex items-start gap-3 py-3">
                          <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ember-600" />
                          <span className="text-sm text-industrial-950 md:text-base">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
