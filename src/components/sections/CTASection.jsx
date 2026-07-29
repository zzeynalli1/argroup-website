import { Link } from 'react-router-dom'
import Button from '../ui/Button'
import { useTranslation } from '../../lib/i18n/useTranslation'

export default function CTASection() {
  const { t } = useTranslation('home')

  return (
    <section className="relative overflow-hidden bg-base-100">
      {/* Below md the side-fade layout has no room for the image without
          covering the text, so it stacks as a plain top banner instead. */}
      <div className="md:hidden">
        <picture>
          <source srcSet="/images/cta/cta-building.webp" type="image/webp" />
          <img
            src="/images/cta/cta-building.jpg"
            alt="AR Group tikinti sahəsi"
            loading="lazy"
            className="h-56 w-full object-cover object-right sm:h-72"
          />
        </picture>
      </div>

      <div className="absolute inset-y-0 right-0 hidden w-[70%] [mask-image:linear-gradient(to_right,transparent,black_25%)] md:block lg:w-[62%]">
        <picture>
          <source srcSet="/images/cta/cta-building.webp" type="image/webp" />
          <img
            src="/images/cta/cta-building.jpg"
            alt="AR Group tikinti sahəsi"
            loading="lazy"
            className="h-full w-full object-cover object-right"
          />
        </picture>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-12 md:py-20 lg:py-28">
        <div className="max-w-lg">
          <span className="mb-4 block font-heading text-xs font-semibold uppercase tracking-[0.2em] text-ember-600">
            {t('cta.label')}
          </span>
          <h2 className="font-heading text-4xl font-bold leading-tight text-industrial-950 md:text-5xl">
            {t('cta.titleLine1')}
            <br />
            <span className="text-ember-600">{t('cta.titleLine2')}</span>
          </h2>
          <p className="mt-6 max-w-md text-lg text-neutral-custom-600">{t('cta.subtitle')}</p>
          <Link to="/contact" className="mt-8 inline-block">
            <Button variant="ember">{t('cta.button')}</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
