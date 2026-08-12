import { Link } from 'react-router-dom'
import { LayoutGrid, SeparatorHorizontal, SeparatorVertical, ShieldCheck } from 'lucide-react'
import Button from '../ui/Button'
import { useTranslation } from '../../lib/i18n/useTranslation'

const STEPS = [
  { key: 'step1', icon: LayoutGrid },
  { key: 'step2', icon: SeparatorVertical },
  { key: 'step3', icon: SeparatorHorizontal },
  { key: 'step4', icon: ShieldCheck },
]

function StepCard({ step, index, t }) {
  const Icon = step.icon
  const number = String(index + 1).padStart(2, '0')

  return (
    <div className="relative flex flex-col items-center px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-ember-600 bg-base-50 text-ember-600">
        <Icon size={22} />
      </span>
      <span className="mt-3 font-heading text-xs font-semibold uppercase tracking-[0.2em] text-neutral-custom-400">
        {number}
      </span>
      <h3 className="mt-2 font-heading text-base font-bold text-industrial-950">
        {t(`process.steps.${step.key}.title`)}
      </h3>
      <p className="mt-2 max-w-[220px] text-sm leading-relaxed text-neutral-custom-600">
        {t(`process.steps.${step.key}.description`)}
      </p>
    </div>
  )
}

/**
 * Home-page teaser explaining fire compartmentation in AR Group's own words
 * (zones -> vertical isolation -> horizontal isolation -> sealed
 * penetrations) — concept sourced from the AR Group CS presentation, not a
 * copy of its diagram. Links to the services grid on /services, which is
 * where a visitor would go next for the systems themselves.
 */
export default function ProcessTeaser() {
  const { t } = useTranslation('home')

  return (
    <section className="border-t border-neutral-custom-400/10 bg-base-50 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto mb-6 block h-1 w-16 bg-amber-500" />
          <h2 className="font-heading text-2xl font-bold text-industrial-950 md:text-3xl">
            {t('processTeaser.heading')}
          </h2>
          <p className="mt-4 text-neutral-custom-600">{t('processTeaser.description')}</p>
        </div>

        <div className="relative mt-14">
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-7 hidden h-px bg-neutral-custom-400/20 sm:block"
          />
          <div className="relative grid grid-cols-1 gap-10 sm:grid-cols-4 sm:gap-4">
            {STEPS.map((step, index) => (
              <StepCard key={step.key} step={step} index={index} t={t} />
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link to="/services#process" className="inline-block">
            <Button variant="ember">{t('processTeaser.cta')}</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
