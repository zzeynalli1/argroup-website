import { useTranslation } from '../../lib/i18n/useTranslation'
import Reveal from '../ui/Reveal'

const HERO_IMAGE = '/images/services/services-hero.webp'

// Wraps the single translated `highlight` word/phrase (e.g. "icraya") in the
// AR-red accent span wherever it occurs in a heading line — keeps the accent
// data-driven per locale instead of hardcoding which segment is red.
function HighlightedLine({ line, highlight }) {
  if (!highlight) return line
  const index = line.indexOf(highlight)
  if (index === -1) return line
  return (
    <>
      {line.slice(0, index)}
      <span className="text-ember-600">{highlight}</span>
      {line.slice(index + highlight.length)}
    </>
  )
}

/**
 * Services hero: short verified copy on the left over a full-bleed
 * panoramic engineering/BIM photo used as an integrated background layer
 * (not a boxed image) — the photo itself already fades from a near-white
 * wireframe on the left into a fully rendered, detailed structure on the
 * right, and the CSS mask below reinforces that same left-to-right fade so
 * it blends into the section's own bg-base-50 regardless of viewport width.
 */
export default function ServicesHero() {
  const { t } = useTranslation('services')
  const titleLines = t('hero.title').split('\n')
  const highlight = t('hero.titleHighlight')

  return (
    <section className="relative overflow-hidden bg-base-50 pt-32 pb-8 md:pt-40 md:pb-10 lg:pb-12">
      {/* Desktop/tablet: full-height background image, weighted to the
          right, masked so it fades away toward the left instead of ending
          in a hard rectangular edge. */}
      <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden="true">
        <img
          src={HERO_IMAGE}
          alt=""
          className="h-full w-full object-cover object-[72%_15%]"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, transparent 30%, black 68%, black 100%)',
            maskImage: 'linear-gradient(to right, transparent 0%, transparent 30%, black 68%, black 100%)',
          }}
        />
      </div>

      {/* Mobile: a low, subtle band instead of squeezing the panorama
          behind the text — heading stays the priority. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 overflow-hidden opacity-[0.18] md:hidden" aria-hidden="true">
        <img
          src={HERO_IMAGE}
          alt=""
          className="h-full w-full object-cover object-[78%_35%]"
          style={{
            WebkitMaskImage: 'linear-gradient(to top, black 25%, transparent 100%)',
            maskImage: 'linear-gradient(to top, black 25%, transparent 100%)',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal className="max-w-sm md:max-w-[280px] xl:max-w-xl">
          <span className="mb-4 block font-heading text-xs font-semibold uppercase tracking-[0.2em] text-ember-600">
            {t('hero.eyebrow')}
          </span>
          <span aria-hidden="true" className="mb-6 block h-1 w-16 bg-ember-600" />
          <h1 className="font-heading text-4xl font-bold leading-[1.1] tracking-tight text-industrial-950 md:text-5xl lg:text-6xl">
            {titleLines.map((line, index) => (
              <span key={index} className="block">
                <HighlightedLine line={line} highlight={highlight} />
              </span>
            ))}
          </h1>
          <p className="mt-5 max-w-lg text-lg text-neutral-custom-600">{t('hero.subtitle')}</p>
        </Reveal>
      </div>
    </section>
  )
}
