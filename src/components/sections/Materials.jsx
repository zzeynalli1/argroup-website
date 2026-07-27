import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from '../../lib/i18n/useTranslation'

/**
 * `interactive: false` items (hvacDuct, pvcPipe) have no matching real
 * firestop product/standard in the content knowledge base yet — they render
 * as non-clickable "coming soon" slots until that content is supplied.
 * Do not fill their description in without real source content.
 */
const MATERIALS = [
  { key: 'cableTray', interactive: true },
  { key: 'metalPipe', interactive: true },
  { key: 'hvacDuct', interactive: false },
  { key: 'pvcPipe', interactive: false },
]

function MaterialCard({ material, t, isOpen, onToggle }) {
  const { key, interactive } = material

  return (
    <div className="flex flex-col">
      <button
        type="button"
        disabled={!interactive}
        onClick={() => onToggle(key)}
        className={`text-left rounded-md border overflow-hidden transition-colors ${
          interactive
            ? 'border-neutral-custom-400/30 hover:border-ember-600 cursor-pointer'
            : 'border-neutral-custom-400/15 opacity-60 cursor-not-allowed'
        }`}
      >
        <div className="aspect-square bg-neutral-custom-400/15 flex items-center justify-center text-neutral-custom-600 text-sm text-center px-2">
          {t('materials.imagePlaceholder')}
        </div>
        <div className="p-4">
          <p className="font-semibold text-industrial-950">{t(`materials.items.${key}.name`)}</p>
          {!interactive && (
            <p className="mt-1 text-xs uppercase tracking-wide text-neutral-custom-600">
              {t('materials.comingSoon')}
            </p>
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {interactive && isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="mt-3 text-sm text-neutral-custom-600 px-1">
              {t(`materials.items.${key}.description`)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Materials() {
  const { t } = useTranslation('home')
  const [openKey, setOpenKey] = useState(null)

  function handleToggle(key) {
    setOpenKey((prev) => (prev === key ? null : key))
  }

  return (
    <section className="bg-base-50 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-xl">
          <span className="block w-16 h-1 bg-ember-600 mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-industrial-950">{t('materials.title')}</h2>
          <p className="mt-4 text-neutral-custom-600">{t('materials.subtitle')}</p>
        </div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          {MATERIALS.map((material) => (
            <MaterialCard
              key={material.key}
              material={material}
              t={t}
              isOpen={openKey === material.key}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
