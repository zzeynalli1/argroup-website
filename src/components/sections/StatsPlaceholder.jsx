// TODO: Real statistika daxil olan kimi bu dəyərləri əvəz et - src/data/stats.js
// faylından idarə olunur.
import { Calendar, Building2, Award, Users } from 'lucide-react'
import { stats } from '../../data/stats'
import { useTranslation } from '../../lib/i18n/useTranslation'

// Icon lookup keyed by the stat's i18n label key — presentation-only, so
// stats.js itself stays the plain { value, label } shape the data was specced as.
const ICONS = {
  'stats.experience': Calendar,
  'stats.completedProjects': Building2,
  'stats.certifications': Award,
  'stats.employeeCount': Users,
}

export default function StatsPlaceholder() {
  const { t } = useTranslation('about')

  return (
    <section className="bg-base-50 py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* ember-900 (darker than the ember-800 brand red) for richer
            contrast against white text/amber icons, per design feedback. */}
        <div className="rounded-2xl bg-ember-900 shadow-xl px-6 py-10 md:px-12 md:py-14">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y divide-x divide-white/15 lg:divide-y-0">
            {stats.map((stat) => {
              const Icon = ICONS[stat.label]
              return (
                <div key={stat.label} className="flex flex-col items-center text-center px-4 py-6 lg:py-0">
                  {Icon && <Icon className="text-amber-500 mb-3" size={26} />}
                  <p className="font-heading text-4xl md:text-5xl font-bold text-white">{stat.value ?? '—'}</p>
                  <p className="mt-2 text-sm text-white/70">{t(stat.label)}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
