import { useTranslation } from '../../lib/i18n/useTranslation'
import Reveal from '../ui/Reveal'

/**
 * Full-bleed cinematic hero — the product photo is the section's actual
 * background (no boxed/bordered image container). The source photo has
 * dark negative space on its left and the product composition on its
 * right, so the text sits over that left space with a directional overlay
 * for legibility. object-position is right-top: right so the pipe assembly
 * at the photo's right edge never gets cropped, top because on wide/short
 * viewports object-fit:cover crops vertically — anchoring to the top keeps
 * the photographed scene intact and only trims the (unimportant) floor
 * area at the bottom instead of the top of the composition. Dropped the
 * diagonal TechnicalLines texture here — the photo now supplies all the
 * background detail, so the linework just looked busy on top of it.
 */
export default function ProductsHero() {
  const { t } = useTranslation('products')

  return (
    <section className="relative overflow-hidden bg-industrial-950 py-24 md:py-32 lg:py-36">
      <img
        src="/images/products/products-hero.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-right-top"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-industrial-950 via-industrial-950/70 to-industrial-950/10 md:via-industrial-950/45 md:to-transparent lg:via-industrial-950/25"
      />

      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal className="max-w-xl">
          <span className="mb-4 block font-mono text-xs uppercase tracking-[0.25em] text-ember-600">
            {t('hero.eyebrow')}
          </span>
          <span aria-hidden="true" className="mb-6 block h-1 w-16 bg-ember-600" />
          <h1 className="font-heading text-4xl font-bold leading-tight text-base-50 md:text-5xl lg:text-6xl">
            {t('pageTitle')}
          </h1>
          <p className="mt-6 max-w-lg text-lg text-neutral-custom-300">{t('subtitle')}</p>
        </Reveal>
      </div>
    </section>
  )
}
