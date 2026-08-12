import FloatingElementsIllustration from '../ui/FloatingElementsIllustration'
import { useTranslation } from '../../lib/i18n/useTranslation'

export default function ServicesHero() {
  const { t } = useTranslation('services')

  return (
    <section className="relative overflow-hidden bg-base-50 pt-32 pb-16 md:pt-40 md:pb-20">
      <FloatingElementsIllustration
        className="pointer-events-none absolute -right-16 top-1/2 hidden w-[460px] -translate-y-1/2 opacity-[0.35] md:block lg:w-[560px]"
      />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <span className="mb-4 block font-heading text-xs font-semibold uppercase tracking-[0.2em] text-ember-600">
            {t('hero.eyebrow')}
          </span>
          <span aria-hidden="true" className="mb-6 block h-1 w-16 bg-ember-600" />
          <h1 className="font-heading text-4xl font-bold leading-tight text-industrial-950 md:text-5xl lg:text-6xl">
            {t('hero.title')}
          </h1>
          <p className="mt-6 max-w-lg text-lg text-neutral-custom-600">{t('hero.subtitle')}</p>
        </div>
      </div>
    </section>
  )
}
