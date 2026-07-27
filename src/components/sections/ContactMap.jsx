import { useTranslation } from '../../lib/i18n/useTranslation'

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
const MAP_SRC = 'https://www.google.com/maps?q=40.3821575,49.8759006&z=15&output=embed'

export default function ContactMap() {
  const { t } = useTranslation('contact')

  return (
    <section className="w-full max-w-7xl mx-auto px-6 pb-16 md:pb-24">
      <div className="w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden border border-neutral-custom-400/20">
        <iframe
          title={t('map.title')}
          src={MAP_SRC}
          width="100%"
          height="100%"
          style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </section>
  )
}
