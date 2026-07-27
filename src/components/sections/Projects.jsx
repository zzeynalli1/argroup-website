import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { projects } from '../../data/projects'
import { useTranslation } from '../../lib/i18n/useTranslation'

const COMPACT_COUNT = 6

const FILTER_KEYS = ['all', 'completed', 'ongoing']

function matchesFilter(project, filterKey) {
  return filterKey === 'all' || project.status === filterKey
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

function ProjectCard({ project, t }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="group rounded-lg overflow-hidden border border-neutral-custom-400/20"
    >
      <div className="relative aspect-video bg-neutral-custom-400/15 overflow-hidden">
        <div className="w-full h-full flex items-center justify-center text-neutral-custom-600 text-sm text-center px-2">
          {t('projects.imagePlaceholder')}
        </div>
        <div className="absolute inset-0 bg-ember-600/0 group-hover:bg-ember-600/10 transition-colors duration-300" />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-heading font-semibold text-industrial-950">{project.title}</p>
          <StatusBadge status={project.status} t={t} />
        </div>
        <p className="mt-1 text-sm text-neutral-custom-600">{project.client}</p>
        <p className="mt-1 text-xs text-neutral-custom-400">{project.location}</p>
      </div>
    </motion.div>
  )
}

/**
 * `variant="compact"` (Home): first 6 projects, unfiltered, plus a
 * "view all" link to /projects.
 * `variant="full"` (/projects): all projects, with filter buttons.
 */
export default function Projects({ variant = 'full' }) {
  const { t } = useTranslation('home')
  const [filter, setFilter] = useState('all')

  const visibleProjects =
    variant === 'compact' ? projects.slice(0, COMPACT_COUNT) : projects.filter((p) => matchesFilter(p, filter))

  return (
    <section className="bg-base-50 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-xl">
          <span className="block w-16 h-1 bg-ember-600 mb-6" />
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-industrial-950">{t('projects.title')}</h2>
          <p className="mt-4 text-neutral-custom-600">{t('projects.subtitle')}</p>
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
                    : 'bg-neutral-custom-400/10 text-neutral-custom-600 hover:bg-neutral-custom-400/20'
                }`}
              >
                {t(`projects.filters.${key}`)}
              </button>
            ))}
          </div>
        )}

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {visibleProjects.map((project) => (
              <ProjectCard key={project.id} project={project} t={t} />
            ))}
          </AnimatePresence>
        </div>

        {variant === 'compact' && (
          <div className="mt-10">
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 font-heading font-semibold text-industrial-950 hover:text-ember-600 transition-colors"
            >
              {t('projects.viewAll')}
              <span>→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
