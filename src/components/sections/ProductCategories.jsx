import { ArrowRight, Flame, Package, Volume2, Waves } from 'lucide-react'
import { useTranslation } from '../../lib/i18n/useTranslation'
import TechnicalLines from '../ui/TechnicalLines'
import Reveal from '../ui/Reveal'

// The Products landing page shows exactly these 3 categories (of the 9 real
// categories in data/products.js — see that file for the full taxonomy).
// Each photo has its negative space on the left and its technical subject
// center-right, so `objectPosition` is tuned per image/breakpoint to keep
// that subject in frame under object-fit:cover while the text (also
// left-anchored, see CategoryPanel) sits over the darker side of the photo.
const PANELS = [
  {
    key: 'passiveFireProtection',
    icon: Flame,
    featured: true,
    image: '/images/products/firestop-category.webp',
    objectPosition: 'object-[68%_center] lg:object-center',
  },
  {
    key: 'vibrationInsulation',
    icon: Waves,
    image: '/images/products/vibration-category.webp',
    objectPosition: 'object-[62%_center] lg:object-center',
  },
  {
    key: 'soundAcoustic',
    icon: Volume2,
    image: '/images/products/acoustic-category.webp',
    objectPosition: 'object-[78%_center] lg:object-[68%_center]',
  },
]

// No real photography exists for this category yet (see data/products.js's
// own comment) — rendered as a lightweight text-only entry below the photo
// panels instead of a placeholder photo tile, per the approved decision.
// Drives the same activeCategory/toggle wiring as the photo panels above,
// so it opens the same ExpandedProductCategory panel below.
const EXTRA_CATEGORY = { key: 'additionalProducts', icon: Package }

/**
 * Full-bleed architectural panel — the category photo IS the module (no
 * boxed/bordered image container, no text-beside-image column split). Title,
 * description and CTA sit directly over the image's left/darker side behind
 * a left-to-right gradient (all 3 source photos share that composition —
 * negative space left, subject center-right); hover only nudges the image
 * scale, the red line width and the arrow position (see CLAUDE.md
 * interaction-restraint rule — no tilt/glow/glassmorphism). `isActive`
 * mirrors the pre-redesign selection state so the existing activeCategory
 * wiring in pages/Products.jsx keeps working even though there's no detail
 * route to navigate to yet.
 */
function CategoryPanel({ panel, t, isActive, onSelect, className = '' }) {
  const Icon = panel.icon
  // Acoustic's title runs a line longer than Vibration's, which left it
  // reading more compressed next to Vibration — more pt (shifting the
  // justify-center block down) plus a touch more pb-side gap gives it the
  // same breathing room. Values are tuned to the fixed panel height at the
  // lg breakpoint (see the lg:h-[760px]/lg:grid-rows-[...] row above) so
  // this never pushes content past the bottom edge.
  const isAcoustic = panel.key === 'soundAcoustic'

  return (
    <button
      type="button"
      onClick={() => onSelect(panel.key)}
      aria-pressed={isActive}
      className={`group relative block h-full w-full overflow-hidden border-0 bg-transparent p-0 text-left transition-colors duration-300 ${
        isActive ? 'ring-1 ring-inset ring-ember-600' : ''
      } ${className}`}
    >
      <img
        src={panel.image}
        alt={t(`items.${panel.key}.name`)}
        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none ${panel.objectPosition}`}
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-industrial-950/90 via-industrial-950/45 to-transparent transition-opacity duration-500 ease-out group-hover:from-industrial-950/95 group-hover:via-industrial-950/55"
      />

      <div
        className={`absolute inset-0 flex flex-col justify-center px-6 md:px-8 lg:px-10 ${
          isAcoustic
            ? 'gap-4 pt-8 pb-6 md:pt-10 md:pb-7 lg:pt-12 lg:pb-8'
            : 'gap-3 pt-6 pb-6 md:pt-8 md:pb-8 lg:pt-10 lg:pb-10'
        }`}
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
            isActive ? 'border-ember-600 text-ember-600' : 'border-white/25 text-base-50 group-hover:border-ember-600 group-hover:text-ember-600'
          }`}
        >
          <Icon size={18} strokeWidth={1.5} />
        </span>

        <span
          aria-hidden="true"
          className={`h-px shrink-0 bg-ember-600 transition-all duration-500 ease-out motion-reduce:transition-none ${
            isActive ? 'w-16' : 'w-10 group-hover:w-16'
          }`}
        />

        <h3
          className={`font-heading font-bold leading-[1.1] text-base-50 ${
            panel.featured ? 'max-w-md text-3xl md:text-4xl lg:text-5xl' : 'max-w-[26rem] text-2xl md:text-3xl'
          }`}
        >
          {t(`items.${panel.key}.name`)}
        </h3>

        <p className={`text-neutral-custom-300 ${panel.featured ? 'max-w-sm text-base md:text-lg' : 'max-w-[26rem] text-sm md:text-base'}`}>
          {t(`items.${panel.key}.description`)}
        </p>

        <span className="mt-1 inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-ember-600">
          {t('learnMore')}
          <ArrowRight size={16} className="transition-transform duration-300 ease-out group-hover:translate-x-1.5 motion-reduce:transition-none" />
        </span>
      </div>
    </button>
  )
}

