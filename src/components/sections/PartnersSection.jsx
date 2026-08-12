import { Fragment } from 'react'
import { partners } from '../../data/partners'
import { useTranslation } from '../../lib/i18n/useTranslation'

function PartnerCard({ logoSrc }) {
  return (
    <div className="group flex flex-col items-center">
      <div className="flex aspect-[2/1] w-36 shrink-0 items-center justify-center rounded-lg border border-neutral-custom-400/20 bg-base-50 p-3 shadow-sm transition-transform duration-300 group-hover:-translate-y-1.5 xl:w-40">
        <img src={logoSrc} alt="Logo" className="h-full w-full object-contain" loading="lazy" />
      </div>
      <span
        aria-hidden="true"
        className="mt-5 h-2 w-2 rounded-full bg-neutral-custom-400/50 ring-4 ring-base-100 transition-all duration-300 group-hover:bg-ember-600 group-hover:shadow-[0_0_14px_3px_rgba(227,30,36,0.55)]"
      />
    </div>
  )
}

export default function PartnersSection() {
  const { t } = useTranslation('home')

  return (
    <section className="bg-base-100 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-3 block font-heading text-xs font-semibold uppercase tracking-[0.2em] text-ember-600">
            {t('partnersSection.label')}
          </span>
          <h2 className="font-heading text-3xl font-bold text-industrial-950 md:text-4xl">
            {t('partnersSection.title')}
          </h2>
          <p className="mt-4 text-neutral-custom-600">{t('partnersSection.subtitle')}</p>
        </div>

        <div className="relative mt-16">
          {/* Card is w-36 (144px) at aspect-[2/1] = 72px tall, + mt-5 gap (20px) +
              half the dot's own height (4px) = 96px to the dot's center;
              xl:w-40 (160px) = 80px tall -> 104px. The line is pinned to the
              same offsets so it passes through every dot's center. */}
          <div
            aria-hidden="true"
            className="absolute left-4 right-4 top-[96px] hidden h-px bg-neutral-custom-400/25 lg:block xl:top-[104px]"
          />
          <div className="flex flex-wrap items-start justify-center gap-x-2 gap-y-12 lg:flex-nowrap lg:gap-x-5 xl:gap-x-6">
            {partners.map((logoSrc, index) => (
              <Fragment key={logoSrc}>
                <PartnerCard logoSrc={logoSrc} />
                {index < partners.length - 1 && (
                  <span aria-hidden="true" className="hidden self-center pb-6 font-heading text-ember-600 lg:block">
                    •
                  </span>
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
