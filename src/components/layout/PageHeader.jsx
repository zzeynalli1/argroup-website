import { Link } from 'react-router-dom'
import BlueprintPattern from '../ui/BlueprintPattern'

/**
 * Small banner used at the top of inner pages (About, Services, Contact).
 * Deliberately not used on Home — Home has its own Hero section instead.
 */
export default function PageHeader({ title, breadcrumbLabel, subtitle }) {
  return (
    <section className="relative bg-industrial-800 text-base-50 pt-28 pb-10 md:pt-32 md:pb-12 overflow-hidden">
      <BlueprintPattern
        className="hidden md:block absolute right-8 top-1/2 -translate-y-1/2 w-56 h-44 text-neutral-custom-400 opacity-[0.18] pointer-events-none"
      />

      <div className="relative max-w-7xl mx-auto px-6">
        <nav className="text-sm text-neutral-custom-400" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-ember-600 transition-colors">
            Ana səhifə
          </Link>
          <span className="mx-2">/</span>
          <span className="text-base-50">{breadcrumbLabel}</span>
        </nav>

        <div className="mt-4 flex items-stretch gap-4">
          <span className="w-1 bg-amber-500 shrink-0" />
          <h1 className="font-heading font-bold text-3xl md:text-5xl">{title}</h1>
        </div>

        {subtitle && <p className="mt-4 text-neutral-custom-400 max-w-xl">{subtitle}</p>}
      </div>
    </section>
  )
}
