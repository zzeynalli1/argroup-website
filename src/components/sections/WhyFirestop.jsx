import { Clock, CloudFog, Flame, Shield } from 'lucide-react'
import { useTranslation } from '../../lib/i18n/useTranslation'

const REASONS = [
  { key: 'delaySpread', icon: Flame },
  { key: 'reduceSmoke', icon: CloudFog },
  { key: 'evacuationTime', icon: Clock },
  { key: 'protectStructure', icon: Shield },
]

function ReasonColumn({ reason, index, t }) {
  const Icon = reason.icon
  const number = String(index + 1).padStart(2, '0')

  return (
    <div className="px-6 py-8 first:pl-0 last:pr-0 sm:px-8 sm:py-10">
      <div className="flex items-center gap-4">
        <span aria-hidden="true" className="font-heading text-6xl font-bold leading-none text-ember-600/10 md:text-7xl">
          {number}
        </span>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ember-600">
          <Icon size={18} className="text-ember-600" />
        </span>
      </div>

      <h3 className="mt-5 font-heading text-lg font-bold text-base-50">
        {t(`whyFirestop.reasons.${reason.key}.title`)}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-neutral-custom-400">
        {t(`whyFirestop.reasons.${reason.key}.description`)}
      </p>
    </div>
  )
}

/**
 * No <section>/background of its own — rendered inside Materials.jsx's
 * <section> so the two flow together as one continuous block (same
 * industrial-900 backdrop, no dividing line). Not used anywhere else.
 */
export default function WhyFirestop() {
  const { t } = useTranslation('home')

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-heading text-3xl font-bold text-base-50 md:text-4xl">
          {t('whyFirestop.titlePrefix')} <span className="text-ember-600">{t('whyFirestop.titleHighlight')}</span>
        </h2>
      </div>

      <div className="mt-12 grid grid-cols-1 divide-y divide-neutral-custom-400/20 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        {REASONS.map((reason, index) => (
          <ReasonColumn key={reason.key} reason={reason} index={index} t={t} />
        ))}
      </div>
    </div>
  )
}
