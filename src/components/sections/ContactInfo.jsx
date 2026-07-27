import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { FacebookIcon, InstagramIcon, LinkedinIcon, WhatsappIcon } from '../ui/SocialIcons'
import { useTranslation } from '../../lib/i18n/useTranslation'

/**
 * Real AR Group contact data (docs/argroup-knowledge-base.md). Per the
 * instruction: static values (address, phone digits, email, hours) are NOT
 * routed through i18n, only the row labels are — these stay identical across
 * locales as-is.
 */
const ADDRESS = 'İzzət Orucova 18, Xətai, Bakı, Azərbaycan'
const PHONES = [
  { display: '+994 55 490 74 24', href: 'tel:+994554907424' },
  { display: '+994 12 409 74 24', href: 'tel:+994124097424' },
]
const EMAIL = 'office@argroup.az'
const HOURS = '08:00 - 18:00, Bazar ertəsi - Şənbə'

// Placeholder hrefs — real profile links to be added later.
const SOCIAL_LINKS = [
  { Icon: FacebookIcon, href: '#', label: 'Facebook' },
  { Icon: InstagramIcon, href: '#', label: 'Instagram' },
  { Icon: LinkedinIcon, href: '#', label: 'LinkedIn' },
  { Icon: WhatsappIcon, href: '#', label: 'WhatsApp' },
]

function InfoRow({ icon, label, children }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 text-ember-600">{icon}</div>
      <div>
        <p className="text-sm text-neutral-custom-400">{label}</p>
        <div className="mt-1 text-base-50">{children}</div>
      </div>
    </div>
  )
}

export default function ContactInfo() {
  const { t } = useTranslation('contact')

  return (
    <div className="bg-industrial-950 text-base-50 rounded-lg p-8 flex flex-col gap-6">
      <InfoRow icon={<MapPin size={20} />} label={t('info.addressLabel')}>
        <p>{ADDRESS}</p>
      </InfoRow>

      <InfoRow icon={<Phone size={20} />} label={t('info.phoneLabel')}>
        <div className="flex flex-col gap-1">
          {PHONES.map((phone) => (
            <a key={phone.href} href={phone.href} className="hover:text-ember-600 transition-colors">
              {phone.display}
            </a>
          ))}
        </div>
      </InfoRow>

      <InfoRow icon={<Mail size={20} />} label={t('info.emailLabel')}>
        <a href={`mailto:${EMAIL}`} className="hover:text-ember-600 transition-colors">
          {EMAIL}
        </a>
      </InfoRow>

      <InfoRow icon={<Clock size={20} />} label={t('info.hoursLabel')}>
        <p>{HOURS}</p>
      </InfoRow>

      <div className="pt-2 mt-2 border-t border-neutral-custom-400/20 flex items-center gap-4">
        {SOCIAL_LINKS.map(({ Icon, href, label }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="text-neutral-custom-400 hover:text-ember-600 transition-colors"
          >
            <Icon className="w-5 h-5" />
          </a>
        ))}
      </div>
    </div>
  )
}
