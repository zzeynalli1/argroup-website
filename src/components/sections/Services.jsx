import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from '../../lib/i18n/useTranslation'

/**
 * Real category names from the AR Group knowledge base (6 service
 * categories). Titles/descriptions are still PLACEHOLDER text pending
 * approved copy — see docs/argroup-knowledge-base.md. industrial/marine/
 * designEngineering have no source description at all yet.
 */
const ALL_SERVICE_KEYS = [
  'fireProtection',
  'testing',
  'construction',
  'industrial',
  'marine',
  'designEngineering',
]

const COMPACT_COUNT = 4

function ServicePanel({ serviceKey, t, moreHref }) {
  return (
    <motion.div
      key={serviceKey}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="aspect-video bg-neutral-custom-400/15 flex items-center justify-center text-neutral-custom-600 text-sm">
        {t('services.imagePlaceholder')}
      </div>
      <p className="mt-6 text-neutral-custom-600">{t(`services.items.${serviceKey}.description`)}</p>
      <Link
        to={moreHref}
        className="mt-4 inline-flex items-center gap-1 font-heading font-semibold text-ember-600 hover:text-ember-800 transition-colors"
      >
        {t('services.readMore')}
        <span>→</span>
      </Link>
    </motion.div>
  )
}

function DesktopIndex({ keys, activeIndex, setActiveIndex, t, moreHref }) {
  return (
    <div className="hidden md:flex gap-12 items-start">
      <ul className="w-2/5 md:sticky md:top-24 self-start">
        {keys.map((key, index) => {
          const isActive = index === activeIndex
          return (
            <li key={key} className="border-b border-neutral-custom-400/15">
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                className="w-full flex items-baseline gap-4 py-4 text-left"
              >
                <span
                  className={`font-heading text-sm transition-colors ${
                    isActive ? 'text-ember-600' : 'text-neutral-custom-400'
                  }`}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span
                  className={`font-heading text-2xl lg:text-3xl font-semibold transition-colors ${
                    isActive ? 'text-ember-600' : 'text-neutral-custom-400'
                  }`}
                >
                  {t(`services.items.${key}.title`)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="w-3/5 min-h-[320px]">
        <AnimatePresence mode="wait">
          <ServicePanel serviceKey={keys[activeIndex]} t={t} moreHref={moreHref} />
        </AnimatePresence>
      </div>
    </div>
  )
}

function MobileAccordion({ keys, activeIndex, setActiveIndex, t, moreHref }) {
  return (
    <div className="md:hidden">
      {keys.map((key, index) => {
        const isOpen = index === activeIndex
        return (
          <div key={key} className="border-b border-neutral-custom-400/15">
            <button
              type="button"
              onClick={() => setActiveIndex(isOpen ? -1 : index)}
              className="w-full flex items-center justify-between gap-4 py-4 text-left"
            >
              <span className="flex items-baseline gap-3">
                <span
                  className={`font-heading text-sm transition-colors ${
                    isOpen ? 'text-ember-600' : 'text-neutral-custom-400'
                  }`}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span
                  className={`font-heading text-lg font-semibold transition-colors ${
                    isOpen ? 'text-ember-600' : 'text-neutral-custom-600'
                  }`}
                >
                  {t(`services.items.${key}.title`)}
                </span>
              </span>
              <span className={`text-neutral-custom-400 transition-transform ${isOpen ? 'rotate-45' : ''}`}>+</span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="pb-5">
                    <div className="aspect-video bg-neutral-custom-400/15 flex items-center justify-center text-neutral-custom-600 text-sm">
                      {t('services.imagePlaceholder')}
                    </div>
                    <p className="mt-4 text-sm text-neutral-custom-600">
                      {t(`services.items.${key}.description`)}
                    </p>
                    <Link
                      to={moreHref}
                      className="mt-3 inline-flex items-center gap-1 font-heading font-semibold text-ember-600 text-sm"
                    >
                      {t('services.readMore')}
                      <span>→</span>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

/**
 * `variant="compact"` (Home): first 4 services, hover/click-driven editorial
 * index, plus a "view all" link to the full /services page.
 * `variant="full"` (/services): all 6 services, no "view all" link — the
 * "read more" links point to /contact instead, since no per-service detail
 * route exists yet.
 */
export default function Services({ variant = 'full' }) {
  const { t } = useTranslation('home')
  // Desktop and mobile are both always mounted (shown/hidden via CSS, not
  // conditional rendering), so they need independent state — the mobile
  // accordion can close to "nothing open" (-1), which the desktop panel
  // (always showing something) must never see.
  const [desktopIndex, setDesktopIndex] = useState(0)
  const [mobileOpenIndex, setMobileOpenIndex] = useState(-1)

  const keys = variant === 'compact' ? ALL_SERVICE_KEYS.slice(0, COMPACT_COUNT) : ALL_SERVICE_KEYS
  const moreHref = variant === 'compact' ? '/services' : '/contact'

  return (
    <section className="bg-base-100 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-xl">
          <span className="block w-16 h-1 bg-ember-600 mb-6" />
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-industrial-950">{t('services.title')}</h2>
          <p className="mt-4 text-neutral-custom-600">{t('services.subtitle')}</p>
        </div>

        <div className="mt-12">
          <DesktopIndex keys={keys} activeIndex={desktopIndex} setActiveIndex={setDesktopIndex} t={t} moreHref={moreHref} />
          <MobileAccordion keys={keys} activeIndex={mobileOpenIndex} setActiveIndex={setMobileOpenIndex} t={t} moreHref={moreHref} />
        </div>

        {variant === 'compact' && (
          <div className="mt-10">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 font-heading font-semibold text-industrial-950 hover:text-ember-600 transition-colors"
            >
              {t('services.viewAll')}
              <span>→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
