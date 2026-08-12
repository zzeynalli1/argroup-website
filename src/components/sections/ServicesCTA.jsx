import { Link } from 'react-router-dom'
import Button from '../ui/Button'
import { useTranslation } from '../../lib/i18n/useTranslation'

export default function ServicesCTA() {
  const { t } = useTranslation('services')

  return (
    <section className="bg-base-50 py-16 md:py-24">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <span aria-hidden="true" className="mx-auto mb-6 block h-1 w-16 bg-ember-600" />
        <h2 className="font-heading text-3xl font-bold text-industrial-950 md:text-4xl">{t('cta.title')}</h2>
        <p className="mt-4 text-neutral-custom-600">{t('cta.subtitle')}</p>
        <Link to="/contact" className="mt-8 inline-block">
          <Button variant="ember">{t('cta.button')}</Button>
        </Link>
      </div>
    </section>
  )
}
