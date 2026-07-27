import { partners, customers } from '../../data/partners'
import { useTranslation } from '../../lib/i18n/useTranslation'

function MarqueeRow({ items }) {
  // Rendered twice back-to-back so the track can loop by translating
  // exactly -50% — see the .animate-marquee keyframes in index.css.
  const track = [...items, ...items]

  return (
    <div className="group overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className="flex w-max animate-marquee gap-16 will-change-transform group-hover:[animation-play-state:paused]">
        {track.map((name, index) => (
          <span
            key={`${name}-${index}`}
            className="shrink-0 whitespace-nowrap font-heading text-sm uppercase tracking-[0.2em] text-neutral-custom-400 transition-colors duration-200 hover:text-ember-600"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  )
}

function CustomerCard({ name }) {
  return (
    <div className="group flex aspect-square items-center justify-center rounded-lg border border-neutral-custom-400/20 bg-industrial-800 p-4 text-center transition-all duration-200 hover:scale-105 hover:border-ember-600 hover:shadow-lg">
      <span className="font-heading text-sm text-neutral-custom-400 transition-colors duration-200 group-hover:text-base-50">
        {name}
      </span>
    </div>
  )
}

export default function PartnersMarquee() {
  const { t } = useTranslation('home')

  return (
    <section className="bg-industrial-950 py-16 md:py-20">
      <h2 className="mb-8 text-center font-heading text-2xl font-bold text-base-50 md:text-3xl">
        {t('partnersMarquee.partnersTitle')}
      </h2>

      <MarqueeRow items={partners} />

      <div className="mx-auto max-w-7xl px-6 pt-12 md:pt-16">
        <h2 className="mb-8 text-center font-heading text-2xl font-bold text-base-50 md:text-3xl">
          {t('partnersMarquee.customersTitle')}
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {customers.map((name) => (
            <CustomerCard key={name} name={name} />
          ))}
        </div>
      </div>
    </section>
  )
}
