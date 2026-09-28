import { Download, FileText } from 'lucide-react'
import { CATALOG_FILE_PATH } from '../../data/catalog'
import { useTranslation } from '../../lib/i18n/useTranslation'

/**
 * Compact catalog download block — bordered/accented panel rather than a
 * detached generic CTA box, using the same ember-outlined icon badge as
 * AboutStats and the same button treatment as CTASection.jsx's ember
 * button. `CATALOG_FILE_PATH` (src/data/catalog.js) points at
 * public/documents/, which has no real PDF yet — the link is real
 * (`<a href download>`, not `href="#"`) and will resolve once the project
 * owner supplies the actual file.
 */
export default function CatalogDownload() {
  const { t } = useTranslation('about')

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
            href={CATALOG_FILE_PATH}
            download
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
