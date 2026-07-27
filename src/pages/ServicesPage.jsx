import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Services from '../components/sections/Services'
import Process from '../components/sections/Process'
import PageHeader from '../components/layout/PageHeader'
import { useTranslation } from '../lib/i18n/useTranslation'

export default function ServicesPage() {
  const { t } = useTranslation('services')
  const location = useLocation()

  // Supports the Home page's "Prosesi kəşf et" link (/services#process).
  useEffect(() => {
    if (location.hash === '#process') {
      document.getElementById('process')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [location])

  return (
    <>
      <PageHeader title={t('pageTitle')} breadcrumbLabel="Xidmətlər" subtitle={t('subtitle')} />
      <Services variant="full" />
      <Process />
    </>
  )
}
