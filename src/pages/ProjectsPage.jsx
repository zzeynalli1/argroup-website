import Projects from '../components/sections/Projects'
import PageHeader from '../components/layout/PageHeader'
import { useTranslation } from '../lib/i18n/useTranslation'

export default function ProjectsPage() {
  const { t } = useTranslation('projects')

  return (
    <>
      <PageHeader title={t('pageTitle')} breadcrumbLabel="Layihələr" subtitle={t('subtitle')} />
      <Projects variant="full" />
    </>
  )
}
