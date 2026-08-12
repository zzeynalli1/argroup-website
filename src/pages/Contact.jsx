import ContactInfo from '../components/sections/ContactInfo'
import ContactForm from '../components/sections/ContactForm'
import ContactMap from '../components/sections/ContactMap'
import GridTexture from '../components/ui/GridTexture'
import GrainTexture from '../components/ui/GrainTexture'

export default function Contact() {
  return (
    <>
      <section className="relative overflow-hidden bg-base-100">
        {/* One continuous architectural scene (public/images/contact-architecture.png)
            behind the whole composition — left copy and the form panel both sit on
            top of it, rather than each getting its own separate image treatment. */}
        <div className="absolute inset-0">
          <img
            src="/images/contact-architecture.png"
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
            style={{ objectPosition: 'center 70%' }}
          />
          {/* Warm off-white wash, strongest behind the left-column copy, fully
              faded out before the form column so the image (and the form panel's
              own subtle translucency) stay legible on the right. */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#F7F6F3_0%,rgba(247,246,243,0.62)_32%,rgba(247,246,243,0)_54%)]" />
        </div>

        <GridTexture className="text-industrial-950" opacity="opacity-[0.05]" />
        <GrainTexture />

        <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-36 md:pb-24 md:pt-44 lg:grid lg:grid-cols-[54%_46%] lg:items-start lg:gap-x-12 lg:py-32">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-16 left-[54%] hidden w-px bg-industrial-950/10 lg:block"
          />

          <ContactInfo />
          <div className="mt-12 lg:mt-6">
            <ContactForm />
          </div>
        </div>
      </section>
      <ContactMap />
    </>
  )
}
