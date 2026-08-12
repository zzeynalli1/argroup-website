import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { useTranslation } from '../../lib/i18n/useTranslation'
import { products } from '../../data/products'
import ProductIllustration from '../ui/ProductIllustration'

function ProductCard({ product, t }) {
  const illustrationRef = useRef(null)

  function handleEnter() {
    gsap.to(illustrationRef.current, { scale: 1.06, duration: 0.4, ease: 'power2.out' })
  }

  function handleLeave() {
    gsap.to(illustrationRef.current, { scale: 1, duration: 0.3, ease: 'power2.out' })
  }

  return (
    <div
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className="group flex flex-col border-2 border-transparent bg-base-50 transition-colors duration-300 hover:border-ember-600"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-concrete-100">
        <span aria-hidden="true" className="absolute left-3 top-3 h-3 w-3 border-l border-t border-neutral-custom-400/30" />
        <span aria-hidden="true" className="absolute bottom-3 right-3 h-3 w-3 border-b border-r border-neutral-custom-400/30" />
        <div ref={illustrationRef} className="flex h-full w-full items-center justify-center p-8">
          <ProductIllustration variant={product.key} className="h-full w-full" />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-heading text-lg font-semibold text-industrial-950">{t(`items.${product.key}.name`)}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-neutral-custom-600">{t(`items.${product.key}.description`)}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {product.brands.map((brand) => (
            <span
              key={brand}
              className="border border-neutral-custom-400/25 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-custom-600"
            >
              {brand}
            </span>
          ))}
        </div>

        <Link
          to="/contact"
          className="mt-5 inline-flex items-center gap-1 self-start text-sm font-semibold text-ember-600 transition-colors hover:text-ember-800"
        >
          {t('learnMore')} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  )
}

export default function ProductsGrid({ activeCategory, activeBrand }) {
  const { t } = useTranslation('products')
  const gridRef = useRef(null)

  const visibleProducts = products.filter(
    (product) =>
      (!activeCategory || product.key === activeCategory) && (!activeBrand || product.brands.includes(activeBrand))
  )

  useEffect(() => {
    if (!gridRef.current) return
    gsap.fromTo(
      gridRef.current.children,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.05 }
    )
  }, [activeCategory, activeBrand])

  return (
    <section className="bg-base-100 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        {visibleProducts.length > 0 ? (
          <div
            ref={gridRef}
            className="grid grid-cols-1 divide-y divide-neutral-custom-400/20 border border-neutral-custom-400/20 sm:grid-cols-2 sm:divide-x lg:grid-cols-4"
          >
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} t={t} />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-neutral-custom-600">{t('noResults')}</p>
        )}
      </div>
    </section>
  )
}
