import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from '../../lib/i18n/useTranslation'
import { fireProcessSteps } from '../../data/servicesDetail'

const WALL_IMAGE = '/images/materials/wall-penetrations.jpg'

// Distance from a step's own top to its connector dot's center — every step
// shares the same fixed-height visual/text blocks below, so this offset
// stays correct regardless of how much a given title/description wraps:
// 20 (number) + 12 (gap) + 176 (square visual) + 16 (gap) + 60 (title+desc
// block) + 20 (gap) + 5 (half the dot's own height).
const CONNECTOR_OFFSET = 309

function ProcessStep({ index, step, t }) {
  return (
    <div className="group flex w-56 shrink-0 snap-start flex-col sm:w-64">
      <span className="block font-heading text-sm font-bold text-ember-600">{String(index + 1).padStart(2, '0')}</span>

      <div className="mt-3 h-44 w-full overflow-hidden rounded-lg">
        <img
          src={WALL_IMAGE}
          alt={t(`fireProcess.steps.${step.key}.title`)}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          style={{ objectPosition: step.imagePosition }}
        />
      </div>

      <div className="mt-4 min-h-[60px]">
        <h3 className="font-heading text-lg font-semibold leading-snug text-base-50">
          {t(`fireProcess.steps.${step.key}.title`)}
        </h3>
        <p className="mt-1 text-sm text-neutral-custom-400">{t(`fireProcess.steps.${step.key}.description`)}</p>
      </div>

      <span
        aria-hidden="true"
        className="mt-5 h-2.5 w-2.5 self-start rounded-full bg-ember-600 ring-4 ring-industrial-950 transition-shadow duration-300 group-hover:shadow-[0_0_14px_3px_rgba(227,30,36,0.55)]"
      />
    </div>
  )
}

export default function Process() {
  const { t } = useTranslation('services')
  const scrollerRef = useRef(null)
  const dragRef = useRef({ active: false, startX: 0, startScrollLeft: 0 })

  function handleWheel(event) {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
    event.currentTarget.scrollLeft += event.deltaY
    event.preventDefault()
  }

  // Mouse-only drag-to-scroll — touch already gets native swipe scrolling
  // from the browser on this overflow-x-auto element.
  function handlePointerDown(event) {
    if (event.pointerType !== 'mouse') return
    dragRef.current = { active: true, startX: event.clientX, startScrollLeft: scrollerRef.current.scrollLeft }
    scrollerRef.current.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event) {
    if (!dragRef.current.active) return
    const delta = event.clientX - dragRef.current.startX
    scrollerRef.current.scrollLeft = dragRef.current.startScrollLeft - delta
  }

  function handlePointerUp(event) {
    dragRef.current.active = false
    if (scrollerRef.current.hasPointerCapture(event.pointerId)) {
      scrollerRef.current.releasePointerCapture(event.pointerId)
    }
  }

  function scrollToOtherServices() {
    document.getElementById('other-services')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="process" className="relative overflow-hidden bg-industrial-950 pt-28 pb-16 md:pt-32 md:pb-20">
      <div className="mx-auto max-w-[1600px] px-6">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">
          <div className="lg:w-1/4 lg:shrink-0">
            <span className="mb-3 block font-heading text-xs font-semibold uppercase tracking-[0.2em] text-ember-600">
              {t('fireProcess.eyebrow')}
            </span>
            <h1 className="font-heading text-3xl font-bold text-base-50 md:text-4xl">{t('fireProcess.title')}</h1>
            <p className="mt-4 text-neutral-custom-400">{t('fireProcess.subtitle')}</p>
          </div>

          <div className="min-w-0 flex-1">
            <div
              ref={scrollerRef}
              onWheel={handleWheel}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="no-scrollbar cursor-grab overflow-x-auto pb-4 active:cursor-grabbing"
            >
              <div className="relative w-fit">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 h-px bg-ember-600/50"
                  style={{ top: `${CONNECTOR_OFFSET}px` }}
                />
                <div className="flex snap-x snap-mandatory items-start gap-8 pr-8">
                  {fireProcessSteps.map((step, index) => (
                    <ProcessStep key={step.key} index={index} step={step} t={t} />
                  ))}

                  <button
                    type="button"
                    onClick={scrollToOtherServices}
                    aria-label={t('fireProcess.nextCta')}
                    className="flex h-14 w-14 shrink-0 items-center justify-center self-start rounded-full bg-ember-600 text-base-50 transition-transform duration-300 hover:scale-110 hover:bg-ember-800"
                    style={{ marginTop: `${CONNECTOR_OFFSET - 28}px` }}
                  >
                    <ArrowRight size={22} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
