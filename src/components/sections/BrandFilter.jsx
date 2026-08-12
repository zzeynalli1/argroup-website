import { products } from '../../data/products'
import { useTranslation } from '../../lib/i18n/useTranslation'

// Real per-product brand/line names already captured in products.js (e.g.
// Fire Stop, Hensotherm, Pam Global) — deduplicated across all 6
// categories, not the separate 12-name "Brand Partners" list used by the
// hero composition, since those are the names actually verified per product.
const BRANDS = [...new Set(products.flatMap((product) => product.brands))]

function BrandChip({ label, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap border px-3.5 py-1.5 text-xs font-medium uppercase tracking-wide transition-colors ${
        isActive
          ? 'border-ember-600 bg-ember-600 text-base-50'
          : 'border-neutral-custom-400/30 text-neutral-custom-600 hover:border-industrial-950 hover:text-industrial-950'
      }`}
    >
      {label}
    </button>
  )
}

/** The "BRAND" layer of the Products page's 3-tier navigation. */
export default function BrandFilter({ activeBrand, onSelect }) {
  const { t } = useTranslation('products')

  return (
    <div className="border-b border-neutral-custom-400/20 bg-concrete-100 pb-10 pt-6">
      <div className="mx-auto max-w-7xl px-6">
        <span className="mb-3 block font-mono text-xs uppercase tracking-[0.2em] text-neutral-custom-400">
          {t('brandFilter.label')}
        </span>
        <div className="flex flex-wrap gap-2">
          <BrandChip label={t('tabs.all')} isActive={activeBrand === null} onClick={() => onSelect(null)} />
          {BRANDS.map((brand) => (
            <BrandChip
              key={brand}
              label={brand}
              isActive={activeBrand === brand}
              onClick={() => onSelect(activeBrand === brand ? null : brand)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
