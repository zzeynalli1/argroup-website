import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../ui/Logo'
import LanguageSwitcher from '../ui/LanguageSwitcher'
import { useTranslation } from '../../lib/i18n/useTranslation'
import { useScrolled } from '../../hooks/useScrolled'

const NAV_LINKS = [
  { to: '/', key: 'home' },
  { to: '/about', key: 'about' },
  { to: '/services', key: 'services' },
  { to: '/products', key: 'products' },
  { to: '/contact', key: 'contact' },
]

const SCROLL_THRESHOLD = 50

function NavItem({ link, isActive, label }) {
  return (
    <Link
      to={link.to}
      className="group relative inline-block py-1 text-sm font-medium text-industrial-950 transition-colors duration-300 hover:text-ember-600"
    >
      {label}
      <span
        className={`pointer-events-none absolute -bottom-1 left-0 h-px bg-ember-600 transition-all duration-300 ease-out ${
          isActive ? 'w-full' : 'w-0 group-hover:w-full'
        }`}
      />
    </Link>
  )
}

export default function Header() {
  const { t } = useTranslation('nav')
  const location = useLocation()
  const scrolled = useScrolled(SCROLL_THRESHOLD)

  return (
    <motion.header
      initial={false}
      animate={{ backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.8)' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`fixed inset-x-0 top-0 z-40 w-full transition-[backdrop-filter,box-shadow] duration-300 ease-out ${
        scrolled ? 'shadow-lg shadow-black/10 backdrop-blur-md' : ''
      }`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 transition-[padding] duration-300 ease-out ${
          scrolled ? 'py-3' : 'py-6'
        }`}
      >
        <Link to="/" className="shrink-0">
          <motion.div
            animate={{ scale: scrolled ? 0.85 : 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ willChange: 'transform', transformOrigin: 'left center' }}
          >
            <Logo className="h-14" />
          </motion.div>
        </Link>

        <nav>
          <ul className="flex items-center gap-8">
            {NAV_LINKS.map((link) => {
              const isActive = link.to === '/' ? location.pathname === '/' : location.pathname.startsWith(link.to)
              return (
                <li key={link.to}>
                  <NavItem link={link} isActive={isActive} label={t(link.key)} />
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-6">
          <Link
            to="/contact"
            className="inline-block whitespace-nowrap rounded-full bg-ember-600 px-5 py-2.5 text-sm font-semibold text-base-50 transition-colors duration-300 hover:bg-ember-800"
          >
            {t('cta')}
          </Link>
          <LanguageSwitcher />
        </div>
      </div>
    </motion.header>
  )
}
