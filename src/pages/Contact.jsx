import Section from '../components/ui/Section'
import ContactInfo from '../components/sections/ContactInfo'
import ContactForm from '../components/sections/ContactForm'
import ContactMap from '../components/sections/ContactMap'
import PageHeader from '../components/layout/PageHeader'
import { useTranslation } from '../lib/i18n/useTranslation'

export default function Contact() {
  const { t } = useTranslation('contact')

  return (
    <>
      <PageHeader title={t('pageTitle')} breadcrumbLabel="Əlaqə" subtitle={t('subtitle')} />
      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <ContactInfo />
          <ContactForm />
        </div>
      </Section>
      <ContactMap />
    </>
  )
}
