// Shared browser-side image normalization for every CMS uploader
// (brands/partners/customers/team/awards/projects/products) — converts a
// JPEG/PNG File to a genuine WebP File via <canvas> before it ever reaches
// Supabase Storage, so Storage only ever holds optimized, website-ready
// images. No external image-processing API/key is involved; this runs
// entirely client-side. Callers run their own MIME allowlist check first
// (each module's own `validate*File`) — this module only ever receives
// already-accepted image types, and only ever touches JPEG/PNG/WebP.
//
// SVG is deliberately NEVER passed through here — no CMS uploader in this
// codebase accepts image/svg+xml today (every `ALLOWED_IMAGE_TYPES` list is
// webp/jpeg/png only), so there is currently no SVG logo behavior to
// preserve. If a module is ever extended to accept SVG, it must keep
// uploading the original SVG unconverted (vector logos must never be
// rasterized into a lossy WebP) — do not route SVG through `toWebpForUpload`.

const CONVERTIBLE_TYPES = ['image/jpeg', 'image/png']

// Sensible visual quality per the approved spec — good size/quality
// tradeoff for web delivery, not tuned per-module.
export const WEBP_QUALITY = 0.85

/**
 * Decodes `file` enough to confirm it's a real, loadable image (rejects
 * corrupt files or files mislabeled with an image MIME type) and returns the
 * ImageBitmap. Throws a user-facing (Azerbaijani) error otherwise.
 */
async function decodeOrThrow(file) {
  try {
    return await createImageBitmap(file)
  } catch {
    throw new Error('Şəkil oxuna bilmədi və ya format dəstəklənmir.')
  }
}

/**
 * Converts a JPEG/PNG File into a real WebP File, preserving original
 * dimensions (no resizing) and alpha transparency (the canvas starts fully
 * transparent and is never filled with an opaque background before drawing
 * — required for logo uploads). WebP input is only decode-validated and
 * passed through unchanged — re-encoding an already-WebP file would just be
 * a second lossy pass for no benefit. Any other type (already filtered out
 * by the caller's own MIME allowlist in practice) is returned as-is.
 *
 * ImageBitmap/canvas resources are always released, including on failure.
 */
export async function toWebpForUpload(file, quality = WEBP_QUALITY) {
  if (file.type === 'image/webp') {
    const bitmap = await decodeOrThrow(file)
    bitmap.close()
    return file
  }

  if (!CONVERTIBLE_TYPES.includes(file.type)) {
    return file
  }

  const bitmap = await decodeOrThrow(file)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(bitmap, 0, 0)

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error('Şəkil WebP formatına çevrilə bilmədi.'))),
        'image/webp',
        quality,
      )
    })

    const baseName = file.name.replace(/\.[^./]+$/, '') || 'image'
    return new File([blob], `${baseName}.webp`, { type: 'image/webp' })
  } finally {
    bitmap.close()
  }
}
