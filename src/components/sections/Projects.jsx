import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useProjects } from '../../hooks/useProjects'
import { useTranslation } from '../../lib/i18n/useTranslation'
import ProjectDetailModal from '../ui/ProjectDetailModal'

const PAGE_SIZE = 6

const FILTER_KEYS = ['all', 'completed', 'ongoing']

// Horizontal pointer movement (px) beyond which a pointer-down/up pair on
// the compact pager counts as a swipe rather than a tap that should open
// the detail modal.
const SWIPE_THRESHOLD = 50

function matchesFilter(project, filterKey) {
  return filterKey === 'all' || project.status === filterKey
}

function formatDate(isoDate) {
  if (!isoDate) return null
  const [year, month, day] = isoDate.split('-')
  return `${day}.${month}.${year}`
}

/**
 * "Tamamlanmış" uses a neutral tone rather than green — CLAUDE.md restricts
 * colors to the tokens in tailwind.config.js, and green isn't one of them.
 * "Davam edir" uses amber-500, which is.
 */
function StatusBadge({ status, t }) {
  const isOngoing = status === 'ongoing'
  return (
    <span
      className={`shrink-0 inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
        isOngoing ? 'bg-amber-500/15 text-amber-500' : 'bg-neutral-custom-600/10 text-neutral-custom-600'
      }`}
    >
      {t(`projects.status.${status}`)}
    </span>
  )
}

function ProjectCard({ project, t, onOpen }) {
  const clickable = Boolean(onOpen)
  // completionDate is a distinct, currently-unset field from endDate — only
  // render it once a project is both completed AND has a verified value,
  // never an empty placeholder.
  const showCompletionDate = project.status === 'completed' && Boolean(project.completionDate)

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpen(project)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      onClick={clickable ? () => onOpen(project) : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? handleKeyDown : undefined}
      className={`group flex h-full flex-col rounded-lg overflow-hidden border border-neutral-custom-400/20 ${clickable ? 'cursor-pointer' : ''}`}
    >
      <div className="relative aspect-video shrink-0 overflow-hidden bg-neutral-custom-400/15">
        <img
          src={project.imageWebp}
          alt={project.title}
          loading="lazy"
          draggable={false}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-ember-600/0 group-hover:bg-ember-600/10 transition-colors duration-300" />
      </div>

      <div className="flex-1 bg-base-50 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-heading font-semibold text-industrial-950">{project.title}</p>
          <StatusBadge status={project.status} t={t} />
        </div>
        <p className="mt-1 text-sm text-neutral-custom-600">{project.client}</p>
        <p className="mt-1 text-xs text-neutral-custom-400">{project.location}</p>
        {showCompletionDate && (
          <p className="mt-1 text-xs text-neutral-custom-400">
            {t('projects.completionDate')}: {formatDate(project.completionDate)}
          </p>
        )}
      </div>
    </motion.div>
  )
}

/**
 * Home's compact teaser: the same 6-card grid as the full page, paginated
 * through the whole dataset in groups of PAGE_SIZE via left/right arrows (or
 * a swipe) instead of a separate "view all" route. Groups don't loop — the
 * edges are fixed points in a finite dataset, not a carousel of unrelated
 * items, so a disabled end-arrow reads more honestly than wrapping around.
 */
