import { Award, Lock, Shield, Users } from 'lucide-react'
import { useTranslation } from '../../lib/i18n/useTranslation'

const VALUE_ITEMS = [
  { key: 'quality', Icon: Award },
  { key: 'professionalism', Icon: Shield },
  { key: 'personnel', Icon: Users },
  { key: 'privacy', Icon: Lock },
]

const WALL_IMAGE = '/images/values/Untitled design.webp'

/** Original dark graphite value card, unchanged — restored as-is on request. */
function ValueCard({ item, t }) {
  const Icon = item.Icon
  return (
    <div className="group flex flex-col gap-3 rounded-[10px] border border-white/10 bg-industrial-950 p-5 transition-all duration-200 hover:-translate-y-[3px] hover:border-ember-600/50 lg:p-6">
      <Icon
        size={26}
        strokeWidth={1.5}
        className="text-ember-600 transition-transform duration-200 group-hover:-translate-y-0.5"
      />
      <h3 className="font-heading text-base font-bold text-base-50">{t(`values.items.${item.key}.title`)}</h3>
      <p className="text-sm leading-relaxed text-neutral-custom-400">
        {t(`values.items.${item.key}.description`)}
      </p>
    </div>
  )
}

function ValuesList({ t }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {VALUE_ITEMS.map((item) => (
        <ValueCard key={item.key} item={item} t={t} />
      ))}
    </div>
  )
}

/**
 * Values section — built around the real AR Group badge photo (shield/team
 * graphic on concrete, left) as the section's full visual foundation rather
 * than a small illustration. `object-position: left` on both layouts keeps
 * the badge graphic anchored to the frame's left edge on purpose: at cover
 * scale, "left" is the one axis where the crop is guaranteed to eat into
 * the plain light-concrete negative space on the right instead of the
 * badge itself (see the object-fit:cover math this was checked against —
 * whichever axis doesn't drive the scale is the one that gets cropped).
 *
 * Desktop: full-bleed image, values content anchored to the image's own
 * light right-hand negative space — no separate panel/card sits on top of
 * it. Mobile/tablet: the same image stacks above the content (badge first,
 * full width, same left anchor) since there's no room to overlay text on
 * the image without covering the badge.
 */
export default function AboutStory() {
  const { t } = useTranslation('about')

  return (
    <section className="relative overflow-hidden">
      {/* Desktop: image is the section background; content overlays its right side */}
      <div className="relative hidden lg:block lg:h-[720px]">
        <img
          src={WALL_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: 'left center' }}
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto flex w-full max-w-7xl px-6">
            <div className="ml-auto w-full max-w-lg xl:max-w-xl">
              <span aria-hidden="true" className="mb-5 block h-0.5 w-9 bg-ember-600" />
              <h2 className="font-heading text-3xl font-bold leading-tight text-industrial-950 xl:text-4xl">
                {t('values.heading')}
              </h2>
              <div className="mt-8">
                <ValuesList t={t} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/tablet: badge stacked above content instead of overlaid */}
      <div className="lg:hidden">
        <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/9]">
          <img
            src={WALL_IMAGE}
            alt=""
            className="h-full w-full object-cover"
            style={{ objectPosition: 'left center' }}
            loading="lazy"
          />
        </div>
        <div className="bg-concrete-100 px-6 py-10 sm:px-10">
          <span aria-hidden="true" className="mb-5 block h-0.5 w-9 bg-ember-600" />
          <h2 className="font-heading text-3xl font-bold leading-tight text-industrial-950">
            {t('values.heading')}
          </h2>
          <div className="mt-8">
            <ValuesList t={t} />
          </div>
        </div>
      </div>
    </section>
  )
}
