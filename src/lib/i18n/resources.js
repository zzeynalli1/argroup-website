import azHome from '../../locales/az/home.json'
import enHome from '../../locales/en/home.json'
import ruHome from '../../locales/ru/home.json'
import trHome from '../../locales/tr/home.json'

import azContact from '../../locales/az/contact.json'
import enContact from '../../locales/en/contact.json'
import ruContact from '../../locales/ru/contact.json'
import trContact from '../../locales/tr/contact.json'

import azFooter from '../../locales/az/footer.json'
import enFooter from '../../locales/en/footer.json'
import ruFooter from '../../locales/ru/footer.json'
import trFooter from '../../locales/tr/footer.json'

import azAbout from '../../locales/az/about.json'
import enAbout from '../../locales/en/about.json'
import ruAbout from '../../locales/ru/about.json'
import trAbout from '../../locales/tr/about.json'

import azServices from '../../locales/az/services.json'
import enServices from '../../locales/en/services.json'
import ruServices from '../../locales/ru/services.json'
import trServices from '../../locales/tr/services.json'

import azProjects from '../../locales/az/projects.json'
import enProjects from '../../locales/en/projects.json'
import ruProjects from '../../locales/ru/projects.json'
import trProjects from '../../locales/tr/projects.json'

import azProducts from '../../locales/az/products.json'
import enProducts from '../../locales/en/products.json'
import ruProducts from '../../locales/ru/products.json'
import trProducts from '../../locales/tr/products.json'

import azNav from '../../locales/az/nav.json'
import enNav from '../../locales/en/nav.json'
import ruNav from '../../locales/ru/nav.json'
import trNav from '../../locales/tr/nav.json'

export const SUPPORTED_LOCALES = ['az', 'en', 'ru', 'tr']
export const DEFAULT_LOCALE = 'az'
export const FALLBACK_LOCALE = 'az'

/**
 * resources[locale][namespace] -> JSON content for that locale/namespace.
 * Add more JSON files under src/locales/<locale>/ and register them here as
 * new sections/pages get copy.
 */
export const resources = {
  az: { home: azHome, contact: azContact, footer: azFooter, about: azAbout, services: azServices, projects: azProjects, products: azProducts, nav: azNav },
  en: { home: enHome, contact: enContact, footer: enFooter, about: enAbout, services: enServices, projects: enProjects, products: enProducts, nav: enNav },
  ru: { home: ruHome, contact: ruContact, footer: ruFooter, about: ruAbout, services: ruServices, projects: ruProjects, products: ruProducts, nav: ruNav },
  tr: { home: trHome, contact: trContact, footer: trFooter, about: trAbout, services: trServices, projects: trProjects, products: trProducts, nav: trNav },
}
