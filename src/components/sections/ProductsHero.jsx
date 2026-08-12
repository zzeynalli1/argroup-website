import { brands } from '../../data/brands'
import { products } from '../../data/products'
import { useTranslation } from '../../lib/i18n/useTranslation'

export default function ProductsHero() {
  const { t } = useTranslation('products')
  const categoryCount = String(products.length).padStart(2, '0')

  return (
    <section className="relative overflow-hidden bg-base-50 pt-32 pb-16 md:pt-40 md:pb-20">
      {/* Real AR Group brand-partner logos (same assets as the Home page
          Brands section) as a low-opacity decorative composition — not a
          generic illustration, and not fabricated brand names. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 top-1/2 hidden w-[480px] -translate-y-1/2 grid-cols-3 gap-6 md:grid lg:w-[560px] [&>*:nth-child(2n)]:translate-y-8"
      >
        {brands.map((logoSrc) => (
          <div
            key={logoSrc}
            className="pointer-events-auto flex h-16 items-center justify-center opacity-25 grayscale transition-all duration-300 hover:opacity-90 hover:grayscale-0"
          >
            <img src={logoSrc} alt="" className="max-h-10 w-auto object-contain" loading="lazy" />
          </div>
        ))}
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <span className="mb-4 block font-mono text-xs uppercase tracking-[0.25em] text-ember-600">
            {t('hero.eyebrow')}
          </span>
          <span aria-hidden="true" className="mb-6 block h-1 w-16 bg-ember-600" />
          <h1 className="font-heading text-4xl font-bold leading-tight text-industrial-950 md:text-5xl lg:text-6xl">
            {t('pageTitle')}
          </h1>
          <p className="mt-6 max-w-lg text-lg text-neutral-custom-600">{t('subtitle')}</p>
          <p className="mt-8 flex items-center gap-3 font-mono text-xs text-neutral-custom-400">
            <span className="text-industrial-950">{categoryCount}</span>
            <span aria-hidden="true" className="h-px w-6 bg-neutral-custom-400/40" />
            {t('hero.meta')}
          </p>
        </div>
      </div>
    </section>
  )
}
