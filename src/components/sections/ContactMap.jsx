import { Mail, Phone } from 'lucide-react'
import { useTranslation } from '../../lib/i18n/useTranslation'
import { ADDRESS, EMAIL, PHONES } from '../../data/contactInfo'

/**
 * Coordinates are AR Group's real Google Maps place pin
 * (İzzət Orucova 18, Xətai, Baku), captured from the live site's own
 * "view on map" link — not a generic address-string guess.
 *
 * The CSS `filter` is a dark/desaturated approximation applied to the raw
 * `output=embed` iframe. Real branded map styling (a proper JSON style
 * matching the site's palette) requires the Google Maps JavaScript API with
 * a billing-enabled API key, not the no-key iframe embed — out of scope
 * until that credential exists.
 */
const LAT = 40.3821575
const LNG = 49.8759006
const MAP_SRC = `https://www.google.com/maps?q=${LAT},${LNG}&z=15&output=embed`

export default function ContactMap() {
  const { t } = useTranslation('contact')

  return (
    <section className="relative w-full bg-industrial-900 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-6 lg:grid-cols-[65fr_35fr] lg:gap-8">
          <div className="relative h-[320px] overflow-hidden border border-base-50/10 md:h-[420px]">
            <iframe
              title={t('map.title')}
              src={MAP_SRC}
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'grayscale(40%) invert(90%) hue-rotate(180deg) brightness(90%) contrast(95%)' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            <div className="pointer-events-none absolute left-5 top-5 flex items-center gap-2 border border-base-50/15 bg-industrial-950/85 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-base-50/90">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember-600 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-ember-600" />
              </span>
              {t('info.addressLabel')}
            </div>

            <div className="pointer-events-none absolute bottom-5 left-5 font-mono text-[11px] text-base-50/60">
              {LAT.toFixed(4)}° N, {LNG.toFixed(4)}° E
            </div>
          </div>

          <div className="relative flex flex-col justify-center border border-base-50/10 bg-industrial-800 p-8">
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-ember-600" />

            <span className="font-mono text-xs uppercase tracking-[0.25em] text-ember-600">{t('closing.eyebrow')}</span>
            <h2 className="mt-3 font-heading text-xl font-bold text-base-50 md:text-2xl">{t('closing.title')}</h2>
            <p className="mt-3 text-sm text-neutral-custom-300">{ADDRESS}</p>

            <div className="mt-6 flex flex-col gap-4 border-t border-base-50/10 pt-6">
              <a
                href={PHONES[0].href}
                className="group flex items-center gap-2 font-heading font-semibold text-base-50 transition-colors hover:text-ember-600"
              >
                <Phone size={16} className="text-ember-600" />
                {PHONES[0].display}
                <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </a>
              <a
                href={`mailto:${EMAIL}`}
                className="group flex items-center gap-2 font-heading font-semibold text-base-50 transition-colors hover:text-ember-600"
              >
                <Mail size={16} className="text-ember-600" />
                {EMAIL}
                <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
