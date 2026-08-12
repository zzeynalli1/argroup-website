import { CalendarClock, ShieldCheck } from 'lucide-react'
import { stats } from '../../data/stats'
import { useTranslation } from '../../lib/i18n/useTranslation'

/**
 * Graphite fact panel embedded at the bottom of the dark approach section
 * (not a standalone section) — three verified cells, not four invented
 * ones. Two numeric cells come from the single confirmed figure in
 * src/data/stats.js (years of experience / founding year, same source
 * expressed two ways); the third is a verified non-numeric fact (the core
 * specialty copy also used elsewhere in about.json) rather than a padded-out
 * unverified count. See stats.js for why customer/project/cert counts are
 * deliberately excluded.
 */
export default function AboutStats() {
  const { t } = useTranslation('about')
  const yearsExperience = stats[0].value

  return (
    <div
      className="relative mx-auto flex max-w-5xl flex-col divide-y divide-metal-500/20 bg-industrial-800 md:flex-row md:divide-x md:divide-y-0"
      style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%)' }}
    >
      <div className="flex flex-1 items-center gap-3 px-6 py-6 md:px-8">
        <ShieldCheck size={18} strokeWidth={1.75} className="shrink-0 text-ember-600" />
        <div>
          <span className="font-heading text-3xl font-bold leading-none text-base-50 md:text-4xl">
            {yearsExperience}+
          </span>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-neutral-custom-400">
            {t('stats.experience')}
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center gap-3 px-6 py-6 md:px-8">
        <CalendarClock size={18} strokeWidth={1.75} className="shrink-0 text-ember-600" />
        <div>
          <span className="font-heading text-3xl font-bold leading-none text-base-50 md:text-4xl">2018</span>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-neutral-custom-400">
            {t('stats.foundedLabel')}
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center px-6 py-6 md:px-8">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-ember-600">
            {t('capabilities.primary.label')}
          </p>
          <p className="mt-1 font-heading text-sm font-bold leading-snug text-base-50">
            {t('capabilities.primary.title')}
          </p>
        </div>
      </div>
    </div>
  )
}
