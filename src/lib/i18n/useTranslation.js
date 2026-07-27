import { useContext } from 'react'
import { I18nContext } from './context'
import { resources, FALLBACK_LOCALE } from './resources'

function resolvePath(obj, path) {
  return path.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), obj)
}

/**
 * useTranslation('home') -> { t, locale, setLocale }
 *
 * t('hero.title') resolves the dot-path inside the current locale's
 * namespace JSON. Only `az` has real placeholder copy right now — en/ru/tr
 * files exist with the same key structure but empty leaf values, so t()
 * falls back to FALLBACK_LOCALE ('az') whenever the current locale's value
 * is missing/empty rather than rendering blank text.
 */
export function useTranslation(namespace) {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useTranslation must be used within an I18nProvider')
  }

  const { locale, setLocale } = ctx

  function t(key) {
    const current = resolvePath(resources[locale]?.[namespace], key)
    if (current) return current

    const fallback = resolvePath(resources[FALLBACK_LOCALE]?.[namespace], key)
    return fallback ?? key
  }

  return { t, locale, setLocale }
}
