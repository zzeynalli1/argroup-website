// Azerbaijani letters that don't map to ASCII under a plain NFKD strip —
// handled explicitly before the generic diacritic-strip pass below.
const AZ_TRANSLITERATION = {
  ə: 'e', ı: 'i', ö: 'o', ü: 'u', ç: 'c', ş: 's', ğ: 'g',
  Ə: 'e', İ: 'i', I: 'i', Ö: 'o', Ü: 'u', Ç: 'c', Ş: 's', Ğ: 'g',
}

const COMBINING_MARKS = new RegExp('[̀-ͯ]', 'g')

/**
 * "Ritz Carlton Hotel Baku" -> "ritz-carlton-hotel-baku"
 * Used to propose a slug from a new project's title — admin can still
 * edit the result before saving (see ProjectFormModal).
 */
export function slugify(input) {
  if (!input) return ''

  const transliterated = input
    .split('')
    .map((ch) => AZ_TRANSLITERATION[ch] ?? ch)
    .join('')

  return transliterated
    .toLowerCase()
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
