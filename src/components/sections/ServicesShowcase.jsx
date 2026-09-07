import { Link } from 'react-router-dom'
import { Activity, ArrowRight, ArrowUpRight, Cable, Drill, Droplets, Flame, Ruler, Scale, ShieldCheck, Volume2, Waves, Wrench } from 'lucide-react'
import { useTranslation } from '../../lib/i18n/useTranslation'
import { getCategoryByKey, services } from '../../data/servicesDetail'
import ServiceIllustration from '../ui/ServiceIllustration'
import ImagePlaceholder from '../ui/ImagePlaceholder'
import TechnicalLines from '../ui/TechnicalLines'
import Reveal from '../ui/Reveal'

const ICONS = { ShieldCheck, Flame, Cable, Ruler, Activity, Drill, Volume2, Scale, Wrench, Waves, Droplets }

/**
 * Editorial engineering showcase for the Services page — six categories,
 * six distinct compositions (see CLAUDE.md-adjacent brief: no repeated card
 * grid). Replaces the old uniform-card ServicesGrid. All copy is
 * data/translation-driven (servicesDetail.js + locales/<locale>/
 * services.json) — this file only adds layout, imagery placeholders, and
 * interaction.
 */

// ---- 01 — Passive Fire Protection (dark) ----------------------------------

function FirestopRow({ service, t }) {
  const Icon = ICONS[service.icon]
  return (
    <Link
      to={`/services/${service.slug}`}
      className="group flex items-center gap-4 border-t border-white/10 py-5 first:border-t-0 transition-colors hover:bg-white/[0.03] md:border-t-0 md:px-6 md:py-8 md:first:pl-0 md:last:pr-0"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 text-ember-600 transition-colors duration-300 group-hover:border-ember-600">
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-heading text-base font-semibold text-base-50 md:text-lg">
          {t(`subServices.${service.key}.title`)}
        </span>
        <span className="mt-0.5 block text-sm text-neutral-custom-400">{t(`subServices.${service.key}.description`)}</span>
      </span>
      <ArrowUpRight
        size={18}
        className="shrink-0 text-neutral-custom-400 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ember-600 motion-reduce:transition-none"
      />
    </Link>
  )
}

function SectionFirestop({ t }) {
  const category = getCategoryByKey('passiveFireProtection')

  return (
    <section className="relative overflow-hidden bg-industrial-900 py-16 md:py-24">
      <TechnicalLines className="text-base-50" opacity="opacity-[0.04]" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16 lg:items-center">
          <Reveal>
            <span className="font-mono text-sm text-ember-600">{category.number}</span>
            <h2 className="mt-2 font-heading text-2xl font-bold text-base-50 md:text-3xl">
              {t(`categories.${category.key}.title`)}
            </h2>
            <p className="mt-4 max-w-md text-neutral-custom-400">{t(`categories.${category.key}.intro`)}</p>
          </Reveal>

          <Reveal delay={0.1}>
            {/* Future 3D scene: Firestop Assembly */}
            <ImagePlaceholder
              label="Concrete wall with pipe penetration, cable penetration and duct penetration"
              aspect="aspect-[4/3]"
              tone="dark"
              future3d
            />
          </Reveal>
        </div>

        <Reveal
          delay={0.15}
          as="div"
          className="mt-12 grid grid-cols-1 border-t border-white/10 md:mt-16 md:grid-cols-3 md:divide-x md:divide-white/10 md:border-t-0"
        >
          {category.subServices.map((service) => (
            <FirestopRow key={service.key} service={service} t={t} />
          ))}
        </Reveal>
      </div>
    </section>
  )
}

// ---- 02 — Testing & Measurement (light) ------------------------------------

function TestModule({ service, t }) {
  const Icon = ICONS[service.icon]
  return (
    <Link to={`/services/${service.slug}`} className="group block border-t border-industrial-950/10 py-6 first:border-t-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Icon size={18} className="text-ember-600" />
          <h3 className="font-heading text-lg font-semibold text-industrial-950">{t(`subServices.${service.key}.title`)}</h3>
        </div>
        <ArrowUpRight
          size={18}
          className="shrink-0 text-neutral-custom-600 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ember-600 motion-reduce:transition-none"
        />
      </div>
      <p className="mt-2 max-w-md text-sm text-neutral-custom-600">{t(`subServices.${service.key}.description`)}</p>
    </Link>
  )
}