/**
 * Cinematic three-category showcase — replaces the old 7-module bento mosaic
 * (all 9 real categories) with the 3 categories the landing page now
 * presents: Firestop, Vibration Insulation, Acoustic Insulation. Firestop is
 * the dominant full-width panel; the other two share the row below —
 * asymmetric on purpose so this doesn't read as another even Services-style
 * grid. One responsive grid handles desktop/tablet/mobile (Vibration and
 * Acoustic naturally stack under Firestop once the row drops to one column),
 * so there's no separate mobile-only markup branch to keep in sync.
 */
export default function ProductCategories({ activeCategory, onSelect }) {
  const { t } = useTranslation('products')

  function toggle(key) {
    onSelect(activeCategory === key ? null : key)
  }

  const [featured, ...rest] = PANELS

  return (
    <section className="relative overflow-hidden bg-industrial-900 py-16 md:py-24">
      <TechnicalLines className="text-base-50" opacity="opacity-[0.04]" />
      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal className="border-b border-white/10 pb-8">
          <span className="mb-3 block font-mono text-xs uppercase tracking-[0.25em] text-ember-600">
            {t('solutionFinder.eyebrow')}
          </span>
          <h2 className="font-heading text-2xl font-bold text-base-50 md:text-3xl">{t('solutionFinder.title')}</h2>
        </Reveal>

        <Reveal delay={0.1} className="mt-10 grid gap-3 lg:h-[760px] lg:grid-rows-[1.35fr_1fr]">
          <CategoryPanel
            panel={featured}
            t={t}
            isActive={activeCategory === featured.key}
            onSelect={toggle}
            className="min-h-[460px] sm:min-h-[520px] lg:min-h-0"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {rest.map((panel) => (
              <CategoryPanel
                key={panel.key}
                panel={panel}
                t={t}
                isActive={activeCategory === panel.key}
                onSelect={toggle}
                className="min-h-[360px] lg:min-h-0"
              />
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <button
            type="button"
            onClick={() => toggle(EXTRA_CATEGORY.key)}
            aria-pressed={activeCategory === EXTRA_CATEGORY.key}
            className={`group mt-3 flex w-full items-center justify-between gap-4 border px-5 py-4 text-left transition-colors duration-300 md:px-6 ${
              activeCategory === EXTRA_CATEGORY.key
                ? 'border-ember-600 bg-industrial-950'
                : 'border-white/10 bg-industrial-950/60 hover:border-ember-600'
            }`}
          >
            <span className="flex items-center gap-3">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
                  activeCategory === EXTRA_CATEGORY.key
                    ? 'border-ember-600 text-ember-600'
                    : 'border-white/25 text-base-50 group-hover:border-ember-600 group-hover:text-ember-600'
                }`}
              >
                <EXTRA_CATEGORY.icon size={16} strokeWidth={1.5} />
              </span>
              <span className="font-heading text-base font-semibold text-base-50 md:text-lg">
                {t(`items.${EXTRA_CATEGORY.key}.name`)}
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-ember-600">
              {t('learnMore')}
              <ArrowRight
                size={16}
                className={`transition-transform duration-300 ease-out group-hover:translate-x-1.5 motion-reduce:transition-none ${
                  activeCategory === EXTRA_CATEGORY.key ? 'translate-x-1.5' : ''
                }`}
              />
            </span>
          </button>
        </Reveal>
      </div>
    </section>
  )
}
