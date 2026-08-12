import { BadgeCheck, Flame, Gem, Headphones } from 'lucide-react'
import { useTranslation } from '../../lib/i18n/useTranslation'

const REASONS = [
  { key: 'certifications', icon: BadgeCheck },
  { key: 'fireTested', icon: Flame },
  { key: 'premiumQuality', icon: Gem },
  { key: 'technicalSupport', icon: Headphones },
]

function ReasonCard({ reason, index, t }) {
  const Icon = reason.icon
  const number = String(index + 1).padStart(2, '0')

  return (
    <div className="flex flex-col items-start px-6 py-8 text-left first:pl-0">
      <div className="flex w-full items-center justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-ember-600 text-ember-600">
          <Icon size={20} strokeWidth={1.75} />
        </span>
        <span className="font-mono text-xs text-neutral-custom-400">{number}</span>
      </div>
      <h3 className="mt-5 font-heading text-lg font-semibold text-industrial-950">
        {t(`whyChoose.items.${reason.key}.title`)}
      </h3>
      <p className="mt-2 text-sm text-neutral-custom-600">{t(`whyChoose.items.${reason.key}.description`)}</p>
    </div>
  )
}

export default function WhyChooseProducts() {
  const { t } = useTranslation('products')

  return (
    <section className="bg-base-50 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-xl">
          <span aria-hidden="true" className="mb-4 block h-1 w-16 bg-ember-600" />
          <h2 className="font-heading text-3xl font-bold text-industrial-950 md:text-4xl">{t('whyChoose.title')}</h2>
        </div>

        <div className="mt-12 grid grid-cols-1 divide-y divide-neutral-custom-400/20 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {REASONS.map((reason, index) => (
            <ReasonCard key={reason.key} reason={reason} index={index} t={t} />
          ))}
        </div>
      </div>
    </section>
  )
}
