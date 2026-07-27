import { Link } from 'react-router-dom'
import Logo from '../ui/Logo'
import { FacebookIcon, InstagramIcon, LinkedinIcon, WhatsappIcon } from '../ui/SocialIcons'
import { useTranslation } from '../../lib/i18n/useTranslation'

const QUICK_LINKS = [
  { to: '/', key: 'home' },
  { to: '/about', key: 'about' },
  { to: '/services', key: 'services' },
  { to: '/projects', key: 'projects' },
  { to: '/contact', key: 'contact' },
]

// Real AR Group contact data — see docs/argroup-knowledge-base.md. Only the
// column heading/labels go through i18n; these static values do not.
const ADDRESS = 'İzzət Orucova 18, Xətai, Bakı, Azərbaycan'
const PHONE = { display: '+994 55 490 74 24', href: 'tel:+994554907424' }
const EMAIL = 'office@argroup.az'

// Placeholder hrefs — real profile links to be added later. Reuses the same
// custom brand-mark SVGs as ContactInfo.jsx (lucide-react ships no brand logos).
const SOCIAL_LINKS = [
  { Icon: FacebookIcon, href: '#', label: 'Facebook' },
  { Icon: InstagramIcon, href: '#', label: 'Instagram' },
  { Icon: LinkedinIcon, href: '#', label: 'LinkedIn' },
  { Icon: WhatsappIcon, href: '#', label: 'WhatsApp' },
]

function ColumnHeading({ children }) {
  return <p className="text-sm font-semibold uppercase tracking-wide text-neutral-custom-400">{children}</p>
}

export default function Footer() {
  const { t, locale } = useTranslation('footer')
  const year = new Date().getFullYear()

  return (
    <footer className="w-full bg-industrial-950 text-base-50 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <Logo inverted />
          <p className="mt-4 text-sm text-neutral-custom-400 max-w-xs">{t('description')}</p>
        </div>

        <div>
          <ColumnHeading>{t('quickLinksHeading')}</ColumnHeading>
          <ul className="mt-4 space-y-2">
            {QUICK_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-sm text-base-50 hover:text-ember-600 transition-colors">
                  {t(`links.${link.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <ColumnHeading>{t('contactHeading')}</ColumnHeading>
          <ul className="mt-4 space-y-2 text-sm text-base-50">
            <li className="text-neutral-custom-400">{ADDRESS}</li>
            <li>
              <a href={PHONE.href} className="hover:text-ember-600 transition-colors">
                {PHONE.display}
              </a>
            </li>
            <li>
              <a href={`mailto:${EMAIL}`} className="hover:text-ember-600 transition-colors">
                {EMAIL}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <ColumnHeading>{t('socialHeading')}</ColumnHeading>
          <div className="mt-4 flex items-center gap-4">
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
      </div>

      <div className="border-t border-neutral-custom-400/20">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-custom-400">
          <p>{t('copyright').replace('{year}', year)}</p>
          {/* Simple current-language indicator — the functional switcher lives in Header. */}
          <span>{locale.toUpperCase()}</span>
        </div>
      </div>
    </footer>
  )
}
