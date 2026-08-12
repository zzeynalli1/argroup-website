import { useState } from 'react'
import ProductsHero from '../components/sections/ProductsHero'
import SolutionFinder from '../components/sections/SolutionFinder'
import ProductCategoryTabs from '../components/sections/ProductCategoryTabs'
import BrandFilter from '../components/sections/BrandFilter'
import ProductsGrid from '../components/sections/ProductsGrid'
import WhyChooseProducts from '../components/sections/WhyChooseProducts'
import ProductsCTA from '../components/sections/ProductsCTA'

export default function Products() {
  const [activeCategory, setActiveCategory] = useState(null)
  const [activeBrand, setActiveBrand] = useState(null)

  return (
    <>
      <ProductsHero />
      <SolutionFinder activeCategory={activeCategory} onSelect={setActiveCategory} />
      <ProductCategoryTabs activeCategory={activeCategory} onSelect={setActiveCategory} />
      <BrandFilter activeBrand={activeBrand} onSelect={setActiveBrand} />
      <ProductsGrid activeCategory={activeCategory} activeBrand={activeBrand} />
      <WhyChooseProducts />
      <ProductsCTA />
    </>
  )
}
