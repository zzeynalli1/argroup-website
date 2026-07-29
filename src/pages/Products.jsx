import { Anchor, Fan, Flame, Pipette, Thermometer, Waves } from 'lucide-react'
import { motion } from 'framer-motion'
import PageHeader from '../components/layout/PageHeader'
import { useTranslation } from '../lib/i18n/useTranslation'
import { products } from '../data/products'

const ICONS = { Flame, Pipette, Waves, Thermometer, Fan, Anchor }

function ProductCard({ product, t }) {
  const Icon = ICONS[product.icon] ?? Flame

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 250, damping: 20 }}
      className="rounded-lg border border-neutral-custom-400/20 bg-base-50 p-6 transition-colors hover:border-ember-600"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ember-600/10 text-ember-600">
        <Icon size={22} />
      </div>

      <h3 className="mt-4 font-heading font-semibold text-industrial-950">
        {t(`items.${product.key}.name`)}
      </h3>
      <p className="mt-2 text-sm text-neutral-custom-600">{t(`items.${product.key}.description`)}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {product.brands.map((brand) => (
          <span
            key={brand}
            className="rounded-full bg-neutral-custom-400/15 px-3 py-1 text-xs font-medium text-neutral-custom-600"
          >
            {brand}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

export default function Products() {
  const { t } = useTranslation('products')

  return (
    <>
      <PageHeader title={t('pageTitle')} breadcrumbLabel={t('pageTitle')} subtitle={t('subtitle')} />

      <section className="bg-base-100 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} t={t} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
