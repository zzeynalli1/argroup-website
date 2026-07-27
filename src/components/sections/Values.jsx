import { Award, Shield, Users, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from '../../lib/i18n/useTranslation'

// Real AR Group values from docs/argroup-knowledge-base.md.
const VALUE_ITEMS = [
  { key: 'quality', Icon: Award },
  { key: 'professionalism', Icon: Shield },
  { key: 'personnel', Icon: Users },
  { key: 'privacy', Icon: Lock },
]

export default function Values() {
  const { t } = useTranslation('about')

  return (
    <section className="bg-base-100 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-xl">
          <span className="block w-16 h-1 bg-ember-600 mb-6" />
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-industrial-950">{t('values.heading')}</h2>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {VALUE_ITEMS.map(({ key, Icon }) => (
            <motion.div
              key={key}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 250, damping: 18 }}
              className="rounded-lg border border-neutral-custom-400/20 bg-base-50 p-6"
            >
              <div className="w-12 h-12 rounded-md bg-ember-600/10 flex items-center justify-center text-ember-600">
                <Icon size={22} />
              </div>
              <h3 className="mt-4 font-heading font-semibold text-industrial-950">
                {t(`values.items.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm text-neutral-custom-600">{t(`values.items.${key}.description`)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
