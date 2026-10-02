import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  Anchor,
  ArrowRight,
  ArrowUpRight,
  Cable,
  Drill,
  Droplets,
  DoorOpen,
  Flame,
  Link2,
  Move,
  Ruler,
  Scale,
  ShieldCheck,
  Volume2,
  Waves,
  Wrench,
  X,
} from 'lucide-react'
import { useTranslation } from '../../lib/i18n/useTranslation'
import { getCategoryByKey } from '../../data/servicesDetail'
import ServiceIllustration from '../ui/ServiceIllustration'
import ImagePlaceholder from '../ui/ImagePlaceholder'
import ProcessStageShowcase from '../ui/ProcessStageShowcase'
import TechnicalLines from '../ui/TechnicalLines'
import Reveal from '../ui/Reveal'

const ICONS = { ShieldCheck, Flame, Cable, Ruler, Activity, Drill, Volume2, Scale, Wrench, Waves, Droplets }
const BENEFIT_ICONS = [DoorOpen, Flame, ShieldCheck]
// Per-service override for the same generic BENEFIT_ICONS rotation above —
// only seismic's 3 benefits (stability/connection/controlled movement) get
// topic-matched icons; every other service keeps the existing DoorOpen/
// Flame/ShieldCheck default untouched.
const SERVICE_BENEFIT_ICONS = { seismic: [Anchor, Link2, Move] }

// Real content only: `t()` returns the raw dotted key string itself when a
// key is missing from both the current locale and the az fallback (see
// useTranslation.js's `fallback ?? key`) — used here to detect "this
// service has no shortIntro/benefits yet" instead of rendering a literal
// key path or inventing copy for services the knowledge base doesn't cover.
function translatedOrNull(t, key) {
  const value = t(key)
  return value === key ? null : value
}

/**
 * Compact in-page detail reveal for a selected sub-service — replaces
 * forcing the user through the full /services/:slug article page during
 * normal browsing. The routed page itself still exists unchanged for direct
 * links (see the "view full page" link below); this only changes how a
 * sub-service is first explored from the Services page.
 *
 * Process image is deliberately the dominant element, placed above the
 * explanatory copy. Every service gets the same treatment now that every
 * sub-service has translated `shortIntro` copy; `benefits` only renders when
 * a service actually has translated benefit copy (pull-out test and vibration
 * test intentionally have none — see locales/<locale>/services.json) rather
 * than inventing a 3-item layout for every service.
 */
