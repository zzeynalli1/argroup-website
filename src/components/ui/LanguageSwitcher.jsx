import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from '../../lib/i18n/useTranslation'
import { SUPPORTED_LOCALES } from '../../lib/i18n/resources'

// Plain codes rather than flag emojis — flags map to countries, not
// languages (which UK/US flag for "EN"?), and codes read as more
// professional for a B2B industrial site anyway.
const LOCALE_LABELS = { az: 'AZ', en: 'EN', ru: 'RU', tr: 'TR' }

export default function LanguageSwitcher() {
  // Namespace choice is arbitrary here — this component only needs
  // locale/setLocale from context, not any translated string.
  const { locale, setLocale } = useTranslation('nav')
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function onClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1 text-sm font-medium text-industrial-950 hover:text-ember-600 transition-colors"
      >
        {LOCALE_LABELS[locale]}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 mt-2 w-20 rounded-md border border-neutral-custom-400/20 bg-base-50 shadow-lg overflow-hidden z-50"
        >
          {SUPPORTED_LOCALES.map((code) => (
            <li key={code}>
              <button
                type="button"
                role="option"
                aria-selected={locale === code}
                onClick={() => {
                  setLocale(code)
                  setOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  locale === code
                    ? 'bg-ember-600/10 text-ember-600 font-semibold'
                    : 'text-industrial-800 hover:bg-neutral-custom-400/10'
                }`}
              >
                {LOCALE_LABELS[code]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
