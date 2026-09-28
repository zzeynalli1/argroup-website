import { Award } from 'lucide-react'
import { useAwards } from '../../hooks/useAwards'
import { useTranslation } from '../../lib/i18n/useTranslation'

/** Ghost-number + title/metadata row, same large-faded-number treatment as
 * WhyFirestop.jsx's ReasonColumn — reused here as a divided list instead of
 * a 4-up grid since awards are a variable-length list, not a fixed set. */
function AwardRow({ award, index }) {
  const number = String(index + 1).padStart(2, '0')

  return (
    <div className="flex flex-col gap-3 border-b border-white/10 py-6 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-8 md:py-8">
      <div className="flex items-start gap-4 sm:gap-5">
        <span
          aria-hidden="true"
          className="shrink-0 font-heading text-3xl font-bold leading-none text-ember-600/25 md:text-4xl"
        >
          {number}
        </span>
        <div>
          <h3 className="font-heading text-lg font-bold leading-snug text-base-50 md:text-xl">{award.title}</h3>
          {award.description && (
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-neutral-custom-400">{award.description}</p>
          )}
        </div>
      </div>

      {(award.organization || award.year) && (
        <div className="flex shrink-0 items-center gap-3 pl-[52px] font-mono text-xs uppercase tracking-[0.15em] text-neutral-custom-400 sm:pl-0">
          {award.organization && <span>{award.organization}</span>}
          {award.organization && award.year && (
            <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-neutral-custom-400/40" />
          )}
          {award.year && <span>{award.year}</span>}
        </div>
      )}
    </div>
  )
}

/**
 * Awards/recognition section. Sourced from Supabase (`useAwards`) — the
 * `awards` table is intentionally empty until a real, verified AR Group
 * award is confirmed and added via the admin (see
 * docs/argroup-knowledge-base.md, "Known Gaps": the live /rewards page
 * lists no actual award names/bodies/years despite a "100 awards" stat
 * being claimed elsewhere on the original site — see CLAUDE.md content
 * rules). Zero published rows renders a minimal "not yet available" state
 * instead of fabricating cards; loading renders a restrained spinner
 * instead of nothing so the section doesn't visibly pop in.
 *
 * Dark (industrial-800) section deliberately placed between the two light
 * sections either side of it (AboutStory / TeamTree) to keep the page's
 * light/dark rhythm from running three light sections in a row.
 */
export default function AboutAwards() {
  const { t, locale } = useTranslation('about')
  const { awards, loading } = useAwards(locale)

  return (
    <section className="relative overflow-hidden bg-industrial-800 py-14 md:py-20">
      <div className="relative mx-auto max-w-5xl px-6">
        <span className="mb-5 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-neutral-custom-400">
          <span aria-hidden="true" className="h-px w-8 bg-neutral-custom-400/40" />
          {t('awards.eyebrow')}
        </span>
        <h2 className="font-heading text-2xl font-bold leading-tight text-base-50 md:text-3xl">{t('awards.title')}</h2>
        <span aria-hidden="true" className="mt-4 block h-0.5 w-10 bg-ember-600" />

        {loading ? (
          <div className="mt-10 flex min-h-[120px] items-center justify-center">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/15 border-t-ember-600" />
          </div>
        ) : awards.length > 0 ? (
          <div className="mt-10">
            {awards.map((award, index) => (
              <AwardRow key={award.id} award={award} index={index} />
            ))}
          </div>
        ) : (
          <div className="mt-10 flex items-center gap-3 border border-dashed border-white/15 px-6 py-8 text-sm text-neutral-custom-400">
            <Award size={18} strokeWidth={1.5} className="shrink-0" />
            {t('awards.empty')}
          </div>
        )}
      </div>
    </section>
  )
}
