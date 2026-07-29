/**
 * Tailwind CSS configuration.
 * Loaded into the v4 pipeline via `@config` in src/index.css.
 * Only the design-system color palette is defined here for now —
 * spacing/typography/etc. can be extended later as the real design lands.
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        industrial: {
          950: '#141414',
          // Mid-dark tone for full-width sections that need to read as dark
          // without repeating the hero's near-black 950 — see CLAUDE.md's
          // "dark/light rhythm" note.
          900: '#1F2224',
          800: '#2B2E33',
          // One step lighter than 800 — used by Footer so it reads as dark
          // without matching the heavier full-width dark sections above it.
          700: '#33363A',
        },
        base: {
          50: '#FFFFFF',
          100: '#F7F6F3',
        },
        ember: {
          600: '#E31E24',
          800: '#B01419',
          900: '#7A0E13',
        },
        amber: {
          500: '#E8A33D',
        },
        // Explicit success/protected-state green — added because Hero's
        // protected-side indicator needs a real contrast color against
        // ember-600's danger red (unlike other cases, green was explicitly
        // requested here, not offered as a neutral alternative).
        success: {
          500: '#2F9E44',
          600: '#237A34',
        },
        'neutral-custom': {
          // Lighter step added for body copy on the industrial-800 Footer,
          // where 400 no longer had enough contrast once the background
          // moved off industrial-950.
          300: '#A8ACB0',
          400: '#9CA0A5',
          600: '#6B7075',
        },
      },
    },
  },
  plugins: [],
}
