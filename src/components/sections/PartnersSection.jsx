import { Fragment, useRef } from 'react'
import { usePartners } from '../../hooks/usePartners'
import { useTranslation } from '../../lib/i18n/useTranslation'
import { isHttpUrl } from '../../lib/cms/urlValidation'

function PartnerCard({ name, logoSrc, url }) {
  const card = (
    <div className="group flex flex-col items-center">
      <div className="flex aspect-[2/1] w-36 shrink-0 items-center justify-center rounded-lg border border-neutral-custom-400/20 bg-base-50 p-3 shadow-sm transition-transform duration-300 group-hover:-translate-y-1.5 xl:w-40">
        <img
          src={logoSrc}
          alt={name ?? 'Logo'}
          className="h-full w-full object-contain"
          loading="lazy"
          draggable={false}
        />
      </div>
      <span
        aria-hidden="true"
        className="mt-5 h-2 w-2 rounded-full bg-neutral-custom-400/50 ring-4 ring-base-100 transition-all duration-300 group-hover:bg-ember-600 group-hover:shadow-[0_0_14px_3px_rgba(227,30,36,0.55)]"
      />
    </div>
  )

  // No URL means non-clickable — same visual item, no link wrapper, no badge.
  // Also fails safe for any stored value that isn't a real http(s) URL
  // (defense in depth — admin-form validation already rejects these).
  if (!url || !isHttpUrl(url)) return card

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={name ? `${name} official website` : 'Partner official website'}
      className="block"
    >
      {card}
    </a>
  )
}

export default function PartnersSection() {
  const { t } = useTranslation('home')
  const { partners, loading } = usePartners()
  const scrollerRef = useRef(null)
  const dragRef = useRef({ isDown: false, startX: 0, startScrollLeft: 0, moved: false })

  function handleMouseDown(event) {
    const scroller = scrollerRef.current
    if (!scroller) return
    dragRef.current = { isDown: true, startX: event.pageX, startScrollLeft: scroller.scrollLeft, moved: false }
    scroller.style.cursor = 'grabbing'
  }

  function handleMouseMove(event) {
    const drag = dragRef.current
    if (!drag.isDown) return
    const delta = event.pageX - drag.startX
    if (Math.abs(delta) > 3) drag.moved = true
    event.preventDefault()
    scrollerRef.current.scrollLeft = drag.startScrollLeft - delta
  }

  function handleMouseUpOrLeave() {
    dragRef.current.isDown = false
    if (scrollerRef.current) scrollerRef.current.style.cursor = ''
  }

  function handleClick(event) {
    if (dragRef.current.moved) event.preventDefault()
  }

  return (
    <section className="bg-base-100 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-3 block font-heading text-xs font-semibold uppercase tracking-[0.2em] text-ember-600">
            {t('partnersSection.label')}
          </span>
          <h2 className="font-heading text-3xl font-bold text-industrial-950 md:text-4xl">
            {t('partnersSection.title')}
          </h2>
          <p className="mt-4 text-neutral-custom-600">{t('partnersSection.subtitle')}</p>
        </div>

        <div className="relative mt-16">
          {/* Card is w-36 (144px) at aspect-[2/1] = 72px tall, + mt-5 gap (20px) +
              half the dot's own height (4px) = 96px to the dot's center;
              xl:w-40 (160px) = 80px tall -> 104px. The line is pinned to the
              same offsets so it passes through every dot's center. */}
          <div
            aria-hidden="true"
            className="absolute left-4 right-4 top-[96px] hidden h-px bg-neutral-custom-400/25 lg:block xl:top-[104px]"
          />
          {loading ? (
            <div className="flex min-h-[152px] items-center justify-center">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-industrial-950/15 border-t-ember-600" />
            </div>
          ) : (
            /* lg+: single non-wrapping row (see comment above re: the
               connecting line) — 7 fixed-width cards + separators can
               exceed the viewport around the lg/xl breakpoints, so the row
               scrolls horizontally within itself (justify-start keeps every
               card reachable by scroll) instead of the whole page gaining
               a horizontal scrollbar. */
            <div
              ref={scrollerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onClickCapture={handleClick}
              className="no-scrollbar flex flex-wrap items-start justify-center gap-x-2 gap-y-12 lg:flex-nowrap lg:justify-start lg:gap-x-5 lg:overflow-x-auto lg:cursor-grab xl:gap-x-6"
            >
              {partners.map((partner, index) => (
                <Fragment key={partner.id ?? partner.logoSrc}>
                  <PartnerCard {...partner} />
                  {index < partners.length - 1 && (
                    <span aria-hidden="true" className="hidden self-center pb-6 font-heading text-ember-600 lg:block">
                      •
                    </span>
                  )}
                </Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
