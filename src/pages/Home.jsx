import Building3DSection from '../components/sections/Building3DSection'
import Materials from '../components/sections/Materials'
import Services from '../components/sections/Services'
import Projects from '../components/sections/Projects'
import WhyFirestop from '../components/sections/WhyFirestop'
import PartnersMarquee from '../components/sections/PartnersMarquee'
import CTASection from '../components/sections/CTASection'

export default function Home() {
  return (
    <>
      <Building3DSection />
      <Materials />
      <Services variant="compact" />
      {/* Side-by-side: Projects on the left, WhyFirestop on the right. Each
          renders its own full <section> (with its own background/padding),
          so the grid just places them as two full-height columns. */}
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <Projects variant="compact" />
        <WhyFirestop />
      </div>
      <PartnersMarquee />
      <CTASection />
    </>
  )
}
