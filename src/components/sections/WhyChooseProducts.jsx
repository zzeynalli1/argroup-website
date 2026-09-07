import { BadgeCheck, Flame, Gem, Headphones } from 'lucide-react'
import { useTranslation } from '../../lib/i18n/useTranslation'

const REASONS = [
  { key: 'certifications', icon: BadgeCheck },
  { key: 'fireTested', icon: Flame },
  { key: 'premiumQuality', icon: Gem },
  { key: 'technicalSupport', icon: Headphones },
]

function ReasonCard({ reason, t }) {
  const Icon = reason.icon
  return (
    <div className="flex flex-col gap-3 px-6 py-8 text-left first:pl-0 last:pr-0">
      <Icon size={22} strokeWidth={1.5} className="text-ember-600" />
      <span aria-hidden="true" className="h-px w-8 bg-ember-600" />
      <h3 className="font-heading text-base font-semibold text-industrial-950 md:text-lg">
        {t(`whyChoose.items.${reason.key}.title`)}
      </h3>
      <p className="text-sm text-neutral-custom-600">{t(`whyChoose.items.${reason.key}.description`)}</p>
    </div>
  )
}

/**
 * Compact light architectural strip breaking up the Products page's dark
 * sections (CLAUDE.md dark/light rhythm rule) — warm concrete background
 * rather than sterile white, vertical technical separators instead of
 * floating white cards, no visible numbering.
 */
export default function WhyChooseProducts() {
  const { t } = useTranslation('products')

  return (
    <section className="bg-concrete-100 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-xl border-b border-industrial-950/10 pb-8">
          <span aria-hidden="true" className="mb-4 block h-1 w-16 bg-ember-600" />
          <h2 className="font-heading text-2xl font-bold text-industrial-950 md:text-3xl">{t('whyChoose.title')}</h2>
        </div>

        <div className="mt-10 grid grid-cols-1 divide-y divide-industrial-950/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {REASONS.map((reason) => (
            <ReasonCard key={reason.key} reason={reason} t={t} />
          ))}
        </div>
      </div>
    </section>
  )
}
