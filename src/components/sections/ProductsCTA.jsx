import { Link } from 'react-router-dom'
import Button from '../ui/Button'
import { useTranslation } from '../../lib/i18n/useTranslation'

export default function ProductsCTA() {
  const { t } = useTranslation('products')

  return (
    <section className="bg-base-50 py-16 md:py-24">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <span aria-hidden="true" className="mx-auto mb-6 block h-1 w-16 bg-ember-600" />
        <h2 className="font-heading text-3xl font-bold text-industrial-950 md:text-4xl">{t('cta.title')}</h2>
        <p className="mt-4 text-neutral-custom-600">{t('cta.subtitle')}</p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link to="/contact">
            <Button variant="ember">{t('cta.contactButton')}</Button>
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center rounded-md border-2 border-industrial-950 px-6 py-3 font-medium text-industrial-950 transition-colors hover:border-ember-600 hover:text-ember-600"
          >
            {t('cta.consultationButton')}
          </Link>
        </div>
      </div>
    </section>
  )
}
