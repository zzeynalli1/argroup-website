import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTranslation } from '../../lib/i18n/useTranslation'

gsap.registerPlugin(ScrollTrigger)

const STEP_KEYS = ['step1', 'step2', 'step3', 'step4']

export default function Process() {
  const { t } = useTranslation('home')
  const [activeStep, setActiveStep] = useState(0)
  const stepRefs = useRef([])

  useEffect(() => {
    const triggers = stepRefs.current.map((el, index) => {
      if (!el) return null
      return ScrollTrigger.create({
        trigger: el,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => setActiveStep(index),
        onEnterBack: () => setActiveStep(index),
      })
    })

    return () => triggers.forEach((trigger) => trigger?.kill())
  }, [])

  return (
    <section id="process" className="bg-base-100 py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-6">
        <div className="max-w-xl">
          <span className="block w-16 h-1 bg-amber-500 mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-industrial-950">{t('process.title')}</h2>
          <p className="mt-4 text-neutral-custom-600">{t('process.subtitle')}</p>
        </div>

        <div className="mt-16 relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-neutral-custom-400/30" />

          {STEP_KEYS.map((key, index) => {
            const isActive = activeStep === index
            return (
              <div
                key={key}
                ref={(el) => (stepRefs.current[index] = el)}
                className="relative flex items-center gap-6 py-8"
              >
                <svg
                  viewBox="0 0 48 48"
                  className={`relative z-10 w-12 h-12 shrink-0 transition-colors ${
                    isActive ? 'text-ember-600' : 'text-neutral-custom-400'
                  }`}
                >
                  <circle
                    cx="24"
                    cy="24"
                    r="22"
                    fill={isActive ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <text
                    x="24"
                    y="25"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isActive ? '#FFFFFF' : 'currentColor'}
                    fontSize="18"
                    fontWeight="700"
                  >
                    {index + 1}
                  </text>
                </svg>
                <p
                  className={`text-lg font-medium transition-colors ${
                    isActive ? 'text-industrial-950' : 'text-neutral-custom-600'
                  }`}
                >
                  {t(`process.steps.${key}.title`)}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
