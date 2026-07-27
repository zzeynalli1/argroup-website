import { useState } from 'react'

/**
 * Logo — works in two modes:
 *  1. Image mode: if /public/logo.png (LOGO_IMAGE_PATH) exists, render it.
 *  2. Text fallback: otherwise render the text-based "AR Group" wordmark.
 *
 * Practical upshot: drop a logo.png into /public and it's picked up
 * automatically, no code changes needed. Detection works by attempting to
 * load the image and falling back to text on error (a browser <img> can't
 * synchronously check filesystem existence).
 *
 * Both modes are sized to the same height (h-10) so the header layout
 * doesn't shift depending on which one renders.
 *
 * `inverted` swaps the text-fallback colors for use on dark backgrounds
 * (e.g. the Footer) — the default colors assume a light backdrop like the
 * Header. This is an explicit prop rather than Tailwind's `dark:` variant
 * because `dark:` tracks the OS color-scheme preference, not which section
 * background the logo happens to sit on.
 */
const LOGO_IMAGE_PATH = '/logo.png'

export default function Logo({ className = '', inverted = false }) {
  const [imageAvailable, setImageAvailable] = useState(true)

  if (imageAvailable) {
    return (
      <img
        src={LOGO_IMAGE_PATH}
        alt="AR Group Construction Services"
        className={`h-10 w-auto object-contain ${className}`}
        onError={() => setImageAvailable(false)}
      />
    )
  }

  return (
    <div className={`h-10 flex flex-col justify-center leading-none ${className}`}>
      <span className="text-2xl font-bold tracking-tight">
        <span className="text-ember-600">AR</span>
        <span className={inverted ? 'text-base-50' : 'text-industrial-950'}>Group</span>
      </span>
      <span
        className={`text-[10px] tracking-[0.2em] uppercase mt-0.5 ${
          inverted ? 'text-neutral-custom-400' : 'text-neutral-custom-600'
        }`}
      >
        Construction Services
      </span>
    </div>
  )
}
