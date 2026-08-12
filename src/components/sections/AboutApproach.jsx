import { ClipboardList, LifeBuoy, Search, Wrench } from 'lucide-react'
import AboutStats from './AboutStats'
import { useTranslation } from '../../lib/i18n/useTranslation'

// AR Group's working process (analyze -> plan -> execute -> support) —
// a general project process, not the fire-compartmentation explanation
// (that concept lives on Home in ProcessTeaser and must not be duplicated
// here).
const STEPS = [
  { key: 'step1', icon: Search },
  { key: 'step2', icon: ClipboardList },
  { key: 'step3', icon: Wrench },
  { key: 'step4', icon: LifeBuoy },
]

function StepNode({ step, index, t }) {
  const Icon = step.icon
  const number = String(index + 1).padStart(2, '0')

  return (
    <div className="relative flex flex-1 flex-col items-center px-2 text-center">
      <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/25 text-base-50/90 md:h-16 md:w-16">
        <Icon size={20} strokeWidth={1.5} />
      </span>
      <span aria-hidden="true" className="relative z-10 mt-2.5 h-2 w-2 rounded-full bg-ember-600" />
      <span className="mt-2 font-heading text-xl font-bold leading-none text-ember-600 md:text-2xl">{number}</span>

      <h3 className="mt-2 font-heading text-xs font-bold uppercase tracking-[0.08em] text-base-50 md:text-sm">
        {t(`compartmentation.steps.${step.key}.title`)}
      </h3>
      <p className="mt-1.5 max-w-[170px] text-xs leading-relaxed text-neutral-custom-400">
        {t(`compartmentation.steps.${step.key}.description`)}
      </p>
    </div>
  )
}

/**
 * Dark approach section: left label/heading/paragraph, right a connected
 * 01-04 engineering-style sequence for AR Group's own project process (one
 * system, not four cards), and the verified fact panel (AboutStats) sitting
 * inside this same section rather than as its own full-width section.
 */
export default function AboutApproach() {
  const { t } = useTranslation('about')

  return (
    <section className="relative overflow-hidden bg-industrial-900 pb-10 pt-14 md:pb-14 md:pt-18">
      <span
        aria-hidden="true"
        className="absolute left-6 top-1/3 hidden -translate-y-1/2 -rotate-90 select-none whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.4em] text-white/20 lg:block"
      >
        AR GROUP — FIRESTOP
      </span>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-4">
            <span className="mb-5 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-neutral-custom-400">
              <span aria-hidden="true" className="h-px w-8 bg-neutral-custom-400/40" />
              {t('compartmentation.eyebrow')}
            </span>
            <h2 className="whitespace-pre-line font-heading text-2xl font-bold leading-tight text-base-50 md:text-3xl">
              {t('compartmentation.title')}
            </h2>
            <span aria-hidden="true" className="mt-4 block h-0.5 w-10 bg-ember-600" />
            <p className="mt-4 text-sm leading-relaxed text-neutral-custom-400">{t('compartmentation.description')}</p>
          </div>

          <div className="relative lg:col-span-8 lg:pt-1">
            <span aria-hidden="true" className="absolute inset-x-0 top-[38px] hidden h-px bg-white/10 lg:block" />
            <div className="relative flex flex-col gap-10 sm:flex-row sm:gap-2">
              {STEPS.map((step, index) => (
                <StepNode key={step.key} step={step} index={index} t={t} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 md:mt-16">
          <AboutStats />
        </div>
      </div>
    </section>
  )
}
