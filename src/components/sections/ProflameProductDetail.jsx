/**
 * Right-column detail panel shown when one of the real Proflame products is
 * selected in the Firestop grid (see ExpandedProductCategory.jsx) — same
 * approved panel slot/width as the generic ProductDetail, just with a real
 * photo, a mini-gallery of its CMS-fetched siblings (`family` — every
 * product in this category sharing the Proflame brand, not a hardcoded
 * count), and the shared Proflame family copy (brand/description/link are
 * identical across the family today, so they render from whichever
 * product is selected rather than per-product). Clicking a thumbnail calls
 * the parent's `onSelect(slug)` — the same setter the left grid tiles use —
 * so the grid's red border and this panel's image/name always stay in sync.
 * Kept intentionally compact (image, name, short description, brand, link)
 * — no feature list, per the approved simplification pass.
 */
import { isHttpUrl } from '../../lib/cms/urlValidation'

export default function ProflameProductDetail({ material, family, selectedSlug, onSelect, t }) {
  return (
    <div className="border border-ember-600/40 bg-industrial-950 p-5 md:p-6">
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden border border-white/10 bg-industrial-900 p-5">
        <span aria-hidden="true" className="absolute left-2 top-2 h-3 w-3 border-l border-t border-white/20" />
        <span aria-hidden="true" className="absolute bottom-2 right-2 h-3 w-3 border-b border-r border-white/20" />
        <img src={material.image} alt={material.name} className="max-h-full max-w-full object-contain" />
      </div>

      <div className="mt-3 flex gap-2">
        {family.map((product) => (
          <button
            key={product.slug}
            type="button"
            onClick={() => onSelect(product.slug)}
            aria-label={product.name}
            aria-current={product.slug === selectedSlug}
            className={`relative h-12 w-12 shrink-0 overflow-hidden border bg-industrial-900 transition-colors duration-200 ${
              product.slug === selectedSlug ? 'border-ember-600' : 'border-white/10 hover:border-ember-600/60'
            }`}
          >
            <img src={product.image} alt="" aria-hidden="true" className="h-full w-full object-contain p-1" />
          </button>
        ))}
      </div>

      <h3 className="mt-5 font-heading text-lg font-bold text-base-50 md:text-xl">{material.name}</h3>

      {material.description && <p className="mt-3 text-sm text-neutral-custom-300">{material.description}</p>}

      <dl className="mt-5 space-y-2.5 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between gap-3">
          <dt className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-custom-400">{t('brandFilter.label')}</dt>
          <dd className="font-mono text-xs uppercase tracking-[0.2em] text-ember-600">{material.brand}</dd>
        </div>
        {material.externalLink && isHttpUrl(material.externalLink) && (
          <div className="flex items-center justify-between gap-3">
            <dt className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-custom-400">{t('proflame.linkLabel')}</dt>
            <dd className="min-w-0">
              <a
                href={material.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate font-mono text-xs uppercase tracking-[0.2em] text-ember-600 underline-offset-4 hover:underline"
              >
                {material.externalLink.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            </dd>
          </div>
        )}
      </dl>
    </div>
  )
}
