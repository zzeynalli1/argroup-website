import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Building,
  Cable,
  Cylinder,
  Flame,
  Layers,
  Link2,
  MapPin,
  PanelTop,
  ShieldCheck,
  Tag,
  TreePine,
  Wind,
  X,
} from 'lucide-react'
import { useTranslation } from '../../lib/i18n/useTranslation'
import { hotspots } from '../../data/hotspots3d'

// Three.js only loads once this section is actually rendered, keeping it out
// of the initial bundle (see CLAUDE.md perf note on the earlier 1.37MB hero).
const Hero3DScene = lazy(() => import('../3d/Hero3DScene'))

// Resolves the lucide icon name strings stored in data/hotspots3d.js.
const ICONS = { Cable, Cylinder, Wind, Layers, PanelTop, Link2, TreePine, Building }

const STAT_FIELDS = [
  { key: 'systemType', icon: Tag },
  { key: 'fireRating', icon: Flame },
  { key: 'certification', icon: ShieldCheck },
  { key: 'applicationArea', icon: MapPin },
]

function ScenePlaceholder({ label }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-industrial-950">
      <div className="flex items-center gap-3 text-neutral-custom-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-custom-400/30 border-t-ember-600" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  )
}

function InfoPanel({ hotspot, t, onClose, onSelectKey }) {
  const HotspotIcon = ICONS[hotspot.icon] ?? Layers

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-white/10 bg-industrial-950 px-6 py-5 md:absolute md:inset-x-auto md:top-6 md:right-6 md:max-h-[calc(100vh-3rem)] md:w-80 md:rounded-2xl md:border"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t('building3d.panel.close')}
        className="absolute right-4 top-4 z-10 text-neutral-custom-400 transition-colors hover:text-base-50"
      >
        <X size={18} />
      </button>

      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember-600">
        {t('building3d.panel.selectedLabel')}
      </p>

      <div className="mt-3 flex items-center gap-3 pr-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-ember-600">
          <HotspotIcon size={22} className="text-ember-600" />
        </div>
        <h3 className="font-heading text-lg font-bold text-base-50">{t(`building3d.hotspots.${hotspot.key}.name`)}</h3>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-neutral-custom-400">
        {t(`building3d.hotspots.${hotspot.key}.description`)}
      </p>

      <div className="mt-5 space-y-4 border-t border-white/10 pt-5">
        {STAT_FIELDS.map((field) => {
          // "System Type" doesn't fit non-building-system hotspots (e.g.
          // landscape/exterior design) — those set labelOverrideKey in
          // data/hotspots3d.js to swap the label to "Service Type".
          const labelKey = field.key === 'systemType' ? (hotspot.labelOverrideKey ?? field.key) : field.key

          return (
            <div key={field.key} className="flex items-start gap-3">
              <field.icon size={16} className="mt-0.5 shrink-0 text-neutral-custom-400" />
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-custom-400">
                  {t(`building3d.panel.${labelKey}`)}
                </p>
                <p className="mt-0.5 text-sm font-bold text-ember-600">
                  {t(`building3d.hotspots.${hotspot.key}.${field.key}`)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-5 border-t border-white/10 pt-5">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {hotspots.map((h) => {
            const Icon = ICONS[h.icon] ?? Layers
            const isActive = h.key === hotspot.key
            return (
              <button
                key={h.key}
                type="button"
                onClick={() => onSelectKey(h.key)}
                aria-label={t(`building3d.hotspots.${h.key}.name`)}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  isActive
                    ? 'border-ember-600 text-ember-600'
                    : 'border-white/10 text-neutral-custom-400 hover:border-white/30 hover:text-base-50'
                }`}
              >
                <Icon size={16} />
              </button>
            )
          })}
        </div>
      </div>

      <Link
        to="/services"
        className="mt-5 inline-flex items-center justify-center rounded-md bg-ember-600 px-5 py-2.5 text-sm font-medium text-base-50 transition-colors hover:bg-ember-800"
      >
        {t('building3d.panel.detailsCta')}
      </Link>
    </motion.div>
  )
}

export default function Building3DSection() {
  const { t } = useTranslation('home')
  const sceneRef = useRef(null)
  const [active, setActive] = useState(null)

  function handleClose() {
    sceneRef.current?.resetCamera()
    setActive(null)
  }

  function handleSelectKey(key) {
    sceneRef.current?.selectHotspot(key)
  }

  useEffect(() => {
    if (!active) return

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        sceneRef.current?.resetCamera()
        setActive(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [active])

  return (
    <section className="relative min-h-screen overflow-hidden bg-industrial-950">
      <div className="absolute inset-0">
        <Suspense fallback={<ScenePlaceholder label={t('building3d.loading')} />}>
          <Hero3DScene ref={sceneRef} onHotspotChange={setActive} />
        </Suspense>
      </div>

      <div className="pointer-events-none relative z-10 mx-auto max-w-7xl px-6 pt-28 md:pt-32">
        <div className="max-w-xl">
          <span className="block h-1 w-16 bg-ember-600" />
          <h1 className="mt-6 font-heading text-3xl font-bold text-base-50 md:text-4xl">{t('building3d.title')}</h1>
          <p className="mt-4 text-neutral-custom-400">{t('building3d.subtitle')}</p>
        </div>
      </div>

      {!active && (
        <p className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full bg-industrial-950/80 px-4 py-2 text-xs text-neutral-custom-400 md:left-6 md:translate-x-0">
          {t('building3d.hint')}
        </p>
      )}

      <AnimatePresence>
        {active && (
          <motion.div
            key="hotspot-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-industrial-950/60"
            onClick={handleClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {active && (
          <InfoPanel key={active.key} hotspot={active} t={t} onClose={handleClose} onSelectKey={handleSelectKey} />
        )}
      </AnimatePresence>
    </section>
  )
}
