import { useEffect, useMemo, useState } from 'react'
import { I18nContext } from './context'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './resources'

const STORAGE_KEY = 'firestop-locale'

function getInitialLocale() {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return SUPPORTED_LOCALES.includes(stored) ? stored : DEFAULT_LOCALE
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(getInitialLocale)

  function setLocale(next) {
    if (!SUPPORTED_LOCALES.includes(next)) return
    setLocaleState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }

  // Keep the document's lang attribute in sync for accessibility/SEO.
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo(() => ({ locale, setLocale }), [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
