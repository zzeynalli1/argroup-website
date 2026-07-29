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
 * Both modes default to the same height (h-10) so the header layout
 * doesn't shift depending on which one renders. Callers that need a
 * different size pass a `h-*` class via `className` — that class is
 * appended *after* the default so it wins outright (two same-utility
 * classes in one string don't reliably override by source order with
 * Tailwind, see Button.jsx's variant comment), rather than being combined
 * with the default the way plain string concatenation would.
 *
 * `inverted` swaps the text-fallback colors for use on dark backgrounds
 * (e.g. the Footer) — the default colors assume a light backdrop like the
 * Header. This is an explicit prop rather than Tailwind's `dark:` variant
 * because `dark:` tracks the OS color-scheme preference, not which section
 * background the logo happens to sit on.
 *
 * `showBackground` wraps the logo in a light, rounded "patch" card. The
 * real logo.png bakes its wordmark in as solid black pixels (only the
 * background is transparent), so on a dark section it's nearly invisible —
 * `inverted` can't fix that because it only affects the text-fallback SVG
 * text, not fixed raster pixels. Pass this on any dark-background usage
 * (Header, Footer); leave it off on light backgrounds where the logo
 * already has enough contrast on its own.
 */
const LOGO_IMAGE_PATH = '/logo.png'

export default function Logo({ className = '', inverted = false, showBackground = false }) {
  const [imageAvailable, setImageAvailable] = useState(true)
  const height = className.match(/(^|\s)h-\S+/)?.[0].trim() || 'h-10'
  const rest = className.replace(/(^|\s)h-\S+/, '').trim()

  // The patch is always light, so text-fallback mode must render its dark
  // (non-inverted) colors even when the caller also passed `inverted` for
  // the surrounding dark section.
  const onLightBackground = showBackground || !inverted

  const inner = imageAvailable ? (
    <img
      src={LOGO_IMAGE_PATH}
      alt="AR Group Construction Services"
      className={`${height} w-auto object-contain ${rest}`}
      onError={() => setImageAvailable(false)}
    />
  ) : (
    <div className={`${height} flex flex-col justify-center leading-none ${rest}`}>
      <span className="text-2xl font-bold tracking-tight">
        <span className="text-ember-600">AR</span>
        <span className={onLightBackground ? 'text-industrial-950' : 'text-base-50'}>Group</span>
      </span>
      <span
        className={`text-[10px] tracking-[0.2em] uppercase mt-0.5 ${
          onLightBackground ? 'text-neutral-custom-600' : 'text-neutral-custom-400'
        }`}
      >
        Construction Services
      </span>
    </div>
  )

  if (!showBackground) return inner

  return <div className="inline-flex items-center rounded-lg bg-base-50/95 p-2.5 shadow-md">{inner}</div>
}
