import { useState } from 'react'
import { ChevronDown, Lock, Mail, MessageSquare, Phone, User } from 'lucide-react'
import { useTranslation } from '../../lib/i18n/useTranslation'
import { services } from '../../data/servicesDetail'

/**
 * Contact form — structure + client-side validation only.
 *
 * IMPORTANT: this does NOT talk to any backend yet. `handleSubmit` is a
 * placeholder that just validates and shows a local success message.
 * When the backend is ready, wire the fetch/POST call here and add
 * server-side validation, SQL-injection-safe query handling, spam/bot
 * protection (e.g. a CAPTCHA or honeypot field), and rate limiting on
 * the API route — none of that can be enforced from the client alone.
 *
 * Security notes:
 * - No dangerouslySetInnerHTML / raw HTML rendering anywhere in this form.
 * - All fields are length-limited client-side; the backend must re-validate
 *   and re-limit these regardless, since client-side checks can be bypassed.
 */

const LIMITS = {
  name: 100,
  email: 254,
  phone: 30,
  message: 2000,
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const initialFormState = { name: '', email: '', phone: '', service: '', message: '' }

const FIELD_CLASSES =
  'w-full rounded-sm border border-base-50/15 bg-industrial-950/50 py-3.5 pl-4 pr-11 text-sm text-base-50 placeholder:text-neutral-custom-400 outline-none transition-colors focus:border-ember-600'

export default function ContactForm() {
  const { t } = useTranslation('contact')
  const { t: tServices } = useTranslation('services')
  const [values, setValues] = useState(initialFormState)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  function validate(v) {
    const errs = {}

    if (!v.name.trim()) {
      errs.name = t('form.errors.nameRequired')
    } else if (v.name.length > LIMITS.name) {
      errs.name = t('form.errors.nameTooLong').replace('{max}', LIMITS.name)
    }

    if (!v.email.trim()) {
      errs.email = t('form.errors.emailRequired')
    } else if (v.email.length > LIMITS.email) {
      errs.email = t('form.errors.emailTooLong').replace('{max}', LIMITS.email)
    } else if (!EMAIL_REGEX.test(v.email)) {
      errs.email = t('form.errors.emailInvalid')
    }

    if (!v.message.trim()) {
      errs.message = t('form.errors.messageRequired')
    } else if (v.message.length > LIMITS.message) {
      errs.message = t('form.errors.messageTooLong').replace('{max}', LIMITS.message)
    }

    return errs
  }

  function handleChange(e) {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()

    const validationErrors = validate(values)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      setSubmitted(false)
      return
    }

    // Placeholder submit — no backend yet.
    // TODO(backend): POST to an API route with server-side validation,
    // SQL-injection-safe parameterized queries, spam/bot protection, and
    // rate limiting before this goes live.
    setSubmitted(true)
    setValues(initialFormState)
  }

  return (
    <div className="relative w-full overflow-hidden rounded-sm border border-base-50/10 bg-industrial-950/90 p-6 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.55)] sm:p-8 md:p-10">
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-ember-600" />

      <h2 className="font-heading text-2xl font-bold text-base-50 md:text-3xl">{t('form.heading')}</h2>
      <span aria-hidden="true" className="mt-4 block h-px w-12 bg-ember-600" />

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        <div>
          <label htmlFor="name" className="sr-only">
            {t('form.nameLabel')}
          </label>
          <div className="relative">
            <input
              id="name"
              name="name"
              type="text"
              value={values.name}
              onChange={handleChange}
              maxLength={LIMITS.name}
              placeholder={t('form.namePlaceholder')}
              className={FIELD_CLASSES}
            />
            <User size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-custom-400" />
          </div>
          {errors.name && <p className="mt-1.5 text-sm text-ember-600">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="sr-only">
            {t('form.emailLabel')}
          </label>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              maxLength={LIMITS.email}
              placeholder={t('form.emailPlaceholder')}
              className={FIELD_CLASSES}
            />
            <Mail size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-custom-400" />
          </div>
          {errors.email && <p className="mt-1.5 text-sm text-ember-600">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="sr-only">
            {t('form.phoneLabel')}
          </label>
          <div className="relative">
            <input
              id="phone"
              name="phone"
              type="tel"
              value={values.phone}
              onChange={handleChange}
              maxLength={LIMITS.phone}
              placeholder={t('form.phonePlaceholder')}
              className={FIELD_CLASSES}
            />
            <Phone size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-custom-400" />
          </div>
        </div>

        <div>
          <label htmlFor="service" className="sr-only">
            {t('form.serviceLabel')}
          </label>
          <div className="relative">
            <select
              id="service"
              name="service"
              value={values.service}
              onChange={handleChange}
              className={`${FIELD_CLASSES} appearance-none ${values.service ? 'text-base-50' : 'text-neutral-custom-400'}`}
            >
              <option value="" className="text-neutral-custom-600">
                {t('form.servicePlaceholder')}
              </option>
              {services.map((service) => (
                <option key={service.key} value={service.key} className="text-industrial-950">
                  {tServices(`grid.items.${service.key}.title`)}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-custom-400" />
          </div>
        </div>

        <div>
          <label htmlFor="message" className="sr-only">
            {t('form.messageLabel')}
          </label>
          <div className="relative">
            <textarea
              id="message"
              name="message"
              rows={5}
              value={values.message}
              onChange={handleChange}
              maxLength={LIMITS.message}
              placeholder={t('form.messagePlaceholder')}
              className={`${FIELD_CLASSES} min-h-[140px] resize-none`}
            />
            <MessageSquare size={16} className="pointer-events-none absolute right-4 top-4 text-neutral-custom-400" />
          </div>
          {errors.message && <p className="mt-1.5 text-sm text-ember-600">{errors.message}</p>}
        </div>

        <button
          type="submit"
          className="group flex w-full items-center justify-center gap-2 rounded-sm bg-ember-600 py-4 text-sm font-semibold uppercase tracking-wide text-base-50 transition-colors hover:bg-ember-800"
        >
          {t('form.submit')}
          <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
            →
          </span>
        </button>

        <p className="flex items-center gap-2 text-xs text-neutral-custom-400">
          <Lock size={12} />
          {t('form.privacyNote')}
        </p>

        {submitted && <p className="text-sm text-success-500">{t('form.successMessage')}</p>}
      </form>
    </div>
  )
}
