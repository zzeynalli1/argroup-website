import { useBrands } from '../../hooks/useBrands'
import { useTranslation } from '../../lib/i18n/useTranslation'
import { isHttpUrl } from '../../lib/cms/urlValidation'

function BrandCell({ name, logoSrc, url, logoScale = 1 }) {
  const cell = (
    <div className="flex aspect-[2/1] items-center justify-center overflow-hidden border-2 border-transparent p-3 transition-all duration-200 hover:scale-[1.03] hover:border-ember-600">
      <img
        src={logoSrc}
        alt={name}
        className="h-full w-full object-contain"
        style={{ transform: `scale(${logoScale})` }}
        loading="lazy"
      />
    </div>
  )

  // brand-10 (AMC Mecanocaucho) has no confirmed official site — stays a
  // plain, non-interactive cell rather than a dead/placeholder link.
  // Also fails safe for any stored value that isn't a real http(s) URL
  // (defense in depth — admin-form validation already rejects these).
  if (!url || !isHttpUrl(url)) return cell

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`${name} official website`} className="block">
      {cell}
    </a>
  )
}

export default function BrandsSection() {
  const { t } = useTranslation('home')
  const { brands, loading } = useBrands()

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

        {loading ? (
          <div className="mt-12 flex min-h-[200px] items-center justify-center">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-industrial-950/15 border-t-ember-600" />
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-2 divide-x divide-y divide-neutral-custom-400/20 border border-neutral-custom-400/20 sm:grid-cols-3 md:grid-cols-4">
            {brands.map((brand) => (
              <BrandCell key={brand.id ?? brand.logoSrc} {...brand} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
