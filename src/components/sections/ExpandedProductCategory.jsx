import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ArrowUp } from 'lucide-react'
import { useTranslation } from '../../lib/i18n/useTranslation'
import { categoryMaterials } from '../../data/categoryMaterials'
import ImagePlaceholder from '../ui/ImagePlaceholder'
import TechnicalLines from '../ui/TechnicalLines'

/**
 * One product/material tile in the expanded grid. Three border states per
 * the interaction spec: steel/subtle by default, AR red on hover, and AR
 * red held persistently while `isSelected` (even after the pointer leaves).
 */
function ProductItem({ material, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`group relative flex flex-col overflow-hidden border bg-industrial-900 text-left transition-colors duration-200 ease-out ${
        isSelected ? 'border-ember-600' : 'border-white/10 hover:border-ember-600'
      }`}
    >
      <ImagePlaceholder label={material.name} aspect="aspect-square" tone="dark" className="w-full" />
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <span className="font-heading text-sm font-semibold leading-snug text-base-50">{material.name}</span>
        <ArrowRight
          size={14}
          className={`shrink-0 text-ember-600 transition-transform duration-200 ease-out motion-reduce:transition-none ${
            isSelected ? 'translate-x-0.5' : 'group-hover:translate-x-0.5'
          }`}
        />
      </div>
    </button>
  )
}

/**
 * Right-column (desktop) / inline (mobile) detail panel for the selected
 * material. Only image + name are shown — no other per-product data
 * (type/descriptor, features, applications, documents) is verified yet, so
 * those fields are omitted entirely rather than filled with invented copy.
 */
function ProductDetail({ material, t }) {
  if (!material) {
    return (
      <div className="hidden border border-white/10 bg-industrial-950 p-10 text-center lg:flex lg:flex-col lg:items-center lg:justify-center">
        <p className="text-sm text-neutral-custom-400">{t('materials.selectPrompt')}</p>
      </div>
    )
  }

  return (
    <div className="border border-ember-600/40 bg-industrial-950 p-6 md:p-7">
      <ImagePlaceholder label={`${material.name} — detail`} aspect="aspect-[4/3]" tone="dark" />
      <h3 className="mt-5 font-heading text-lg font-bold text-base-50 md:text-xl">{material.name}</h3>
    </div>
  )
}

/**
 * Inline "Ətraflı" expansion for the Products landing page's 3 category
 * panels (see ProductCategories.jsx, which already owns the activeCategory
 * click-to-toggle state — this component only reads it, never mutates the
 * category panels themselves). Rendered as an independent section directly
 * below the existing category showcase; renders nothing when no category is
 * active, so the approved page is visually unchanged until a panel is
 * clicked. Same component drives all 3 categories — nothing here is
 * hardcoded per-category beyond the shared categoryMaterials lookup.
 */
export default function ExpandedProductCategory({ activeCategory, onClose }) {
  const { t } = useTranslation('products')
  const reduceMotion = useReducedMotion()
  const [selectedSlug, setSelectedSlug] = useState(null)
  // Reset the selection when the active category changes (including on
  // close) — adjusted during render rather than in an effect, per React's
  // guidance for resetting state in response to a prop change.
  const [lastCategory, setLastCategory] = useState(activeCategory)
  if (activeCategory !== lastCategory) {
    setLastCategory(activeCategory)
    setSelectedSlug(null)
  }

  const materials = activeCategory ? categoryMaterials[activeCategory] ?? [] : []
  const selectedMaterial = materials.find((material) => material.slug === selectedSlug) ?? null

  return (
    <AnimatePresence initial={false}>
      {activeCategory && (
        <motion.section
          key={activeCategory}
          initial={reduceMotion ? false : { height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="relative overflow-hidden bg-industrial-950"
        >
          <div className="relative border-t border-white/10 py-12 md:py-16">
            <TechnicalLines className="text-base-50" opacity="opacity-[0.04]" />
            <div className="relative mx-auto max-w-7xl px-6">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-ember-600" />
                  <h2 className="font-heading text-xl font-bold uppercase tracking-wide text-base-50 md:text-2xl">
                    {t(`items.${activeCategory}.name`)}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="group flex shrink-0 items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-neutral-custom-400 transition-colors duration-200 hover:text-ember-600"
                >
                  {t('materials.close')}
                  <ArrowUp size={14} className="transition-transform duration-200 ease-out group-hover:-translate-y-0.5 motion-reduce:transition-none" />
                </button>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] lg:gap-8">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {materials.map((material) => (
                    <ProductItem
                      key={material.slug}
                      material={material}
                      isSelected={selectedMaterial?.slug === material.slug}
                      onSelect={() => setSelectedSlug((current) => (current === material.slug ? null : material.slug))}
                    />
                  ))}
                </div>

                <ProductDetail material={selectedMaterial} t={t} />
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
