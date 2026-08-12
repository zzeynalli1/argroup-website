import { useRef } from 'react'
import { Anchor, Fan, Flame, Pipette, Thermometer, Waves } from 'lucide-react'
import gsap from 'gsap'
import { useTranslation } from '../../lib/i18n/useTranslation'
import { products } from '../../data/products'

const ICONS = { Flame, Pipette, Waves, Thermometer, Fan, Anchor }

function IndexItem({ product, index, t, isActive, onSelect }) {
  const Icon = ICONS[product.icon] ?? Flame
  const iconRef = useRef(null)
  const number = String(index + 1).padStart(2, '0')

  function handleEnter() {
    gsap.to(iconRef.current, { y: -2, duration: 0.25, ease: 'power2.out' })
  }

  function handleLeave() {
    gsap.to(iconRef.current, { y: 0, duration: 0.2, ease: 'power2.out' })
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(product.key)}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={`group flex shrink-0 flex-col items-start gap-3 border-l px-5 py-5 text-left transition-colors duration-200 sm:flex-1 ${
        isActive ? 'border-ember-600' : 'border-neutral-custom-400/25 hover:border-neutral-custom-400/60'
      }`}
    >
      <span className={`font-mono text-xs ${isActive ? 'text-ember-600' : 'text-neutral-custom-400'}`}>{number}</span>
      <span ref={iconRef} className={isActive ? 'text-ember-600' : 'text-industrial-950'}>
        <Icon size={22} strokeWidth={1.5} />
      </span>
      <span
        className={`font-heading text-sm font-semibold leading-snug ${
          isActive ? 'text-ember-600' : 'text-industrial-950'
        }`}
      >
        {t(`items.${product.key}.name`)}
      </span>
    </button>
  )
}

/** The "APPLICATION" layer of the Products page's 3-tier navigation
 * (Application -> Category -> Brand) — a numbered technical index rather
 * than a grid of icon-cards. */
export default function SolutionFinder({ activeCategory, onSelect }) {
  const { t } = useTranslation('products')

  return (
    <section className="bg-concrete-100 pt-16 md:pt-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-end justify-between gap-6 border-b border-neutral-custom-400/25 pb-6">
          <div>
            <span className="mb-3 block font-mono text-xs uppercase tracking-[0.25em] text-ember-600">
              {t('solutionFinder.eyebrow')}
            </span>
            <h2 className="font-heading text-2xl font-bold text-industrial-950 md:text-3xl">
              {t('solutionFinder.title')}
            </h2>
          </div>
          <span className="hidden font-mono text-xs text-neutral-custom-400 sm:block">
            {String(products.length).padStart(2, '0')} {t('tabs.all')}
          </span>
        </div>

        <div className="no-scrollbar flex overflow-x-auto sm:overflow-visible">
          {products.map((product, index) => (
            <IndexItem
              key={product.key}
              product={product}
              index={index}
              t={t}
              isActive={activeCategory === product.key}
              onSelect={(key) => onSelect(activeCategory === key ? null : key)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
