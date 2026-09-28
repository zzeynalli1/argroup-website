import { useEffect, useRef, useState } from 'react'
import ProductsHero from '../components/sections/ProductsHero'
import ProductCategories from '../components/sections/ProductCategories'
import ExpandedProductCategory from '../components/sections/ExpandedProductCategory'
import WhyChooseProducts from '../components/sections/WhyChooseProducts'

export default function Products() {
  const [activeCategory, setActiveCategory] = useState(null)
  const expandedRef = useRef(null)

  // Same manual getBoundingClientRect + fixed-header-height technique as
  // ServicesShowcase.jsx's ServiceExplorerPanel scroll effect, adapted for
  // ExpandedProductCategory's height-grow animation (its motion.section
  // animates height 0 -> auto over 350ms — ServiceExplorerPanel has no such
  // animation, so a single scrollTo works there but not here). The wrapper
  // div's own top position is stable the instant activeCategory changes
  // (unaffected by its child's still-growing height), but a *single*
  // scrollTo call fires before the page has grown tall enough to actually
  // scroll that far, so the browser clamps it short. Re-issuing scrollTo on
  // every animation frame lets the reachable distance "catch up" as the
  // panel grows, landing exactly on target the moment the animation
  // finishes growing — no hardcoded animation-duration guess involved, just
  // measuring real layout each frame and stopping once it converges (or a
  // safety cutoff is hit). Only runs when a category is (re)selected — never
  // on close (activeCategory === null).
  useEffect(() => {
    if (!activeCategory || !expandedRef.current) return

    let frameId
    let framesLeft = 90 // ~1.5s safety cutoff at 60fps, well past the 350ms panel animation

    function tick() {
      const el = expandedRef.current
      if (!el) return
      const header = document.querySelector('header')
      const headerHeight = header?.getBoundingClientRect().height ?? 0
      const target = el.getBoundingClientRect().top + window.scrollY - headerHeight - 16

      window.scrollTo({ top: target, behavior: 'auto' })

      framesLeft -= 1
      const reachedTarget = Math.abs(window.scrollY - target) < 1
      if (!reachedTarget && framesLeft > 0) {
        frameId = requestAnimationFrame(tick)
      }
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [activeCategory])

  return (
    <>
      <ProductsHero />
      <ProductCategories activeCategory={activeCategory} onSelect={setActiveCategory} />
      <div ref={expandedRef} className="scroll-mt-28">
        <ExpandedProductCategory activeCategory={activeCategory} onClose={() => setActiveCategory(null)} />
      </div>
      <WhyChooseProducts />
    </>
  )
}
