import Section from '../components/ui/Section'
import Values from '../components/sections/Values'
import StatsPlaceholder from '../components/sections/StatsPlaceholder'
import TeamTree from '../components/sections/TeamTree'
import PageHeader from '../components/layout/PageHeader'
import { useTranslation } from '../lib/i18n/useTranslation'

export default function About() {
  const { t } = useTranslation('about')

  return (
    <>
      <PageHeader title={t('pageTitle')} breadcrumbLabel="Haqqımızda" subtitle={t('subtitle')} />
      <Section id="about-intro">
        <p className="text-neutral-custom-600 max-w-3xl">{t('intro')}</p>
      </Section>
      <Values />
      <StatsPlaceholder />
      <TeamTree />
    </>
  )
}
