import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

// Parallax is a mouse-hover interaction; meaningless on touch, so it's
// gated off there rather than firing on tap (same pattern as
// Materials.jsx's usePointerFine).
function usePointerFine() {
  const [isPointerFine, setIsPointerFine] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches
  )

  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)')
    function handleChange(event) {
      setIsPointerFine(event.matches)
    }
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  return isPointerFine
}

/**
 * Services-page hero decoration: five passive-fire-protection elements
 * (fire barrier board, joint seal, cable tray, pipe penetration, fire
 * damper) floating as thin gray line-art across three depth layers, with a
 * very subtle mouse-driven parallax on pointer-fine devices. Purely
 * decorative — an abstract technical showcase, not product photography.
 */
export default function FloatingElementsIllustration({ className = '' }) {
  const containerRef = useRef(null)
  const backRef = useRef(null)
  const midRef = useRef(null)
  const frontRef = useRef(null)
  const isPointerFine = usePointerFine()

  useEffect(() => {
    if (!isPointerFine) return

    const backX = gsap.quickTo(backRef.current, 'x', { duration: 0.7, ease: 'power3.out' })
    const backY = gsap.quickTo(backRef.current, 'y', { duration: 0.7, ease: 'power3.out' })
    const midX = gsap.quickTo(midRef.current, 'x', { duration: 0.6, ease: 'power3.out' })
    const midY = gsap.quickTo(midRef.current, 'y', { duration: 0.6, ease: 'power3.out' })
    const frontX = gsap.quickTo(frontRef.current, 'x', { duration: 0.5, ease: 'power3.out' })
    const frontY = gsap.quickTo(frontRef.current, 'y', { duration: 0.5, ease: 'power3.out' })

    function handleMove(event) {
      const rect = trackingNode.getBoundingClientRect()
      const relX = (event.clientX - rect.left) / rect.width - 0.5
      const relY = (event.clientY - rect.top) / rect.height - 0.5
      backX(relX * 4)
      backY(relY * 4)
      midX(relX * 9)
      midY(relY * 9)
      frontX(relX * 16)
      frontY(relY * 16)
    }

    // Tracks mouse movement across the whole hero section (not just this
    // small, cropped, pointer-events-none decoration) so the parallax
    // reacts anywhere the cursor moves in the hero.
    const trackingNode = containerRef.current.closest('section') ?? containerRef.current
    trackingNode.addEventListener('mousemove', handleMove)
    return () => trackingNode.removeEventListener('mousemove', handleMove)
  }, [isPointerFine])

  return (
    <div ref={containerRef} className={className}>
      <svg viewBox="0 0 600 420" fill="none" className="h-full w-full overflow-visible">
        {/* Back layer: fire barrier board + joint seal */}
        <g ref={backRef} className="text-neutral-custom-400" stroke="currentColor" strokeWidth="1" fill="none">
          <rect x="40" y="40" width="90" height="60" rx="4" />
          <rect x="52" y="52" width="66" height="36" rx="2" />
          <path d="M 430 330 Q 450 310 470 330 T 510 330" />
          <line x1="420" y1="318" x2="520" y2="318" />
          <line x1="420" y1="342" x2="520" y2="342" />
        </g>

        {/* Mid layer: cable tray + pipe penetration */}
        <g ref={midRef}>
          <g className="text-neutral-custom-400" stroke="currentColor" strokeWidth="1" fill="none">
            <rect x="440" y="60" width="110" height="46" />
            <line x1="455" y1="60" x2="455" y2="106" />
            <line x1="475" y1="60" x2="475" y2="106" />
            <line x1="495" y1="60" x2="495" y2="106" />
            <line x1="515" y1="60" x2="515" y2="106" />
            <line x1="535" y1="60" x2="535" y2="106" />
            <circle cx="110" cy="320" r="30" />
            <circle cx="110" cy="320" r="20" />
          </g>
          <g className="text-ember-600" fill="currentColor">
            <circle cx="110" cy="320" r="3" />
          </g>
        </g>

        {/* Front layer: fire damper */}
        <g ref={frontRef}>
          <g className="text-neutral-custom-400" stroke="currentColor" strokeWidth="1" fill="none">
            <rect x="255" y="170" width="90" height="70" rx="3" />
            <line x1="255" y1="185" x2="345" y2="185" />
            <line x1="255" y1="200" x2="345" y2="200" />
            <line x1="255" y1="215" x2="345" y2="215" />
            <line x1="255" y1="230" x2="345" y2="230" />
          </g>
          <g className="text-ember-600" fill="currentColor">
            <circle cx="255" cy="185" r="3" />
            <circle cx="345" cy="230" r="3" />
          </g>
        </g>
      </svg>
    </div>
  )
}