function ServiceExplorerPanel({ service, t, onClose, panelRef }) {
  const stages = translatedOrNull(t, `detail.${service.key}.process`) ?? t('process.genericStages')
  const shortIntro = translatedOrNull(t, `detail.${service.key}.shortIntro`)
  const lead = shortIntro ?? t(`detail.${service.key}.lead`)
  const benefits = t(`detail.${service.key}.benefits`)
  const hasBenefits = Array.isArray(benefits)
  const processImage = service.processImage

  return (
    <div ref={panelRef} className="scroll-mt-28 border-t-2 border-ember-600 bg-industrial-950 p-6 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="h-7 w-1 shrink-0 bg-ember-600" />
          <h3 className="font-heading text-2xl font-bold leading-tight text-base-50 md:text-3xl">
            {t(`subServices.${service.key}.title`)}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('explorer.close')}
          className="shrink-0 rounded-full border border-white/15 p-1.5 text-neutral-custom-400 transition-colors hover:border-ember-600 hover:text-ember-600"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-5">
        <ProcessStageShowcase
          image={service.imageSlots.workProcess}
          src={processImage?.src}
          aspect={processImage?.aspect}
          markers={processImage?.markers}
          stages={stages}
          tone="dark"
        />
      </div>

      <p className="mt-7 w-full text-base leading-[1.75] text-neutral-custom-300 md:w-[78%] md:text-lg">{lead}</p>

      {hasBenefits && (
        <div className="mt-8 grid grid-cols-1 gap-y-8 border-t border-white/10 pt-7 sm:grid-cols-3 sm:divide-x sm:divide-white/10">
          {benefits.map((benefit, index) => {
            const icons = SERVICE_BENEFIT_ICONS[service.key] ?? BENEFIT_ICONS
            const Icon = icons[index % icons.length]
            return (
              <div key={benefit.title} className="sm:px-7 sm:first:pl-0 sm:last:pr-0">
                <Icon size={20} className="text-ember-600" />
                <h4 className="mt-2.5 font-heading text-base font-semibold text-base-50">{benefit.title}</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-custom-400">{benefit.description}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * Editorial engineering showcase for the Services page — six categories,
 * six distinct compositions (see CLAUDE.md-adjacent brief: no repeated card
 * grid). Replaces the old uniform-card ServicesGrid. All copy is
 * data/translation-driven (servicesDetail.js + locales/<locale>/
 * services.json) — this file only adds layout, imagery placeholders, and
 * interaction.
 */

// ---- 01 — Passive Fire Protection (dark) ----------------------------------

function FirestopRow({ service, t, isActive, onSelect }) {
  const Icon = ICONS[service.icon]
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={() => onSelect(service.key)}
      className={`group flex w-full items-center gap-4 border-t border-white/10 py-5 text-left transition-colors first:border-t-0 hover:bg-white/[0.03] md:border-t-0 md:px-6 md:py-8 md:first:pl-0 md:last:pr-0 ${
        isActive ? 'bg-white/[0.04]' : ''
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-ember-600 transition-colors duration-300 ${
          isActive ? 'border-ember-600' : 'border-white/15 group-hover:border-ember-600'
        }`}
      >
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
        className={`shrink-0 text-neutral-custom-400 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ember-600 motion-reduce:transition-none ${
          isActive ? '-translate-y-0.5 translate-x-0.5 text-ember-600' : ''
        }`}
      />
    </button>
  )
}

function SectionFirestop({ t, activeKey, onSelect, onClose, panelRef }) {
  const category = getCategoryByKey('passiveFireProtection')
  const activeService = category.subServices.find((service) => service.key === activeKey)

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
            <p className="mt-4 max-w-md text-lg text-neutral-custom-400">{t(`categories.${category.key}.intro`)}</p>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative w-full overflow-hidden border border-current/10 aspect-[4/3] bg-industrial-800">
              <img
                src="/images/services/category-visuals/passive-fire-overview.webp"
                alt="Fire-rated wall assembly with pipe, cable and duct penetrations"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover object-[60%_50%]"
              />
            </div>
          </Reveal>
        </div>

        <Reveal
          delay={0.15}
          as="div"
          className="mt-12 grid grid-cols-1 border-t border-white/10 md:mt-16 md:grid-cols-3 md:divide-x md:divide-white/10 md:border-t-0"
        >
          {category.subServices.map((service) => (
            <FirestopRow key={service.key} service={service} t={t} isActive={activeKey === service.key} onSelect={onSelect} />
          ))}
        </Reveal>

        {activeService && (
          <div className="mt-3">
            <ServiceExplorerPanel service={activeService} t={t} onClose={onClose} panelRef={panelRef} />
          </div>
        )}
      </div>
    </section>
  )
}

// ---- 02 — Testing & Measurement (light) ------------------------------------

function TestModule({ service, t, isActive, onSelect }) {
  const Icon = ICONS[service.icon]
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={() => onSelect(service.key)}
      className={`group block w-full border-t border-industrial-950/10 py-6 text-left first:border-t-0 ${isActive ? 'bg-industrial-950/[0.03]' : ''}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Icon size={18} className="text-ember-600" />
          <h3 className="font-heading text-lg font-semibold text-industrial-950">{t(`subServices.${service.key}.title`)}</h3>
        </div>
        <ArrowUpRight
          size={18}
          className={`shrink-0 text-neutral-custom-600 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ember-600 motion-reduce:transition-none ${
            isActive ? '-translate-y-0.5 translate-x-0.5 text-ember-600' : ''
          }`}
        />
      </div>
      <p className="mt-2 max-w-md text-sm text-neutral-custom-600">{t(`subServices.${service.key}.description`)}</p>
    </button>
  )
}

function SectionTesting({ t, activeKey, onSelect, onClose, panelRef }) {
  const category = getCategoryByKey('testing')
  const activeService = category.subServices.find((service) => service.key === activeKey)

  return (
    <section className="bg-concrete-100 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
          <Reveal>
            <span className="font-mono text-sm text-ember-600">{category.number}</span>
            <h2 className="mt-2 font-heading text-2xl font-bold text-industrial-950 md:text-3xl">
              {t(`categories.${category.key}.title`)}
            </h2>
            <p className="mt-4 max-w-md text-lg text-neutral-custom-600">{t(`categories.${category.key}.intro`)}</p>

            <div className="mt-8">
              {category.subServices.map((service) => (
                <TestModule
                  key={service.key}
                  service={service}
                  t={t}
                  isActive={activeKey === service.key}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="group relative w-full overflow-hidden border border-current/10 aspect-[4/3] bg-concrete-200 text-neutral-custom-600 lg:sticky lg:top-28">
              <img
                src="/images/services/category-visuals/testing-measurement-overview.webp"
                alt="Pull-out test equipment set up on a concrete slab on site"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
            </div>
          </Reveal>
        </div>

        {activeService && (
          <div className="mt-10">
            <ServiceExplorerPanel service={activeService} t={t} onClose={onClose} panelRef={panelRef} />
          </div>
        )}
      </div>
    </section>
  )
}

// ---- 03 — Construction & Technical Solutions (dark, mosaic) ---------------

const CONSTRUCTION_MOSAIC = {
  concreteCutting: { area: 'a', image: '/images/services/construction/concrete-drilling-card.webp', alt: 'Concrete core drilling' },
  // Panned up 20% (owner request), then pulled back down 15% (owner
  // request: "15% lower") — net -20% + 15% = -5% upward shift remaining.
  acousticInsulation: {
    area: 'b',
    image: '/images/services/construction/acoustic-insulation-card.webp',
    alt: 'Acoustic insulation detail',
    zoom: true,
    pan: '-translate-y-[5%]',
  },
  // Pan removed (owner request: "10% lower") — was -translate-y-[10%], which
  // shifted the image up 10%; undoing that shift moves it back down to its
  // neutral, un-panned position. Baseline zoom unchanged.
  loadAnalysis: { area: 'c', image: '/images/services/construction/load-analysis-card.webp', alt: 'Structural load analysis', zoom: true },
  // Zoomed out 20% (owner request) from the 1.2 baseline every other zoomed
  // card in this mosaic uses: 1.2 * 0.8 = 0.96, hover kept at the same +5%
  // relative bump the rest of the mosaic uses (0.96 * 1.05 ≈ 1.01). Pan
  // unchanged.
  supportDesign: {
    area: 'd',
    image: '/images/services/construction/support-design-card.webp',
    alt: 'MEP support system',
    scaleClasses: 'scale-[0.96] group-hover:scale-[1.01] motion-reduce:group-hover:scale-[0.96]',
    // Pulled left 8%, then pulled right 10% (owner request) — net -8% + 10%
    // = +2% (right) — alongside the existing 10% upward pan. Tailwind's
    // translate-x/translate-y utilities compose independently.
    pan: 'translate-x-[2%] -translate-y-[10%]',
  },
  // Swapped into seismic's old tall right-side bookend spot (owner request).
  // Card box is pixel-identical to concreteCutting's (measured — both span
  // the full 2-row `f`/`a` grid area). Zoomed in 10% four times over from
  // neutral (owner request): 1.1^4 ≈ 1.46, hover +5% relative
  // (1.46 * 1.05 ≈ 1.53).
  vibrationSolutions: {
    area: 'f',
    image: '/images/services/construction/vibration-solutions-card.webp',
    alt: 'Vibration isolation',
    scaleClasses: 'scale-[1.46] group-hover:scale-[1.53] motion-reduce:group-hover:scale-[1.46]',
  },
  // Swapped into vibrationSolutions' old bottom-middle spot (owner request).
  // Zoomed in 15% three times, then 10% more, from neutral (owner request):
  // 1.15 * 1.15 * 1.15 * 1.1 ≈ 1.67, hover +5% relative (1.67 * 1.05 ≈ 1.75).
  seismic: {
    area: 'e',
    image: '/images/services/construction/seismic-system-card.webp',
    alt: 'Seismic cable restraint system',
    scaleClasses: 'scale-[1.67] group-hover:scale-[1.75] motion-reduce:group-hover:scale-[1.67]',
  },
}

function MosaicCard({ service, meta, t, isActive, onSelect, className = '', style }) {
  const Icon = ICONS[service.icon]
  // 20% baseline zoom on all cards except concreteCutting (see CONSTRUCTION_MOSAIC),
  // with the existing hover growth layered on top instead of replacing it.
  // `meta.scaleClasses` is an explicit override for cards whose baseline
  // scale isn't the shared 1/1.2 pair (see supportDesign/vibrationSolutions/
  // seismic above) — falls back to the original boolean-driven pair otherwise.
  const scaleClasses =
    meta.scaleClasses ??
    (meta.zoom
      ? 'scale-[1.2] group-hover:scale-[1.26] motion-reduce:group-hover:scale-[1.2]'
      : 'group-hover:scale-105 motion-reduce:group-hover:scale-100')
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={() => onSelect(service.key)}
      style={style}
      className={`group relative flex items-center justify-center overflow-hidden bg-industrial-800 text-left ${className}`}
    >
      {meta.image ? (
        <img
          src={meta.image}
          alt={meta.alt}
          loading="lazy"
          // `meta.imageBoxClass` lets one card's image sit smaller than the
          // full card box (see vibrationSolutions above) without touching
          // the other cards, which all keep the original full-bleed default.
          className={`${meta.imageBoxClass ?? 'h-full w-full'} object-cover object-center transition-transform duration-500 ease-out motion-reduce:transition-none ${meta.pan ?? ''} ${scaleClasses}`}
        />
      ) : (
        <ImagePlaceholder label={meta.alt} aspect="" tone="dark" className="h-full w-full" />
      )}
      <span
        aria-hidden="true"
        className={`absolute inset-0 border-2 transition-colors duration-200 ${isActive ? 'border-ember-600' : 'border-transparent'}`}
      />
      <div className="absolute inset-x-0 bottom-0 flex items-start gap-2 bg-gradient-to-t from-industrial-950/95 to-transparent p-3 pt-8">
        <Icon size={14} className="mt-0.5 shrink-0 text-ember-600" />
        <span className="text-xs font-semibold leading-snug text-base-50">{t(`subServices.${service.key}.title`)}</span>
      </div>
    </button>
  )
}

function SectionConstruction({ t, activeKey, onSelect, onClose, panelRef }) {
  const category = getCategoryByKey('construction')
  const items = category.subServices
    .map((service) => ({ service, meta: CONSTRUCTION_MOSAIC[service.key] }))
    .filter((item) => item.meta)
  const activeService = category.subServices.find((service) => service.key === activeKey)

  return (
    <section className="relative overflow-hidden bg-industrial-800 py-16 md:py-24">
      <TechnicalLines className="text-base-50" opacity="opacity-[0.04]" angle={-22} />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">
          <Reveal>
            <span className="font-mono text-sm text-ember-600">{category.number}</span>
            <h2 className="mt-2 font-heading text-2xl font-bold text-base-50 md:text-3xl">
              {t(`categories.${category.key}.title`)}
            </h2>
            <p className="mt-4 max-w-md text-lg text-neutral-custom-400">{t(`categories.${category.key}.intro`)}</p>
          </Reveal>

          <Reveal delay={0.1}>
            {/* Desktop/tablet: editorial mosaic with varied image proportions */}
            <div
              className="hidden gap-3 lg:grid lg:h-[520px]"
              style={{
                // 6th item (seismic) mirrors `a` as a second tall bookend
                // column on the right — `a`/`b`/`c`/`d`/`e` keep the exact
                // same row heights and zoom/pan treatment as before; only
                // the column count/width changes to make room for `f`.
                gridTemplateAreas: '"a b c f" "a d e f"',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gridTemplateRows: '1fr 1fr',
              }}
            >
              {items.map(({ service, meta }) => (
                <MosaicCard
                  key={service.key}
                  service={service}
                  meta={meta}
                  t={t}
                  style={{ gridArea: meta.area }}
                  isActive={activeKey === service.key}
                  onSelect={onSelect}
                />
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
                  isActive={activeKey === service.key}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </Reveal>
        </div>

        {activeService && (
          <div className="mt-10">
            <ServiceExplorerPanel service={activeService} t={t} onClose={onClose} panelRef={panelRef} />
          </div>
        )}
      </div>
    </section>
  )
}

// ---- 04 — Industrial Solutions (light, panoramic) --------------------------
// Currently unused — hidden from the page render below (see ServicesShowcase),
// kept intact for a quick re-enable.
// eslint-disable-next-line no-unused-vars
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
          <p className="max-w-md text-lg text-neutral-custom-600 md:text-right">{t(`categories.${category.key}.intro`)}</p>
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

// Currently unused — hidden from the page render below (see ServicesShowcase),
// kept intact for a quick re-enable.
// eslint-disable-next-line no-unused-vars
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
          <p className="max-w-md text-lg text-neutral-custom-400 md:text-right">{t(`categories.${category.key}.intro`)}</p>
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

  return (
    <section className="relative isolate overflow-hidden bg-base-50">
      <img
        src="/images/services/category-visuals/engineering-design-overview.webp"
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-[78%_center] sm:object-[74%_center] lg:object-[68%_center]"
      />
      {/* Off-white reveal gradient: opaque over the left copy zone, fading
          out toward the center/right so the render emerges from the section
          background instead of sitting behind a hard-edged image panel. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-base-50 from-0% via-base-50 via-60% to-transparent to-100% sm:via-50% sm:to-90% lg:via-32% lg:to-68%"
      />
      {/* Same technical-line texture as TechnicalLines, masked to the opaque
          copy zone so it never reads as noise over the visible photo. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 text-industrial-950 opacity-[0.05]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(22deg, currentColor 0, currentColor 1px, transparent 1px, transparent 120px)',
          WebkitMaskImage: 'linear-gradient(to right, black 0%, black 35%, transparent 60%)',
          maskImage: 'linear-gradient(to right, black 0%, black 35%, transparent 60%)',
        }}
      />

      <div className="relative mx-auto flex min-h-[360px] max-w-7xl items-center px-6 py-16 sm:min-h-[440px] md:min-h-[520px] md:py-24 lg:min-h-[600px]">
        <Reveal className="max-w-sm">
          <span className="font-mono text-sm text-ember-600">{category.number}</span>
          <h2 className="mt-2 font-heading text-2xl font-bold text-industrial-950 md:text-3xl">
            {t(`categories.${category.key}.title`)}
          </h2>
          <p className="mt-4 text-lg text-neutral-custom-600">{t(`categories.${category.key}.intro`)}</p>
        </Reveal>
      </div>
    </section>
  )
}

export default function ServicesShowcase() {
  const { t } = useTranslation('services')
  // Shared across all three expandable categories (Firestop/Testing/
  // Construction) so only one service detail panel is ever open at a time,
  // no matter which category it belongs to — selecting a service in any
  // category replaces whatever was open elsewhere on the page.
  const [activeKey, setActiveKey] = useState(null)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!activeKey || !panelRef.current) return
    const header = document.querySelector('header')
    const headerHeight = header?.getBoundingClientRect().height ?? 0
    const top = panelRef.current.getBoundingClientRect().top + window.scrollY - headerHeight - 16
    window.scrollTo({ top, behavior: 'smooth' })
  }, [activeKey])

  const panelProps = { activeKey, onSelect: setActiveKey, onClose: () => setActiveKey(null), panelRef }

  return (
    <>
      <SectionFirestop t={t} {...panelProps} />
      <SectionTesting t={t} {...panelProps} />
      <SectionConstruction t={t} {...panelProps} />
      {/* Sənaye Həlləri (Industrial) and Marine Həlləri sections are temporarily
          hidden from the page — components/data/translations kept as-is so
          they can be re-enabled later. */}
      <SectionDesignEngineering t={t} />
    </>
  )
}
