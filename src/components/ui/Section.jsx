/**
 * Shared section wrapper: consistent max-width and vertical/horizontal
 * padding for every page section. Pass `id` for in-page anchor links
 * and `className` for section-specific overrides.
 *
 * @param {{ children: React.ReactNode, id?: string, className?: string }} props
 */
export default function Section({ children, id, className = '' }) {
  return (
    <section id={id} className={`w-full max-w-7xl mx-auto px-6 py-16 md:py-24 ${className}`}>
      {children}
    </section>
  )
}
