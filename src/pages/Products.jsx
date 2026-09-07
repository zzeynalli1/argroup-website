import { useState } from 'react'
import ProductsHero from '../components/sections/ProductsHero'
import ProductCategories from '../components/sections/ProductCategories'
import ExpandedProductCategory from '../components/sections/ExpandedProductCategory'
import WhyChooseProducts from '../components/sections/WhyChooseProducts'

export default function Products() {
  const [activeCategory, setActiveCategory] = useState(null)

  return (
    <>
      <ProductsHero />
      <ProductCategories activeCategory={activeCategory} onSelect={setActiveCategory} />
      <ExpandedProductCategory activeCategory={activeCategory} onClose={() => setActiveCategory(null)} />
      <WhyChooseProducts />
    </>
  )
}
