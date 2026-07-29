import { Fragment, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { useTranslation } from '../../lib/i18n/useTranslation'
import { materials } from '../../data/materials'
import WhyFirestop from './WhyFirestop'

const WALL_IMAGE = '/images/materials/wall-penetrations.jpg'
const WALL_IMAGE_RATIO = '2560 / 851'

// Generic, honest checklist copy — no invented certificate numbers, just
// the industry-standard categories (per CLAUDE.md: real content only).
const CHECKLIST_KEYS = ['sealing', 'certified', 'installation']

// The zoom/glow/blur hover treatment is a mouse-hover interaction; on touch
// devices it's meaningless (and tap already drives the same activeId state
// for the info card), so it's gated off here rather than firing on tap.
function usePointerFine() {
  const [isPointerFine, setIsPointerFine] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches
  )

  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)')
    function handleChange(event) {
      setIsPointerFine(event.matches)
    }
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  return isPointerFine
}

function ZoneCard({ material, t, onEnter, onLeave }) {
  const { left, top, width, height } = material.zone
  const isRightHalf = left + width / 2 > 55

  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="absolute z-30 w-64 rounded-lg border border-ember-600 bg-industrial-950 p-4 text-left shadow-xl"
      style={{
        top: `calc(${top + height}% + 12px)`,
        ...(isRightHalf ? { right: `${100 - (left + width)}%` } : { left: `${left}%` }),
      }}
    >
      <p className="font-heading text-base font-bold text-base-50">{t(`materials.items.${material.key}.name`)}</p>

      <ul className="mt-3 space-y-2">
        {CHECKLIST_KEYS.map((checkKey) => (
          <li key={checkKey} className="flex items-center gap-2 text-sm text-neutral-custom-400">
            <Check size={16} className="shrink-0 text-ember-600" />
            {t(`materials.checklist.${checkKey}`)}
          </li>
        ))}
      </ul>

      <Link
        to={material.link}
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ember-600 transition-colors hover:text-ember-800"
      >
        {t('materials.detailsCta')} <span aria-hidden="true">→</span>
      </Link>
    </div>
  )
}

export default function Materials() {
  const { t } = useTranslation('home')
  const [activeId, setActiveId] = useState(null)
  const isPointerFine = usePointerFine()
  const activeMaterial = materials.find((material) => material.id === activeId)
  const zoomActive = Boolean(activeMaterial) && isPointerFine

  function activate(id) {
    setActiveId(id)
  }

  function deactivate() {
    setActiveId(null)
  }

  // Spotlight: a dark radial-gradient vignette with a transparent "hole"
  // sized/centered on the active zone's own rect, so everything except that
  // zone dims. Percentage-sized radial-gradients are relative to this same
  // element's box, which lines up exactly with the zone's own % coordinates.
  const spotlightStyle = activeMaterial
    ? (() => {
        const { left, top, width, height } = activeMaterial.zone
        const cx = left + width / 2
        const cy = top + height / 2
        const rx = width / 2 + 4
        const ry = height / 2 + 6
        return {
          opacity: 1,
          background: `radial-gradient(ellipse ${rx}% ${ry}% at ${cx}% ${cy}%, transparent 55%, rgba(20, 20, 20, 0.75) 100%)`,
        }
      })()
    : { opacity: 0 }

  // "Camera zoom": the wall photo scales up around the hovered zone's own
  // center, computed from its % coordinates — a dynamic transform-origin,
  // not a fixed one.
  const imageStyle = zoomActive
    ? (() => {
        const { left, top, width, height } = activeMaterial.zone
        const cx = left + width / 2
        const cy = top + height / 2
        return { transform: 'scale(1.08)', transformOrigin: `${cx}% ${cy}%` }
      })()
    : { transform: 'scale(1)', transformOrigin: '50% 50%' }

  return (
    <section className="bg-industrial-900">
      <div className="relative w-full" style={{ aspectRatio: WALL_IMAGE_RATIO }}>
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={WALL_IMAGE}
            alt={t('materials.titlePrefix')}
            className="h-full w-full object-cover object-center transition-transform duration-[400ms] ease-out"
            style={imageStyle}
          />
        </div>

        {/* Text overlay on the photo's dark left side — blurs/dims while a
            zone is being explored so attention stays on the zoomed area. */}
        <div
          className={`absolute inset-y-0 left-0 flex w-[42%] flex-col justify-center bg-gradient-to-r from-industrial-950 via-industrial-950/70 to-transparent px-4 transition-all duration-300 sm:px-8 md:px-12 ${
            zoomActive ? 'opacity-60 blur-[2px]' : 'opacity-100 blur-0'
          }`}
        >
          <span className="mb-3 block h-1 w-12 bg-ember-600 md:mb-4 md:w-16" />
          <h2 className="font-heading text-lg font-bold leading-tight text-base-50 sm:text-2xl md:text-4xl">
            {t('materials.titlePrefix')} <span className="text-ember-600">{t('materials.titleHighlight')}</span>
          </h2>
          <p className="mt-2 hidden max-w-sm text-sm text-neutral-custom-400 sm:block md:mt-4 md:text-base">
            {t('materials.subtitle')}
          </p>
          <Link
            to="/services"
            className="mt-3 inline-flex w-fit items-center gap-2 rounded-md bg-ember-600 px-3 py-1.5 text-xs font-semibold text-base-50 transition-colors hover:bg-ember-800 sm:px-5 sm:py-2.5 sm:text-sm md:mt-6"
          >
            {t('materials.viewSystemsCta')}
          </Link>
        </div>

        {/* Spotlight dimming layer — sits above the image, below the zones/card. */}
        <div className="absolute inset-0 z-10 transition-opacity duration-300 ease-out" style={spotlightStyle} />

        {materials.map((material) => {
          const isActive = activeId === material.id
          const { left, top, width, height } = material.zone
          const rectStyle = { left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }

          return (
            <Fragment key={material.id}>
              <button
                type="button"
                onMouseEnter={() => activate(material.id)}
                onMouseLeave={deactivate}
                onFocus={() => activate(material.id)}
                onBlur={deactivate}
                onClick={() => setActiveId((prev) => (prev === material.id ? null : material.id))}
                aria-label={t(`materials.items.${material.key}.name`)}
                className="absolute z-20 rounded-md"
                style={rectStyle}
              />

              {/* Inner light: a pulsing ember glow "inside the concrete"
                  instead of a hard border — soft-edged via blur, mixed into
                  the photo underneath via mix-blend-mode. Mouse-only. */}
              {isActive && isPointerFine && (
                <div
                  aria-hidden="true"
                  className="animate-glow-pulse pointer-events-none absolute z-20 rounded-md blur-md mix-blend-overlay"
                  style={{
                    ...rectStyle,
                    background:
                      'radial-gradient(circle, rgba(232,50,36,0.5) 0%, rgba(232,50,36,0.15) 40%, transparent 70%)',
                  }}
                />
              )}
            </Fragment>
          )
        })}

        {activeMaterial && (
          <ZoneCard
            material={activeMaterial}
            t={t}
            onEnter={() => activate(activeMaterial.id)}
            onLeave={deactivate}
          />
        )}
      </div>

      <WhyFirestop />
    </section>
  )
}
