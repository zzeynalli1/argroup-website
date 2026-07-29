import { Anchor, Factory, HardHat, PenTool, Ruler } from 'lucide-react'
import { useTranslation } from '../../lib/i18n/useTranslation'
import { otherServices } from '../../data/servicesDetail'

const ICONS = { Ruler, HardHat, Factory, Anchor, PenTool }

function ServiceCard({ service, t }) {
  const Icon = ICONS[service.icon]

  return (
    <div className="rounded-lg border border-neutral-custom-400/20 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-ember-600">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-custom-400/40 text-neutral-custom-600">
        <Icon size={20} />
      </span>
      <h3 className="mt-4 font-heading font-semibold text-industrial-950">
        {t(`otherServices.items.${service.key}.title`)}
      </h3>
      <p className="mt-2 text-sm text-neutral-custom-600">{t(`otherServices.items.${service.key}.description`)}</p>
    </div>
  )
}

export default function OtherServices() {
  const { t } = useTranslation('services')

  return (
    <section id="other-services" className="bg-base-50 py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-center font-heading text-3xl font-bold text-industrial-950 md:text-4xl">
          {t('otherServices.title')}
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {otherServices.map((service) => (
            <ServiceCard key={service.key} service={service} t={t} />
          ))}
        </div>
      </div>
    </section>
  )
}
