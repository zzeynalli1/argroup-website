import { useEffect, useRef, useState } from 'react'
import { Check, RotateCcw, X, ZoomIn } from 'lucide-react'
import { WEBP_QUALITY } from '../../lib/cms/imageOptimization'

const VIEWPORT_WIDTH = 380
const MAX_OUTPUT_DIM = 1600 // long edge cap — never upscales past the source, just avoids uploading unnecessarily huge crops
const MIN_ZOOM = 1
const MAX_ZOOM = 3

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/**
 * Shared admin image positioning UI, used in front of every module's
 * existing upload pipeline (see imageOptimization.js's toWebpForUpload,
 * unchanged) — this component only ever hands that pipeline a File, exactly
 * like a raw <input type="file"> selection did before.
 *
 * mode="crop": drag-to-reposition + zoom against a fixed-aspect frame,
 * confirms by rendering the visible region to a real WebP File (genuine
 * conversion, quality matches the existing WEBP_QUALITY constant — no
 * separate quality value invented here).
 *
 * mode="preview": non-destructive contain-fit preview for logo modules
 * (Brands/Partners/Customers) — never modifies pixels, Confirm just passes
 * the original file straight through. See the task's own guardrail: never
 * force destructive cropping on a logo.
 */
export default function ImageCropModal({ file, aspectRatio, mode, onConfirm, onCancel }) {
  // Create and revoke inside the SAME effect (not create-in-useMemo +
  // revoke-in-a-separate-effect) — this component mounts already holding a
  // real `file` on its very first render, which is exactly the case React's
  // StrictMode dev-only double-invoke (setup -> cleanup -> setup again)
  // trips up: a split create/revoke leaves the URL revoked with nothing
  // re-creating it. Pairing create+revoke in one effect means the
  // double-invoke just produces a second, still-valid blob URL.
  const [objectUrl, setObjectUrl] = useState(null)
  useEffect(() => {
    const url = URL.createObjectURL(file)
    // Registering render's view of an external resource this effect itself
    // owns the lifecycle of (create here, revoke in this same cleanup) —
    // not derivable during render, and splitting it into a memo+effect pair
    // is exactly what breaks under StrictMode (see comment above).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setObjectUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const imgElRef = useRef(null)
  const [naturalSize, setNaturalSize] = useState(null)
  const [zoom, setZoom] = useState(MIN_ZOOM)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragState = useRef(null)

  const viewportHeight = VIEWPORT_WIDTH / aspectRatio
  const baseScale = naturalSize
    ? Math.max(VIEWPORT_WIDTH / naturalSize.width, viewportHeight / naturalSize.height)
    : 1
  const displayScale = baseScale * zoom
  const displayWidth = naturalSize ? naturalSize.width * displayScale : 0
  const displayHeight = naturalSize ? naturalSize.height * displayScale : 0

  function clampOffset(next, width = displayWidth, height = displayHeight) {
    const minX = Math.min(0, VIEWPORT_WIDTH - width)
    const minY = Math.min(0, viewportHeight - height)
    return { x: clamp(next.x, minX, 0), y: clamp(next.y, minY, 0) }
  }

  function handleImageLoad() {
    const el = imgElRef.current
    if (!el) return
    const width = el.naturalWidth
    const height = el.naturalHeight
    setNaturalSize({ width, height })
    const scale = Math.max(VIEWPORT_WIDTH / width, viewportHeight / height)
    const w = width * scale
    const h = height * scale
    setOffset({ x: (VIEWPORT_WIDTH - w) / 2, y: (viewportHeight - h) / 2 })
  }

  function handlePointerDown(event) {
    if (mode !== 'crop') return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragState.current = { startX: event.clientX, startY: event.clientY, offset }
    setIsDragging(true)
  }

  function handlePointerMove(event) {
    if (mode !== 'crop' || !dragState.current) return
    const { startX, startY, offset: startOffset } = dragState.current
    const next = { x: startOffset.x + (event.clientX - startX), y: startOffset.y + (event.clientY - startY) }
    setOffset(clampOffset(next))
  }

  function handlePointerUp(event) {
    if (mode !== 'crop') return
    dragState.current = null
    setIsDragging(false)
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // no-op — pointer capture may already be released
    }
  }

  function handleZoomChange(event) {
    const nextZoom = Number(event.target.value)
    setZoom(nextZoom)
    const scale = baseScale * nextZoom
    const w = naturalSize.width * scale
    const h = naturalSize.height * scale
    setOffset((prev) => clampOffset(prev, w, h))
  }

  function handleReset() {
    setZoom(MIN_ZOOM)
    const w = naturalSize.width * baseScale
    const h = naturalSize.height * baseScale
    setOffset({ x: (VIEWPORT_WIDTH - w) / 2, y: (viewportHeight - h) / 2 })
  }

  async function handleConfirm() {
    if (mode === 'preview') {
      onConfirm(file)
      return
    }

    const sx = clamp(-offset.x / displayScale, 0, naturalSize.width)
    const sy = clamp(-offset.y / displayScale, 0, naturalSize.height)
    const sw = Math.min(VIEWPORT_WIDTH / displayScale, naturalSize.width - sx)
    const sh = Math.min(viewportHeight / displayScale, naturalSize.height - sy)

    const outputScale = Math.min(1, MAX_OUTPUT_DIM / sw)
    const outW = Math.round(sw * outputScale)
    const outH = Math.round(sh * outputScale)

    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d')
    ctx.drawImage(imgElRef.current, sx, sy, sw, sh, 0, 0, outW, outH)

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('Şəkil emal edilə bilmədi.'))), 'image/webp', WEBP_QUALITY)
    })

    const baseName = file.name.replace(/\.[^./]+$/, '') || 'image'
    onConfirm(new File([blob], `${baseName}.webp`, { type: 'image/webp' }))
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-industrial-950/70 px-4 py-8" onClick={onCancel}>
      <div
        className="flex w-full max-w-md flex-col overflow-hidden rounded-sm border border-industrial-950/10 bg-base-50"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-industrial-950/10 px-5 py-3.5">
          <h3 className="font-heading text-sm font-bold text-industrial-950">
            {mode === 'crop' ? 'Şəkli yerləşdirin' : 'Şəklin önizləməsi'}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-7 w-7 items-center justify-center rounded-sm text-neutral-custom-600 transition-colors hover:bg-industrial-950/5"
            aria-label="Bağla"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 p-5">
          {mode === 'crop' ? (
            <div
              className="relative touch-none overflow-hidden rounded-sm border border-industrial-950/15 bg-industrial-900"
              style={{ width: VIEWPORT_WIDTH, height: viewportHeight, cursor: isDragging ? 'grabbing' : 'grab' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {objectUrl && (
                <img
                  ref={imgElRef}
                  src={objectUrl}
                  alt=""
                  onLoad={handleImageLoad}
                  draggable={false}
                  className="pointer-events-none absolute max-w-none select-none"
                  style={{ left: offset.x, top: offset.y, width: displayWidth || undefined, height: displayHeight || undefined }}
                />
              )}
            </div>
          ) : (
            <div
              className="relative flex items-center justify-center overflow-hidden rounded-sm border border-industrial-950/15 bg-[repeating-conic-gradient(#e5e5e5_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]"
              style={{ width: VIEWPORT_WIDTH, height: viewportHeight }}
            >
              {objectUrl && <img src={objectUrl} alt="" className="max-h-full max-w-full object-contain p-4" />}
            </div>
          )}

          {mode === 'crop' && (
            <div className="flex w-full items-center gap-3">
              <ZoomIn size={15} className="shrink-0 text-neutral-custom-600" />
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.01}
                value={zoom}
                onChange={handleZoomChange}
                disabled={!naturalSize}
                className="h-1.5 w-full accent-ember-600"
              />
              <button
                type="button"
                onClick={handleReset}
                disabled={!naturalSize}
                className="flex shrink-0 items-center gap-1.5 rounded-sm border border-industrial-950/15 px-2.5 py-1.5 text-xs font-medium text-industrial-950 transition-colors hover:border-ember-600 disabled:opacity-40"
              >
                <RotateCcw size={13} />
                Sıfırla
              </button>
            </div>
          )}

          <div className="flex w-full justify-end gap-2 border-t border-industrial-950/10 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-sm px-4 py-2 text-sm font-medium text-neutral-custom-600 transition-colors hover:bg-industrial-950/5"
            >
              İmtina
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={mode === 'crop' && !naturalSize}
              className="flex items-center gap-2 rounded-sm bg-ember-600 px-4 py-2 text-sm font-semibold text-base-50 transition-colors hover:bg-ember-800 disabled:opacity-60"
            >
              <Check size={15} />
              Təsdiqlə
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