function SectionTesting({ t }) {
  const category = getCategoryByKey('testing')

  return (
    <section className="bg-concrete-100 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
          <Reveal>
            <span className="font-mono text-sm text-ember-600">{category.number}</span>
            <h2 className="mt-2 font-heading text-2xl font-bold text-industrial-950 md:text-3xl">
              {t(`categories.${category.key}.title`)}
            </h2>
            <p className="mt-4 max-w-md text-neutral-custom-600">{t(`categories.${category.key}.intro`)}</p>

            <div className="mt-8">
              {category.subServices.map((service) => (
                <TestModule key={service.key} service={service} t={t} />
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <ImagePlaceholder
              label="Professional testing / measurement equipment"
              aspect="aspect-[4/3]"
              tone="light"
              zoomOnHover
              className="group lg:sticky lg:top-28"
            />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// ---- 03 — Construction & Technical Solutions (dark, mosaic) ---------------

const CONSTRUCTION_MOSAIC = {
  concreteCutting: { label: 'Concrete core drilling', area: 'a' },
  acousticInsulation: { label: 'Acoustic insulation detail', area: 'b' },
  loadAnalysis: { label: 'Structural load analysis', area: 'c' },
  supportDesign: { label: 'MEP support system', area: 'd' },
  vibrationSolutions: { label: 'Vibration isolation', area: 'e' },
  waterproofInjection: { label: 'Waterproof injection', area: 'f' },
}

function MosaicCard({ service, meta, t, className = '', style }) {
  const Icon = ICONS[service.icon]
  return (
    <Link to={`/services/${service.slug}`} style={style} className={`group relative block overflow-hidden ${className}`}>
      <ImagePlaceholder label={meta.label} aspect="" tone="dark" zoomOnHover className="h-full w-full" />
      <div className="absolute inset-x-0 bottom-0 flex items-start gap-2 bg-gradient-to-t from-industrial-950/95 to-transparent p-3 pt-8">
        <Icon size={14} className="mt-0.5 shrink-0 text-ember-600" />
        <span className="text-xs font-semibold leading-snug text-base-50">{t(`subServices.${service.key}.title`)}</span>
      </div>
    </Link>
  )
}

function SectionConstruction({ t }) {
  const category = getCategoryByKey('construction')
  const items = category.subServices
    .map((service) => ({ service, meta: CONSTRUCTION_MOSAIC[service.key] }))
    .filter((item) => item.meta)

  return (
    <section className="relative overflow-hidden bg-industrial-800 py-16 md:py-24">
      <TechnicalLines className="text-base-50" opacity="opacity-[0.04]" angle={-22} />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <Reveal>
            <span className="font-mono text-sm text-ember-600">{category.number}</span>
            <h2 className="mt-2 font-heading text-2xl font-bold text-base-50 md:text-3xl">
              {t(`categories.${category.key}.title`)}
            </h2>
            <p className="mt-4 max-w-md text-neutral-custom-400">{t(`categories.${category.key}.intro`)}</p>
          </Reveal>

          <Reveal delay={0.1}>
            {/* Desktop/tablet: editorial mosaic with varied image proportions */}
            <div
              className="hidden gap-3 lg:grid lg:h-[520px]"
              style={{
                gridTemplateAreas: '"a b c" "a d e" "f f f"',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gridTemplateRows: '1fr 1fr 0.6fr',
              }}
            >
              {items.map(({ service, meta }) => (
                <MosaicCard key={service.key} service={service} meta={meta} t={t} style={{ gridArea: meta.area }} />
              ))}
            </div>

            {/* Mobile/tablet: horizontal scroll gallery instead of a stacked grid */}
            <div className="-mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2 lg:hidden">
              {items.map(({ service, meta }) => (
                <MosaicCard
                  key={service.key}
                  service={service}
                  meta={meta}
                  t={t}
                  className="aspect-[4/3] w-[72%] shrink-0 snap-start"
                />
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// ---- 04 — Industrial Solutions (light, panoramic) --------------------------

function SectionIndustrial({ t }) {
  const category = getCategoryByKey('industrial')

  return (
    <section className="relative overflow-hidden bg-base-100 py-16 md:py-24">
      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-sm text-ember-600">{category.number}</span>
            <h2 className="font-heading text-2xl font-bold text-industrial-950 md:text-3xl">
              {t(`categories.${category.key}.title`)}
            </h2>
          </div>
          <p className="max-w-md text-neutral-custom-600 md:text-right">{t(`categories.${category.key}.intro`)}</p>
        </Reveal>

        <Reveal delay={0.1} className="relative mt-10">
          <ServiceIllustration
            variant="industrial"
            className="pointer-events-none absolute -right-6 -top-10 hidden h-28 w-28 text-neutral-custom-400/40 lg:block"
          />
          <ImagePlaceholder
            label="Industrial engineering facility / plant"
            aspect="aspect-[21/9]"
            tone="light"
            zoomOnHover
            className="group"
          />
        </Reveal>

        <Reveal delay={0.15} className="mt-8 flex flex-col items-end gap-2 text-right">
          <p className="text-sm text-neutral-custom-600">{t('categoryShell.ctaText')}</p>
          <Link
            to="/contact"
            className="group inline-flex items-center gap-2 font-heading font-semibold text-industrial-950 transition-colors hover:text-ember-600"
          >
            {t('categoryShell.ctaButton')}
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none" />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

// ---- 05 — Marine Solutions (dark, cinematic) -------------------------------

function HotspotMarker({ style }) {
  return (
    <span aria-hidden="true" className="absolute flex h-3 w-3" style={style}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember-600/60 motion-reduce:animate-none" />
      <span className="relative inline-flex h-3 w-3 rounded-full border border-ember-600 bg-ember-600/80" />
    </span>
  )
}

function SectionMarine({ t }) {
  const category = getCategoryByKey('marine')

  return (
    <section className="relative overflow-hidden bg-industrial-900 py-16 md:py-24">
      <TechnicalLines className="text-base-50" opacity="opacity-[0.04]" />
      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-sm text-ember-600">{category.number}</span>
            <h2 className="font-heading text-2xl font-bold text-base-50 md:text-3xl">{t(`categories.${category.key}.title`)}</h2>
          </div>
          <p className="max-w-md text-neutral-custom-400 md:text-right">{t(`categories.${category.key}.intro`)}</p>
        </Reveal>

        <Reveal delay={0.1} className="relative mt-10">
          <ServiceIllustration
            variant="marine"
            className="pointer-events-none absolute -left-6 -bottom-10 hidden h-28 w-28 text-white/10 lg:block"
          />
          <ImagePlaceholder
            label="Marine / ship engineering environment"
            aspect="aspect-[21/9]"
            tone="dark"
            zoomOnHover
            className="group"
          />
          <HotspotMarker style={{ top: '28%', left: '22%' }} />
          <HotspotMarker style={{ top: '58%', left: '68%' }} />
        </Reveal>

        <Reveal delay={0.15} className="mt-8 flex flex-col items-end gap-2 text-right">
          <p className="text-sm text-neutral-custom-400">{t('categoryShell.ctaText')}</p>
          <Link
            to="/contact"
            className="group inline-flex items-center gap-2 font-heading font-semibold text-base-50 transition-colors hover:text-ember-600"
          >
            {t('categoryShell.ctaButton')}
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none" />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

// ---- 06 — Design Engineering (light, drawing-to-build transition) ---------

function SectionDesignEngineering({ t }) {
  const category = getCategoryByKey('designEngineering')
  const related = (category.relatedKeys ?? [])
    .map((key) => services.find((service) => service.key === key))
    .filter(Boolean)

  return (
    <section className="relative overflow-hidden bg-base-50 py-16 md:py-24">
      <TechnicalLines className="text-industrial-950" opacity="opacity-[0.04]" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <Reveal>
            <span className="font-mono text-sm text-ember-600">{category.number}</span>
            <h2 className="mt-2 font-heading text-2xl font-bold text-industrial-950 md:text-3xl">
              {t(`categories.${category.key}.title`)}
            </h2>
            <p className="mt-4 max-w-md text-neutral-custom-600">{t(`categories.${category.key}.intro`)}</p>

            {related.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-industrial-950/10 pt-6">
                <span className="font-mono text-xs uppercase tracking-[0.15em] text-neutral-custom-400">
                  {t('categoryShell.relatedLabel')}
                </span>
                {related.map((service) => (
                  <Link
                    key={service.key}
                    to={`/services/${service.slug}`}
                    className="group inline-flex items-center gap-1 text-sm font-semibold text-industrial-950 transition-colors hover:text-ember-600"
                  >
                    {t(`subServices.${service.key}.title`)}
                    <ArrowUpRight
                      size={14}
                      className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                    />
                  </Link>
                ))}
              </div>
            )}
          </Reveal>

          <Reveal delay={0.1} className="relative">
            <ServiceIllustration
              variant="designEngineering"
              className="pointer-events-none absolute -right-6 -top-10 hidden h-24 w-24 text-neutral-custom-400/40 lg:block"
            />
            {/* Future 3D scene: Engineering BIM Model */}
            <ImagePlaceholder
              label="BIM / engineering model positioned over technical drawings"
              aspect="aspect-[4/3]"
              tone="light"
              future3d
            />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export default function ServicesShowcase() {
  const { t } = useTranslation('services')

  return (
    <>
      <div className="bg-base-50 pb-10">
        <div className="mx-auto max-w-7xl px-6">
          <span className="block font-mono text-xs uppercase tracking-[0.2em] text-neutral-custom-400">{t('grid.title')}</span>
        </div>
      </div>

      <SectionFirestop t={t} />
      <SectionTesting t={t} />
      <SectionConstruction t={t} />
      <SectionIndustrial t={t} />
      <SectionMarine t={t} />
      <SectionDesignEngineering t={t} />
    </>
  )
}
