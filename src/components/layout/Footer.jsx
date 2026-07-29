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
  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-wide text-industrial-950">{children}</p>
      <span className="mt-2 block h-0.5 w-9 bg-ember-600" />
    </div>
  )
}

export default function Footer() {
  const { t, locale } = useTranslation('footer')
  const year = new Date().getFullYear()

  return (
    <footer className="relative mt-auto w-full overflow-hidden border-t-2 border-ember-600 bg-base-100 text-industrial-950">
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo className="h-16" />
          <p className="mt-4 max-w-xs text-sm text-neutral-custom-600">{t('description')}</p>
        </div>

        <div>
          <ColumnHeading>{t('quickLinksHeading')}</ColumnHeading>
          <ul className="mt-4 space-y-2">
            {QUICK_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-sm text-neutral-custom-600 hover:text-ember-600 transition-colors">
                  {t(`links.${link.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <ColumnHeading>{t('contactHeading')}</ColumnHeading>
          <ul className="mt-4 space-y-2 text-sm text-neutral-custom-600">
            <li>{ADDRESS}</li>
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
                className="text-ember-600 hover:text-ember-800 transition-colors"
              >
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="relative border-t border-neutral-custom-400/20">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-neutral-custom-600 sm:flex-row">
          <p>{t('copyright').replace('{year}', year)}</p>
          {/* Simple current-language indicator — the functional switcher lives in Header. */}
          <span>{locale.toUpperCase()}</span>
        </div>
      </div>
    </footer>
  )
}