function ProjectGroupPager({ projects: items, t, onOpen }) {
  const [[page, direction], setPage] = useState([0, 0])
  const dragState = useRef({ startX: 0, dragging: false, moved: false })
  const totalPages = Math.ceil(items.length / PAGE_SIZE)
  const group = items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
  const isFirst = page === 0
  const isLast = page === totalPages - 1

  function goTo(nextPage) {
    if (nextPage < 0 || nextPage >= totalPages || nextPage === page) return
    setPage([nextPage, nextPage > page ? 1 : -1])
  }

  function handlePointerDown(event) {
    dragState.current = { startX: event.clientX, dragging: true, moved: false }
  }

  function handlePointerMove(event) {
    if (!dragState.current.dragging) return
    if (Math.abs(event.clientX - dragState.current.startX) > 10) {
      dragState.current.moved = true
    }
  }

  function handlePointerUp(event) {
    if (!dragState.current.dragging) return
    const delta = event.clientX - dragState.current.startX
    dragState.current.dragging = false
    if (delta > SWIPE_THRESHOLD) goTo(page - 1)
    else if (delta < -SWIPE_THRESHOLD) goTo(page + 1)
  }

  // Swallow the synthetic click a drag/swipe leaves behind so it doesn't
  // also open the detail modal underneath it.
  function handleClickCapture(event) {
    if (dragState.current.moved) {
      event.stopPropagation()
      dragState.current.moved = false
    }
  }

  const variants = {
    enter: (dir) => ({ x: dir >= 0 ? 24 : -24, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir >= 0 ? -24 : 24, opacity: 0 }),
  }

  return (
    <div className="mt-12 flex items-center gap-3 sm:gap-6">
      {totalPages > 1 && (
        <button
          type="button"
          onClick={() => goTo(page - 1)}
          disabled={isFirst}
          aria-label={t('projects.previousGroup')}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-industrial-950/80 text-base-50 backdrop-blur-sm transition-colors hover:border-ember-600 hover:text-ember-600 disabled:pointer-events-none disabled:opacity-0"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      <div
        className="min-w-0 flex-1 touch-pan-y overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClickCapture={handleClickCapture}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {group.map((project) => (
              <ProjectCard key={project.id} project={project} t={t} onOpen={onOpen} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {totalPages > 1 && (
        <button
          type="button"
          onClick={() => goTo(page + 1)}
          disabled={isLast}
          aria-label={t('projects.nextGroup')}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-industrial-950/80 text-base-50 backdrop-blur-sm transition-colors hover:border-ember-600 hover:text-ember-600 disabled:pointer-events-none disabled:opacity-0"
        >
          <ChevronRight size={22} />
        </button>
      )}
    </div>
  )
}

/**
 * `variant="compact"` (Home): the full dataset, browsed 6-at-a-time via
 * `ProjectGroupPager` (prev/next arrows + swipe), no filters, no link out to
 * a separate route.
 * `variant="full"` (/projects): all projects in a filterable grid — filter
 * buttons don't make sense alongside fixed-size pagination, so this variant
 * keeps the plain scannable grid instead.
 * In both variants, cards for projects with verified detail data open the
 * SAME ProjectDetailModal instead of navigating anywhere — no separate
 * route, no duplicated modal markup.
 */
export default function Projects({ variant = 'full' }) {
  const { t } = useTranslation('home')
  const { projects, loading } = useProjects()
  const [filter, setFilter] = useState('all')
  const [activeProject, setActiveProject] = useState(null)

  const visibleProjects = !projects
    ? []
    : variant === 'compact'
      ? projects
      : projects.filter((p) => matchesFilter(p, filter))

  function handleOpen(project) {
    setActiveProject(project)
  }

  return (
    <>
      <section className="bg-industrial-900 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-xl">
            <span className="block w-16 h-1 bg-ember-600 mb-6" />
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-base-50">{t('projects.title')}</h2>
            <p className="mt-4 text-neutral-custom-400">{t('projects.subtitle')}</p>
          </div>

          {variant === 'full' && (
            <div className="mt-8 flex flex-wrap gap-2">
              {FILTER_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filter === key
                      ? 'bg-ember-600 text-base-50'
                      : 'bg-white/10 text-neutral-custom-400 hover:bg-white/15'
                  }`}
                >
                  {t(`projects.filters.${key}`)}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="mt-12 flex min-h-[320px] items-center justify-center">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-base-50/20 border-t-ember-600" />
            </div>
          ) : variant === 'compact' ? (
            <ProjectGroupPager projects={visibleProjects} t={t} onOpen={handleOpen} />
          ) : (
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {visibleProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} t={t} onOpen={handleOpen} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      <ProjectDetailModal project={activeProject} onClose={() => setActiveProject(null)} />
    </>
  )
}
