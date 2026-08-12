import { Award, Lock, Shield, Users } from 'lucide-react'
import GridTexture from '../ui/GridTexture'
import TechnicalLines from '../ui/TechnicalLines'
import { useTranslation } from '../../lib/i18n/useTranslation'

const VALUE_ITEMS = [
  { key: 'quality', Icon: Award },
  { key: 'professionalism', Icon: Shield },
  { key: 'personnel', Icon: Users },
  { key: 'privacy', Icon: Lock },
]

const WALL_IMAGE = '/images/values/ar-group-values-badge.png'
const IMAGE_CLIP = 'polygon(0 0, 100% 0, 100% 32%, 34% 100%, 0 100%)'

function ValueCard({ item, t }) {
  const Icon = item.Icon
  return (
    <div className="group flex flex-col gap-3 rounded-[10px] border border-white/10 bg-industrial-950 p-5 transition-all duration-200 hover:-translate-y-[3px] hover:border-ember-600/50 lg:p-6">
      <Icon
        size={26}
        strokeWidth={1.5}
        className="text-ember-600 transition-transform duration-200 group-hover:-translate-y-0.5"
      />
      <h3 className="font-heading text-base font-bold text-base-50">{t(`values.items.${item.key}.title`)}</h3>
      <p className="text-sm leading-relaxed text-neutral-custom-400">
        {t(`values.items.${item.key}.description`)}
      </p>
    </div>
  )
}

/**
 * Values section — asymmetric composition: a full-bleed diagonally-cut
 * image on the left (absolute on desktop so it can reach the section's own
 * top/bottom edges) and dark graphite value cards on the right. No intro
 * sentence: about.json has no verified copy for one, so none is rendered
 * (values.heading + the four existing items are the only real content).
 * Mobile order is heading -> image -> cards, not image-first like desktop.
 */
export default function AboutStory() {
  const { t } = useTranslation('about')

  return (
    <section className="relative overflow-hidden bg-concrete-100 py-14 md:py-20">
      <GridTexture className="text-industrial-950" />
      <TechnicalLines className="text-industrial-950" opacity="opacity-[0.03]" angle={16} />

      {/* Desktop: full-bleed diagonally-cut image, left ~38% of the section */}
      <div className="absolute inset-y-0 left-0 z-0 hidden w-[38%] lg:block">
        <div className="relative h-full w-full" style={{ clipPath: IMAGE_CLIP }}>
          <img
            src={WALL_IMAGE}
            alt=""
            className="h-full w-full object-cover"
            style={{ objectPosition: '50% 46%' }}
            loading="lazy"
          />
        </div>
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full text-ember-600"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M 58 0 C 74 12, 70 24, 60 33"
            stroke="currentColor"
            strokeWidth="0.35"
            fill="none"
            opacity="0.75"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="lg:pl-[calc(38%+2.5rem)]">
          <span aria-hidden="true" className="mb-5 block h-0.5 w-9 bg-ember-600" />
          <h2 className="font-heading text-3xl font-bold leading-tight text-industrial-950 md:text-4xl">
            {t('values.heading')}
          </h2>

          {/* Mobile/tablet only: image between heading and cards */}
          <div className="my-8 lg:hidden">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[10px]">
              <span aria-hidden="true" className="absolute inset-x-0 top-0 z-10 h-1 bg-ember-600" />
              <img
                src={WALL_IMAGE}
                alt=""
                className="h-full w-full object-cover"
                style={{ objectPosition: '50% 46%' }}
                loading="lazy"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:mt-9 lg:grid-cols-4">
            {VALUE_ITEMS.map((item) => (
              <ValueCard key={item.key} item={item} t={t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
