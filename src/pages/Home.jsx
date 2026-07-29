import Building3DSection from '../components/sections/Building3DSection'
import Materials from '../components/sections/Materials'
import Projects from '../components/sections/Projects'
import BrandsSection from '../components/sections/BrandsSection'
import PartnersSection from '../components/sections/PartnersSection'
import CustomersSection from '../components/sections/CustomersSection'
import CTASection from '../components/sections/CTASection'

export default function Home() {
  return (
    <>
      <Building3DSection />
      {/* Materials renders WhyFirestop internally so the two flow as one
          continuous section (same background, no divider) — see
          Materials.jsx. */}
      <Materials />
      <Projects variant="compact" />
      <BrandsSection />
      <PartnersSection />
      <CustomersSection />
      <CTASection />
    </>
  )
}
