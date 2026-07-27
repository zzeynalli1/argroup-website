import { useState } from 'react'
import Button from '../ui/Button'

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
  message: 2000,
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const initialFormState = { name: '', email: '', message: '' }

function validate(values) {
  const errors = {}

  if (!values.name.trim()) {
    errors.name = 'Ad daxil edilməlidir.'
  } else if (values.name.length > LIMITS.name) {
    errors.name = `Ad ${LIMITS.name} simvoldan uzun ola bilməz.`
  }

  if (!values.email.trim()) {
    errors.email = 'E-poçt daxil edilməlidir.'
  } else if (values.email.length > LIMITS.email) {
    errors.email = `E-poçt ${LIMITS.email} simvoldan uzun ola bilməz.`
  } else if (!EMAIL_REGEX.test(values.email)) {
    errors.email = 'E-poçt formatı düzgün deyil.'
  }

  if (!values.message.trim()) {
    errors.message = 'Mesaj daxil edilməlidir.'
  } else if (values.message.length > LIMITS.message) {
    errors.message = `Mesaj ${LIMITS.message} simvoldan uzun ola bilməz.`
  }

  return errors
}

export default function ContactForm() {
  const [values, setValues] = useState(initialFormState)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

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
    <div className="w-full">
      <form onSubmit={handleSubmit} noValidate className="w-full max-w-md space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-industrial-800">
            Ad
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={values.name}
            onChange={handleChange}
            maxLength={LIMITS.name}
            className="mt-1 w-full rounded-md border border-neutral-custom-400/40 px-3 py-2"
          />
          {errors.name && <p className="mt-1 text-sm text-ember-600">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-industrial-800">
            E-poçt
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={values.email}
            onChange={handleChange}
            maxLength={LIMITS.email}
            className="mt-1 w-full rounded-md border border-neutral-custom-400/40 px-3 py-2"
          />
          {errors.email && <p className="mt-1 text-sm text-ember-600">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-industrial-800">
            Mesaj
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            value={values.message}
            onChange={handleChange}
            maxLength={LIMITS.message}
            className="mt-1 w-full rounded-md border border-neutral-custom-400/40 px-3 py-2"
          />
          {errors.message && <p className="mt-1 text-sm text-ember-600">{errors.message}</p>}
        </div>

        <Button type="submit">Göndər</Button>

        {submitted && (
          <p className="text-sm text-industrial-800">
            Təşəkkürlər! (Placeholder — hələ heç bir yerə göndərilmir.)
          </p>
        )}
      </form>
    </div>
  )
}
