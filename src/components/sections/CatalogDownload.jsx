import { Download, FileText } from 'lucide-react'
import { useCatalog } from '../../hooks/useCatalog'
import { useTranslation } from '../../lib/i18n/useTranslation'

/**
 * Compact catalog download block — bordered/accented panel rather than a
 * detached generic CTA box, using the same ember-outlined icon badge as
 * AboutStats and the same button treatment as CTASection.jsx's ember
 * button. The PDF itself is CMS-managed (Admin → Məhsullar → Kataloq, see
 * lib/cms/catalog.js) rather than a static file in public/ — `useCatalog`
 * resolves the current catalog's public Storage URL, always the latest one
 * the admin uploaded, no frontend code change needed on replace. Renders
 * nothing at all (no broken link, no disabled button) until a catalog has
 * actually been uploaded.
 */
export default function CatalogDownload() {
  const { t } = useTranslation('about')
  const { catalog, loading } = useCatalog()

  if (loading || !catalog) return null

  return (
    <section className="bg-base-50 py-14 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-start gap-6 border border-industrial-950/10 bg-concrete-100 p-8 sm:flex-row sm:items-center sm:justify-between md:p-10">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-ember-600 text-ember-600">
              <FileText size={20} strokeWidth={1.5} />
            </span>
            <div>
              <h2 className="font-heading text-2xl font-bold text-industrial-950 md:text-3xl">
                {t('catalog.title')}
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-custom-600">{t('catalog.subtitle')}</p>
            </div>
          </div>

          <a
            href={catalog.file_url}
            download={catalog.file_name}
            className="inline-flex shrink-0 items-center gap-2 rounded-md bg-ember-600 px-6 py-3 text-sm font-semibold text-base-50 transition-colors hover:bg-ember-800"
          >
            <Download size={16} strokeWidth={2} />
            {t('catalog.downloadCta')}
          </a>
        </div>
      </div>
    </section>
  )
}
