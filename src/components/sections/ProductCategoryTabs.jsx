import { products } from '../../data/products'
import { useTranslation } from '../../lib/i18n/useTranslation'

function Tab({ label, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative shrink-0 whitespace-nowrap px-1 py-4 text-sm font-medium transition-colors duration-200 ${
        isActive ? 'text-ember-600' : 'text-neutral-custom-600 hover:text-industrial-950'
      }`}
    >
      {label}
      <span
        className={`pointer-events-none absolute -bottom-px left-0 h-0.5 bg-ember-600 transition-all duration-300 ease-out ${
          isActive ? 'w-full' : 'w-0 group-hover:w-full'
        }`}
      />
    </button>
  )
}

/** The "CATEGORY" layer of the Products page's 3-tier navigation. */
export default function ProductCategoryTabs({ activeCategory, onSelect }) {
  const { t } = useTranslation('products')

  return (
    <div className="sticky top-16 z-30 border-b border-neutral-custom-400/20 bg-concrete-100/95 backdrop-blur-sm md:top-20">
      <div className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-6">
        <span className="shrink-0 font-mono text-xs uppercase tracking-[0.2em] text-neutral-custom-400">
          {t('categoryFilter.label')}
        </span>
        <div className="no-scrollbar flex items-center gap-8">
          <Tab label={t('tabs.all')} isActive={activeCategory === null} onClick={() => onSelect(null)} />
          {products.map((product) => (
            <Tab
              key={product.key}
              label={t(`items.${product.key}.name`)}
              isActive={activeCategory === product.key}
              onClick={() => onSelect(product.key)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
