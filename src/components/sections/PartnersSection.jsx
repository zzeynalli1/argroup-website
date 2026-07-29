import { Fragment } from 'react'
import { partners } from '../../data/partners'
import { useTranslation } from '../../lib/i18n/useTranslation'

// Card is h-16 (64px) + mt-5 gap (20px) + half the dot's own height (4px) =
// 88px from the card column's top to the dot's center — the connector line
// below the row is pinned to that same offset so it passes through every
// dot's center regardless of viewport width.
const CONNECTOR_OFFSET = 88

function PartnerCard({ logoSrc }) {
  return (
    <div className="group flex flex-col items-center">
      <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg border border-neutral-custom-400/20 bg-base-50 px-2 text-center shadow-sm transition-transform duration-300 group-hover:-translate-y-1.5 xl:w-28">
        <img src={logoSrc} alt="Logo" className="max-h-12 w-auto object-contain" loading="lazy" />
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
          <div
            aria-hidden="true"
            className="absolute left-4 right-4 hidden h-px bg-neutral-custom-400/25 lg:block"
            style={{ top: `${CONNECTOR_OFFSET}px` }}
          />
          <div className="flex flex-wrap items-start justify-center gap-x-1 gap-y-10 lg:flex-nowrap lg:gap-x-3 xl:gap-x-4">
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
