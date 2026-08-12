import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import TechnicalLines from '../ui/TechnicalLines'
import { useTranslation } from '../../lib/i18n/useTranslation'

/**
 * Editorial identity intro, recomposed to a ~42/58 split. `hero.headline` is
 * the existing `subtitle` sentence split into prefix/emphasis/suffix so one
 * real phrase can render in ember without hand-picking new copy —
 * concatenating the three pieces reproduces the original verified sentence
 * exactly (see about.json per locale).
 *
 * Desktop: the hero image (AR Group's concrete-wall logo render,
 * public/images/hero/ar-group-concrete-wall-2.png) is full-bleed behind the
 * ENTIRE section, not just the right column — a multi-stop white gradient
 * layered on top is what actually reveals it, going from ~97% opaque over
 * the text column down to fully transparent by the right side. That's the
 * only thing controlling visibility; the image itself is untouched/unmasked
 * so it stays full-contrast where it's meant to be seen. The text column's
 * left-side spacer div only reserves grid height, it renders nothing.
 */
export default function AboutHero() {
  const { t } = useTranslation('about')

  return (
    <section className="relative overflow-hidden bg-base-50">
      <div className="absolute inset-0 hidden lg:block">
        <img
          src="/images/hero/ar-group-concrete-wall-2.png"
          alt=""
          className="h-full w-full object-cover"
          style={{ objectPosition: '65% 45%' }}
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 hidden lg:block"
        style={{
          background:
            'linear-gradient(to right, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.95) 25%, rgba(255,255,255,0.9) 38%, rgba(255,255,255,0.6) 46%, rgba(255,255,255,0.25) 54%, rgba(255,255,255,0.05) 62%, rgba(255,255,255,0) 70%)',
        }}
      />

      <TechnicalLines className="text-industrial-950" opacity="opacity-[0.035]" />

      <div className="relative grid grid-cols-1 lg:grid-cols-12 lg:min-h-[440px]">
        <div className="relative z-10 flex flex-col justify-center px-6 pt-28 pb-12 md:pt-32 md:pb-14 lg:col-span-5 lg:pr-10">
          <span className="mb-5 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-ember-600">
            <span aria-hidden="true" className="h-px w-8 bg-ember-600" />
            {t('pageTitle')}
          </span>
          <h1 className="font-heading text-3xl font-bold leading-[1.15] text-industrial-950 md:text-4xl lg:text-[2.75rem]">
            {t('hero.headline.prefix')}
            <span className="text-ember-600">{t('hero.headline.emphasis')}</span>
            {t('hero.headline.suffix')}
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-neutral-custom-600">{t('intro')}</p>

          <Link
            to="/contact"
            className="mt-8 inline-flex w-fit items-center gap-0 bg-industrial-950 text-sm font-semibold text-base-50 transition-colors hover:bg-industrial-800"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-ember-600">
              <ArrowRight size={17} />
            </span>
            <span className="px-5">{t('closing.button')}</span>
          </Link>
        </div>

        <div className="hidden lg:col-span-7 lg:block" />
      </div>

      {/* Corner flag accent, aligned to where the old image column began (5/12) */}
      <div
        aria-hidden="true"
        className="absolute top-0 z-[2] hidden h-14 w-14 overflow-hidden lg:block"
        style={{ left: '41.6667%' }}
      >
        <div className="absolute inset-0 bg-industrial-950" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
        <div className="absolute inset-0 bg-ember-600" style={{ clipPath: 'polygon(0 0, 55% 0, 0 55%)' }} />
      </div>

      <div className="relative h-48 w-full sm:h-56 lg:hidden">
        <img
          src="/images/hero/ar-group-concrete-wall-2.png"
          alt=""
          className="h-full w-full object-cover"
          style={{
            objectPosition: '65% 45%',
            maskImage:
              'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.16) 5%, rgba(0,0,0,0.55) 11%, rgba(0,0,0,0.9) 17%, black 23%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.16) 5%, rgba(0,0,0,0.55) 11%, rgba(0,0,0,0.9) 17%, black 23%)',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
          }}
        />
      </div>
    </section>
  )
}
