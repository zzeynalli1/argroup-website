import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { Anchor, ArrowUpRight, Cable, Factory, Flame, HardHat, PenTool, Ruler, ShieldCheck } from 'lucide-react'
import gsap from 'gsap'
import { useTranslation } from '../../lib/i18n/useTranslation'
import { services } from '../../data/servicesDetail'
import ServiceIllustration from '../ui/ServiceIllustration'

const ICONS = { ShieldCheck, Flame, Cable, Ruler, HardHat, Factory, Anchor, PenTool }

function ServiceCard({ service, t }) {
  const Icon = ICONS[service.icon]
  const arrowRef = useRef(null)
  const illustrationRef = useRef(null)

  function handleEnter() {
    gsap.to(arrowRef.current, { x: 3, y: -3, duration: 0.3, ease: 'power2.out' })
    gsap.to(illustrationRef.current, { scale: 1.06, duration: 0.4, ease: 'power2.out' })
  }

  function handleLeave() {
    gsap.to(arrowRef.current, { x: 0, y: 0, duration: 0.3, ease: 'power2.out' })
    gsap.to(illustrationRef.current, { scale: 1, duration: 0.3, ease: 'power2.out' })
  }

  return (
    <Link
      to="/contact"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className="group flex flex-col overflow-hidden rounded-xl border-2 border-transparent bg-base-50 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-ember-600 hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-base-100">
        <span aria-hidden="true" className="absolute left-3 top-3 h-3 w-3 border-l border-t border-neutral-custom-400/30" />
        <span aria-hidden="true" className="absolute bottom-3 right-3 h-3 w-3 border-b border-r border-neutral-custom-400/30" />
        <div ref={illustrationRef} className="flex h-full w-full items-center justify-center p-8">
          <ServiceIllustration variant={service.key} className="h-full w-full" />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-base-100 text-ember-600">
          <Icon size={18} />
        </span>
        <h3 className="mt-4 font-heading text-lg font-semibold text-industrial-950">
          {t(`grid.items.${service.key}.title`)}
        </h3>
        <p className="mt-2 flex-1 text-sm text-neutral-custom-600">{t(`grid.items.${service.key}.description`)}</p>

        <span
          ref={arrowRef}
          aria-hidden="true"
          className="mt-5 flex h-9 w-9 items-center justify-center self-start rounded-full border border-neutral-custom-400/30 text-industrial-950 transition-colors duration-300 group-hover:border-ember-600 group-hover:text-ember-600"
        >
          <ArrowUpRight size={16} />
        </span>
      </div>
    </Link>
  )
}

export default function ServicesGrid() {
  const { t } = useTranslation('services')

  return (
    <section id="process" className="bg-base-100 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="font-heading text-3xl font-bold text-industrial-950 md:text-4xl">{t('grid.title')}</h2>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <ServiceCard key={service.key} service={service} t={t} />
          ))}
        </div>
      </div>
    </section>
  )
}
