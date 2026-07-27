/**
 * Shared button component. Styling is intentionally minimal placeholder
 * for now — final look/hover states come with the design pass.
 *
 * `variant` picks a full color set instead of letting callers pass
 * conflicting background utility classes via `className` — with Tailwind,
 * two `bg-*` classes in the same string don't reliably override by
 * attribute order, so variants keep that deterministic.
 *
 * @param {{ children: React.ReactNode, onClick?: () => void, type?: 'button'|'submit'|'reset', variant?: 'industrial'|'ember', className?: string }} props
 */
const VARIANTS = {
  industrial: 'bg-industrial-950 text-base-50 hover:bg-industrial-800',
  ember: 'bg-ember-600 text-base-50 hover:bg-ember-800',
}

export default function Button({ children, onClick, type = 'button', variant = 'industrial', className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center justify-center px-6 py-3 rounded-md transition-colors ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
