import { customers } from '../../data/customers'
import { partners } from '../../data/partners'
import { useTranslation } from '../../lib/i18n/useTranslation'

// Stat tile slots (0-indexed) across the 21-cell grid (18 customers + 3
// stats, 5 columns on desktop) — spread across different rows AND columns
// (row1/col4, row2/col5, row4/col2) so the three dark tiles read as
// scattered accents rather than lining up into a single vertical stripe.
const STAT_POSITIONS = [3, 9, 16]

function CustomerCell({ logoSrc }) {
  return (
    <div className="group relative flex items-center justify-center p-6 text-center transition-transform duration-300 hover:-translate-y-1 sm:p-8">
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-custom-400/40 transition-all duration-300 group-hover:bg-ember-600 group-hover:shadow-[0_0_10px_3px_rgba(227,30,36,0.5)]"
      />
      <img src={logoSrc} alt="Logo" className="max-h-16 w-auto object-contain" loading="lazy" />
    </div>
  )
}

function StatCell({ value, label }) {
  return (
    <div className="relative flex flex-col items-center justify-center gap-1 bg-industrial-950 p-6 text-center sm:p-8">
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember-600"
      />
      <span className="font-heading text-3xl font-bold text-ember-600 md:text-4xl">{value}+</span>
      <span className="text-xs uppercase tracking-[0.15em] text-neutral-custom-400">{label}</span>
    </div>
  )
}

export default function CustomersSection() {
  const { t } = useTranslation('home')

  const stats = [
    { key: 'stat-partners', value: partners.length, label: t('customersSection.stats.partners') },
    { key: 'stat-customers', value: customers.length, label: t('customersSection.stats.customers') },
    // Matches the count of captured projects in src/data/projects.js — see
    // docs/argroup-knowledge-base.md for the caveat that the live site
    // reports higher, unverified totals.
    { key: 'stat-projects', value: 20, label: t('customersSection.stats.projects') },
  ]

  const gridItems = []
  let customerIndex = 0
  for (let i = 0; i < customers.length + stats.length; i++) {
    const statSlot = STAT_POSITIONS.indexOf(i)
    if (statSlot !== -1) {
      gridItems.push({ type: 'stat', ...stats[statSlot] })
    } else {
      gridItems.push({ type: 'customer', logoSrc: customers[customerIndex] })
      customerIndex += 1
    }
  }

  return (
    <section className="bg-base-50 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-3 block font-heading text-xs font-semibold uppercase tracking-[0.2em] text-ember-600">
            {t('customersSection.label')}
          </span>
          <h2 className="font-heading text-3xl font-bold text-industrial-950 md:text-4xl">
            {t('customersSection.title')}
          </h2>
          <p className="mt-4 text-neutral-custom-600">{t('customersSection.subtitle')}</p>
        </div>

        <div className="mt-12 grid grid-cols-2 divide-x divide-y divide-neutral-custom-400/20 border border-neutral-custom-400/20 sm:grid-cols-3 lg:grid-cols-5">
          {gridItems.map((item) =>
            item.type === 'stat' ? (
              <StatCell key={item.key} value={item.value} label={item.label} />
            ) : (
              <CustomerCell key={item.logoSrc} logoSrc={item.logoSrc} />
            ),
          )}
        </div>
      </div>
    </section>
  )
}
