import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { FacebookIcon, InstagramIcon, LinkedinIcon, WhatsappIcon } from '../ui/SocialIcons'
import { useTranslation } from '../../lib/i18n/useTranslation'
import { ADDRESS, EMAIL, PHONES } from '../../data/contactInfo'

// Placeholder hrefs — real profile links to be added later.
const SOCIAL_LINKS = [
  { Icon: FacebookIcon, href: '#', label: 'Facebook' },
  { Icon: InstagramIcon, href: '#', label: 'Instagram' },
  { Icon: LinkedinIcon, href: '#', label: 'LinkedIn' },
  { Icon: WhatsappIcon, href: '#', label: 'WhatsApp' },
]

function InfoRow({ number, icon: Icon, label, children }) {
  return (
    <div className="group relative flex items-start gap-4 border-t border-industrial-950/10 py-5 first:border-t-0 first:pt-0">
      <span className="w-6 shrink-0 pt-0.5 font-mono text-xs text-neutral-custom-400">{number}</span>
      <Icon size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-ember-600" />
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wide text-neutral-custom-400">{label}</p>
        <div className="mt-1 text-base text-industrial-950">{children}</div>
      </div>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px w-0 bg-ember-600 transition-all duration-300 ease-out group-hover:w-full"
      />
    </div>
  )
}

/** The page's editorial statement lives here (not a separate hero section) so
 * the "strong contact statement + office info" reads as one left-column
 * block. The section's shared background image (see pages/Contact.jsx) sits
 * behind this content, so text blocks stay narrow (`max-w-md`) for
 * readability against it rather than spanning the full column. */
export default function ContactInfo() {
  const { t } = useTranslation('contact')

  return (
    <div>
      <div className="max-w-md">
        <span className="mb-4 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-ember-600">
          <span aria-hidden="true" className="h-px w-8 bg-ember-600" />
          {t('hero.eyebrow')}
        </span>
        <h1 className="font-heading text-5xl font-bold leading-[1.05] text-industrial-950 md:text-6xl">
          {t('hero.headingLine1')}
          <br />
          <span className="text-ember-600">{t('hero.headingLine2')}</span>
        </h1>
        <p className="mt-5 text-lg text-neutral-custom-600">{t('subtitle')}</p>
      </div>

      <div className="mt-10 max-w-md">
        <InfoRow number="01" icon={Phone} label={t('info.phoneLabel')}>
          <div className="flex flex-col gap-1">
            {PHONES.map((phone) => (
              <a key={phone.href} href={phone.href} className="transition-colors hover:text-ember-600">
                {phone.display}
              </a>
            ))}
          </div>
        </InfoRow>

        <InfoRow number="02" icon={Mail} label={t('info.emailLabel')}>
          <a href={`mailto:${EMAIL}`} className="transition-colors hover:text-ember-600">
            {EMAIL}
          </a>
        </InfoRow>

        <InfoRow number="03" icon={MapPin} label={t('info.addressLabel')}>
          <p>{ADDRESS}</p>
        </InfoRow>

        <InfoRow number="04" icon={Clock} label={t('info.hoursLabel')}>
          {t('info.hoursValue')}
        </InfoRow>
      </div>

      <div className="mt-8 flex max-w-md items-center gap-4 border-t border-industrial-950/10 pt-8">
        {SOCIAL_LINKS.map(({ Icon, href, label }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="text-neutral-custom-400 transition-colors hover:text-ember-600"
          >
            <Icon className="h-5 w-5" />
          </a>
        ))}
      </div>
    </div>
  )
}
