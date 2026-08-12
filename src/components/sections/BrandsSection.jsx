import { brands } from '../../data/brands'
import { useTranslation } from '../../lib/i18n/useTranslation'

function BrandCell({ logoSrc }) {
  return (
    <div className="flex aspect-[2/1] items-center justify-center border-2 border-transparent p-3 transition-all duration-200 hover:scale-[1.03] hover:border-ember-600">
      <img src={logoSrc} alt="Logo" className="h-full w-full object-contain" loading="lazy" />
    </div>
  )
}

export default function BrandsSection() {
  const { t } = useTranslation('home')

  return (
    <section className="bg-base-50 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-3 block font-heading text-xs font-semibold uppercase tracking-[0.2em] text-ember-600">
            {t('brands.label')}
          </span>
          <h2 className="font-heading text-3xl font-bold text-industrial-950 md:text-4xl">{t('brands.title')}</h2>
          <p className="mt-4 text-neutral-custom-600">{t('brands.subtitle')}</p>
        </div>

        <div className="mt-12 grid grid-cols-2 divide-x divide-y divide-neutral-custom-400/20 border border-neutral-custom-400/20 sm:grid-cols-3 md:grid-cols-4">
          {brands.map((logoSrc) => (
            <BrandCell key={logoSrc} logoSrc={logoSrc} />
          ))}
        </div>
      </div>
    </section>
  )
}
