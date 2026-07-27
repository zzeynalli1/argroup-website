import { Building2, Clock, Flame, Wind } from 'lucide-react'
import { useTranslation } from '../../lib/i18n/useTranslation'

const REASONS = [
  { key: 'delaySpread', icon: Flame },
  { key: 'reduceSmoke', icon: Wind },
  { key: 'evacuationTime', icon: Clock },
  { key: 'protectStructure', icon: Building2 },
]

function ReasonCard({ reason, t }) {
  const Icon = reason.icon

  return (
    <div className="rounded-lg border border-white/10 bg-industrial-800/60 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-ember-600">
        <Icon size={20} className="text-ember-600" />
      </div>
      <p className="mt-4 text-sm text-base-50">{t(`whyFirestop.reasons.${reason.key}`)}</p>
    </div>
  )
}

export default function WhyFirestop() {
  const { t } = useTranslation('home')

  return (
    <section className="bg-industrial-950 py-16 md:py-24">
      <div className="px-6">
        <h2 className="font-heading text-3xl font-bold text-base-50 md:text-4xl">
          {t('whyFirestop.titlePrefix')} <span className="text-ember-600">{t('whyFirestop.titleHighlight')}</span>
        </h2>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {REASONS.map((reason) => (
            <ReasonCard key={reason.key} reason={reason} t={t} />
          ))}
        </div>
      </div>
    </section>
  )
}
