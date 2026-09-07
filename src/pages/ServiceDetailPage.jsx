import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowUpRight, ChevronRight } from 'lucide-react'
import { useTranslation } from '../lib/i18n/useTranslation'
import { getCategoryByKey, getServiceBySlug, services } from '../data/servicesDetail'
import ImagePlaceholder from '../components/ui/ImagePlaceholder'
import TechnicalLines from '../components/ui/TechnicalLines'
import Reveal from '../components/ui/Reveal'
import Button from '../components/ui/Button'

function SectionHeading({ eyebrow, title, tone = 'light' }) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-ember-600">{eyebrow}</span>
        <span aria-hidden="true" className="h-px w-8 bg-ember-600" />
      </div>
      <h2
        className={`mt-3 text-left font-heading text-2xl font-bold leading-tight tracking-tight md:text-3xl lg:text-4xl ${
          tone === 'dark' ? 'text-base-50' : 'text-industrial-950'
        }`}
      >
        {title}
      </h2>
    </div>
  )
}

function DetailHero({ service, category, t }) {
  return (
    <section className="relative overflow-hidden bg-base-50 pt-32 pb-16 md:pt-40 md:pb-20">
      <div className="relative mx-auto max-w-7xl px-6">
        <nav className="flex flex-wrap items-center gap-1.5 text-xs font-medium uppercase tracking-[0.1em] text-neutral-custom-400">
          <Link to="/services" className="hover:text-ember-600">
            {t('detailLabels.breadcrumbHome')}
          </Link>
          <ChevronRight size={12} />
          <span>{t(`categories.${category.key}.title`)}</span>
          <ChevronRight size={12} />
          <span className="text-industrial-950">{t(`subServices.${service.key}.title`)}</span>
        </nav>

        <div className="mt-8 grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <h1 className="font-heading text-3xl font-bold leading-tight text-industrial-950 md:text-5xl">
              {t(`subServices.${service.key}.title`)}
            </h1>
            <span aria-hidden="true" className="mt-5 block h-1 w-16 bg-ember-600" />
            <p className="mt-5 max-w-lg text-lg text-neutral-custom-600">{t(`detail.${service.key}.lead`)}</p>
          </Reveal>

          <Reveal delay={0.1}>
            <ImagePlaceholder label={service.imageSlots.hero} aspect="aspect-[4/3]" tone="light" />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function DetailOverview({ service, t }) {
  return (
    <section className="bg-concrete-100 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <SectionHeading eyebrow={t('detailLabels.sections.about.eyebrow')} title={t('detailLabels.sections.about.title')} />
            <p className="mt-6 max-w-2xl text-base leading-[1.7] text-neutral-custom-600">{t(`detail.${service.key}.about`)}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <ImagePlaceholder label={service.imageSlots.overview} aspect="aspect-[4/3]" tone="light" />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function DetailTechnical({ service, t }) {
  return (
    <section className="relative overflow-hidden bg-industrial-900 py-16 md:py-24">
      <TechnicalLines className="text-base-50" opacity="opacity-[0.04]" />
      <div className="relative mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow={t('detailLabels.sections.technicalApproach.eyebrow')}
          title={t('detailLabels.sections.technicalApproach.title')}
          tone="dark"
        />
        <Reveal delay={0.1}>
          <p className="mt-6 max-w-lg text-base leading-[1.7] text-neutral-custom-400">{t(`detail.${service.key}.technicalApproach`)}</p>
        </Reveal>
      </div>
    </section>
  )
}

function DetailWorkProcess({ service, t }) {
  return (
    <section className="bg-base-100 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow={t('detailLabels.sections.workProcess.eyebrow')} title={t('detailLabels.sections.workProcess.title')} />
        <Reveal delay={0.1} className="mt-5">
          <ImagePlaceholder label={service.imageSlots.workProcess} aspect="aspect-[16/6]" tone="light" className="w-full" />
        </Reveal>
      </div>
    </section>
  )
}

function DetailApplications({ content, t }) {
  return (
    <section className="bg-industrial-800 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow={t('detailLabels.sections.applications.eyebrow')}
          title={t('detailLabels.sections.applications.title')}
          tone="dark"
        />
        <Reveal delay={0.1}>
          <p className="mt-6 max-w-xl text-base leading-[1.7] text-neutral-custom-400">{content}</p>
        </Reveal>
      </div>
    </section>
  )
}

function DetailRelated({ related, t }) {
  if (related.length === 0) return null

  return (
    <section className="bg-base-50 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow={t('detailLabels.sections.related.eyebrow')} title={t('detailLabels.sections.related.title')} />
        <Reveal
          delay={0.1}
          className="mt-8 grid grid-cols-1 border-t border-industrial-950/10 md:grid-cols-2 md:divide-x md:divide-industrial-950/10 lg:grid-cols-3"
        >
          {related.map((sibling) => (
            <Link
              key={sibling.key}
              to={`/services/${sibling.slug}`}
              className="group flex items-center justify-between gap-3 border-t border-industrial-950/10 py-6 first:border-t-0 transition-colors hover:bg-industrial-950/[0.03] md:border-t-0 md:px-6 md:py-8 md:first:pl-0 md:last:pr-0"
            >
              <span className="font-heading text-lg font-semibold text-industrial-950 transition-colors group-hover:text-ember-600">
                {t(`subServices.${sibling.key}.title`)}
              </span>
              <ArrowUpRight
                size={18}
                className="shrink-0 text-neutral-custom-600 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ember-600 motion-reduce:transition-none"
              />
            </Link>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

/**
 * Single reusable template for every routed service detail page
 * (/services/:slug): Hero -> Overview -> Technical Approach -> Work Process
 * -> Applications -> Related, alternating light/dark full-width sections.
 * All copy is data-driven off locales/<locale>/services.json `detail.<key>`
 * — see docs/argroup-knowledge-base.md for the source facts behind each
 * entry. Applications only renders when its content key exists, so a
 * thinly-sourced service naturally produces a shorter page instead of
 * padded/invented copy. Work Process has no verified step-by-step text in
 * the knowledge base, so it renders as a title + large image placeholder
 * only — no invented workflow steps.
 */
export default function ServiceDetailPage() {
  const { slug } = useParams()
  const { t } = useTranslation('services')
  const service = getServiceBySlug(slug)

  if (!service) {
    return <Navigate to="/services" replace />
  }

  const category = getCategoryByKey(service.categoryKey)
  const related = services.filter((s) => s.categoryKey === service.categoryKey && s.key !== service.key)
  const applicationsContent = t(`detail.${service.key}.applications`)

  return (
    <>
      <DetailHero service={service} category={category} t={t} />
      <DetailOverview service={service} t={t} />
      <DetailTechnical service={service} t={t} />
      <DetailWorkProcess service={service} t={t} />
      {applicationsContent && <DetailApplications content={applicationsContent} t={t} />}
      <DetailRelated related={related} t={t} />

      <section className="bg-industrial-950 py-16 md:py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-base-50 md:text-3xl">
            {t('detailLabels.ctaTitle')}
          </h2>
          <Link to="/contact" className="mt-8 inline-block">
            <Button variant="ember">{t('detailLabels.ctaButton')}</Button>
          </Link>
        </div>
      </section>
    </>
  )
}
