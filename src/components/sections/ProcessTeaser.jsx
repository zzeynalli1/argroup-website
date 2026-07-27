import { Link } from 'react-router-dom'
import Button from '../ui/Button'
import { useTranslation } from '../../lib/i18n/useTranslation'

/**
 * Short Home-page teaser for the full "How Firestop Protects" process,
 * which now lives on /services (see ServicesPage.jsx). Kept as a light
 * section rather than dark — Hero/CTASection/Footer already anchor the page
 * as dark bookends, stacking another dark block here would repeat the
 * "too much black" issue from earlier feedback.
 */
export default function ProcessTeaser() {
  const { t } = useTranslation('home')

  return (
    <section className="bg-base-50 py-16 md:py-20 border-t border-neutral-custom-400/10">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <span className="block w-16 h-1 bg-amber-500 mx-auto mb-6" />
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-industrial-950">
          {t('processTeaser.heading')}
        </h2>
        <p className="mt-4 text-neutral-custom-600">{t('processTeaser.description')}</p>
        <Link to="/services#process" className="inline-block mt-8">
          <Button variant="ember">{t('processTeaser.cta')}</Button>
        </Link>
      </div>
    </section>
  )
}
