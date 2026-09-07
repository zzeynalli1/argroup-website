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
      // Whole-site copy bumped 10% over Tailwind's default type scale (base
      // 1rem -> 1.1rem, etc.), line-heights scaled to match so leading
      // rhythm stays proportional. Micro/technical mono labels (11px
      // uppercase tags) intentionally use arbitrary text-[Npx] values and
      // sit outside this scale.
      fontSize: {
        xs: ['0.825rem', { lineHeight: '1.1rem' }],
        sm: ['0.9625rem', { lineHeight: '1.375rem' }],
        base: ['1.1rem', { lineHeight: '1.65rem' }],
        lg: ['1.2375rem', { lineHeight: '1.925rem' }],
        xl: ['1.375rem', { lineHeight: '1.925rem' }],
        '2xl': ['1.65rem', { lineHeight: '2.2rem' }],
        '3xl': ['2.0625rem', { lineHeight: '2.475rem' }],
        '4xl': ['2.475rem', { lineHeight: '2.75rem' }],
        '5xl': ['3.3rem', { lineHeight: '1' }],
        '6xl': ['4.125rem', { lineHeight: '1' }],
        '7xl': ['4.95rem', { lineHeight: '1' }],
        '8xl': ['6.6rem', { lineHeight: '1' }],
        '9xl': ['8.8rem', { lineHeight: '1' }],
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        // Reserved for micro typography only (section numbers, technical
        // labels, metadata) — never headings/body/nav/buttons. System stack
        // on purpose: no extra font download for what's a small accent.
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'],
      },
      colors: {
        // Light architectural-grey surfaces, one step of depth beyond
        // base-100 — for panel/section layering without going dark or
        // beige. 300 is for borders/technical-panel fills, not large fills.
        concrete: {
          100: '#F0F0EE',
          200: '#E2E2DE',
          300: '#C7C6C0',
        },
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
        // Restrained warm-metal/taupe secondary accent — About page only,
        // for tiny technical markers/lines/metadata. Never large fills, and
        // never a substitute for ember as the primary brand accent.
        metal: {
          500: '#9A8372',
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
