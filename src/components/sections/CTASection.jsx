import { Link } from 'react-router-dom'
import Button from '../ui/Button'
import { useTranslation } from '../../lib/i18n/useTranslation'

export default function CTASection() {
  const { t } = useTranslation('home')

  return (
    <section className="bg-industrial-800 py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <span className="block w-16 h-1 bg-amber-500 mx-auto mb-6" />
        <h2 className="text-3xl md:text-5xl font-bold text-base-50">{t('cta.title')}</h2>
        <Link to="/contact" className="inline-block mt-8">
          <Button variant="ember">{t('cta.button')}</Button>
        </Link>
      </div>
    </section>
  )
}
