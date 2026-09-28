import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import Logo from '../ui/Logo'
import LanguageSwitcher from '../ui/LanguageSwitcher'
import { useTranslation } from '../../lib/i18n/useTranslation'
import { useScrolled } from '../../hooks/useScrolled'
import { socialLinks } from '../../data/socialLinks'

const NAV_LINKS = [
  { to: '/', key: 'home' },
  { to: '/about', key: 'about' },
  { to: '/services', key: 'services' },
  { to: '/products', key: 'products' },
  { to: '/contact', key: 'contact' },
]

const SCROLL_THRESHOLD = 50

function isLinkActive(link, pathname) {
  return link.to === '/' ? pathname === '/' : pathname.startsWith(link.to)
}

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
  const [menuOpen, setMenuOpen] = useState(false)
  const [lastPathname, setLastPathname] = useState(location.pathname)
  if (location.pathname !== lastPathname) {
    setLastPathname(location.pathname)
    setMenuOpen(false)
  }

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <motion.header
      initial={false}
      animate={{ backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 1)' }}
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
            <Logo className="h-16" />
          </motion.div>
        </Link>

        <nav className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavItem link={link} isActive={isLinkActive(link, location.pathname)} label={t(link.key)} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-6 lg:flex">
          <div className="hidden items-center gap-3 border-r border-neutral-custom-400/20 pr-6 lg:flex">
            {socialLinks.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-neutral-custom-600 transition-colors hover:text-ember-600"
              >
                <Icon className="h-6 w-6" />
              </a>
            ))}
          </div>
          <Link
            to="/contact"
            className="inline-block whitespace-nowrap rounded-full bg-ember-600 px-5 py-2.5 text-sm font-semibold text-base-50 transition-colors duration-300 hover:bg-ember-800"
          >
            {t('cta')}
          </Link>
          <LanguageSwitcher />
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? t('closeMenu') : t('openMenu')}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center text-industrial-950 transition-colors hover:text-ember-600"
          >
            {menuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden border-t border-neutral-custom-400/20 bg-base-50 lg:hidden"
          >
            <nav className="mx-auto max-w-7xl px-6 py-6">
              <ul className="flex flex-col">
                {NAV_LINKS.map((link) => {
                  const isActive = isLinkActive(link, location.pathname)
                  return (
                    <li key={link.to} className="border-b border-neutral-custom-400/10 last:border-0">
                      <Link
                        to={link.to}
                        className={`block py-3.5 text-lg font-medium transition-colors ${
                          isActive ? 'text-ember-600' : 'text-industrial-950 hover:text-ember-600'
                        }`}
                      >
                        {t(link.key)}
                      </Link>
                    </li>
                  )
                })}
              </ul>

              <Link
                to="/contact"
                className="mt-6 block rounded-full bg-ember-600 px-5 py-3 text-center text-sm font-semibold text-base-50 transition-colors duration-300 hover:bg-ember-800"
              >
                {t('cta')}
              </Link>

              <div className="mt-6 flex items-center gap-5 border-t border-neutral-custom-400/20 pt-6">
                {socialLinks.map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="text-neutral-custom-600 transition-colors hover:text-ember-600"
                  >
                    <Icon className="h-6 w-6" />
                  </a>
                ))}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
