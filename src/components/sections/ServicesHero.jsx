import { useTranslation } from '../../lib/i18n/useTranslation'
import TechnicalLines from '../ui/TechnicalLines'
import ImagePlaceholder from '../ui/ImagePlaceholder'
import Reveal from '../ui/Reveal'

/**
 * Compact intro — short verified copy on the left, a large engineering
 * image placeholder on the right, so the page moves into the service
 * showcase quickly instead of a full marketing hero.
 */
export default function ServicesHero() {
  const { t } = useTranslation('services')

  return (
    <section className="relative overflow-hidden bg-base-50 pt-32 pb-14 md:pt-40 md:pb-16">
      <TechnicalLines className="text-industrial-950" opacity="opacity-[0.04]" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <span className="mb-4 block font-heading text-xs font-semibold uppercase tracking-[0.2em] text-ember-600">
            {t('hero.eyebrow')}
          </span>
          <span aria-hidden="true" className="mb-6 block h-1 w-16 bg-ember-600" />
          <h1 className="font-heading text-4xl font-bold leading-tight text-industrial-950 md:text-5xl">
            {t('hero.title')}
          </h1>
          <p className="mt-5 max-w-lg text-lg text-neutral-custom-600">{t('hero.subtitle')}</p>
        </Reveal>

        <Reveal delay={0.1}>
          <ImagePlaceholder label="Engineering site / technical overview" aspect="aspect-[4/3]" tone="light" />
        </Reveal>
      </div>
    </section>
  )
}
