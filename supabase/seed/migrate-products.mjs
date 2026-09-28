#!/usr/bin/env node
/**
 * ONE-TIME content migration: local product data -> Supabase `products`
 * table + `media/products/` Storage.
 *
 * SCOPE (deliberately narrow): only the 4 verified-real Proflame passive-
 * fire products (src/data/proflameProducts.js — "exactly these 4, no
 * invented items") are ever written by --apply. The manifest below ALSO
 * lists the 13 data/categoryMaterials.js brand-name tiles (real brand
 * names, but zero other verified content — no real photo, no description,
 * no link; today's UI renders them with a generic ImagePlaceholder) purely
 * for reporting/classification — these are NEVER migrated by this script.
 * See the Phase 6 checkpoint report for the full REAL/PLACEHOLDER/UNCLEAR
 * breakdown; do not extend the apply scope without separate approval.
 *
 * Safe by default: running with no flags (or --dry-run) only reads local
 * data/images and prints the manifest — no network writes happen. Real
 * writes require --apply AND --confirm together, plus real admin
 * credentials (this project's RLS blocks anonymous writes by design).
 *
 * Idempotent WITHOUT relying on a DB unique constraint: `products` has no
 * unique column to upsert against. This looks up an existing row by
 * (category_key, brand, name) — unique per product in this dataset — and
 * updates in place if found, inserts if not.
 *
 * Credentials: never passed on the command line or hardcoded. Reads
 * VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY / ADMIN_EMAIL /
 * ADMIN_PASSWORD from process.env if already set (CI-style), otherwise
 * falls back to the repo-root .env file (gitignored, never committed).
 *
 * Usage:
 *   node supabase/seed/migrate-products.mjs                  # dry run (default)
 *   node supabase/seed/migrate-products.mjs --dry-run
 *   node supabase/seed/migrate-products.mjs --apply --confirm
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..', '..')

function loadDotEnvFallback() {
  const envPath = path.join(REPO_ROOT, '.env')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    if (!line.includes('=') || line.trim().startsWith('#')) continue
    const i = line.indexOf('=')
    const key = line.slice(0, i).trim()
    const value = line.slice(i + 1).trim()
    if (key && !(key in process.env)) process.env[key] = value
  }
}

loadDotEnvFallback()

const args = process.argv.slice(2)
const APPLY = args.includes('--apply')
const CONFIRM = args.includes('--confirm')
const DRY_RUN = !APPLY

const { products: categoryTaxonomy } = await import(pathToFileURL(path.join(REPO_ROOT, 'src/data/products.js')))
const { proflameProducts } = await import(pathToFileURL(path.join(REPO_ROOT, 'src/data/proflameProducts.js')))

const STORAGE_BUCKET = 'media'
const STORAGE_FOLDER = 'products'
const MIME_BY_EXT = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' }

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8'))
}

const productsLocales = {
  az: readJson('src/locales/az/products.json'),
  en: readJson('src/locales/en/products.json'),
  ru: readJson('src/locales/ru/products.json'),
  tr: readJson('src/locales/tr/products.json'),
}

// --- REAL FAMILY: the 4 Proflame products (the only entries this script migrates) ---
function buildProflameManifest() {
  const brandUrl = null // resolved at runtime below, from data/brands.js
  return proflameProducts.map((product, index) => {
    const nameLeaf = product.nameKey.split('.').pop()
    const localImagePath = path.join(REPO_ROOT, 'public', product.image.replace(/^\//, ''))
    return {
      classification: 'REAL FAMILY',
      category_key: 'passiveFireProtection',
      name: productsLocales.az.proflame.products[nameLeaf],
      brand: productsLocales.az.proflame.brand || 'Proflame',
      // Two candidate description texts — see checkpoint report: the
      // current live products.json text (complete, shorter) vs. the fuller
      // verified source text supplied directly in the Phase 6 prompt
      // (longer, explicitly marked incomplete at the end). Both are surfaced
      // here; deliberately NOT auto-resolved — needs your confirmation.
      description_az_current_live: productsLocales.az.proflame.description,
      external_link: brandUrl, // filled in by the caller once brands.js is loaded
      localImagePath,
      imageExists: fs.existsSync(localImagePath),
      storageDestination: `${STORAGE_BUCKET}/${STORAGE_FOLDER}/${product.slug}${path.extname(product.image)}`,
      sort_order: index * 10,
      published: true,
    }
  })
}

// --- REPORTED ONLY, NEVER MIGRATED: categoryMaterials.js brand-name tiles ---
const EXPANDABLE_CATEGORY_KEYS = ['passiveFireProtection', 'vibrationInsulation', 'soundAcoustic']
function buildCategoryMaterialsReport() {
  const rows = []
  for (const categoryKey of EXPANDABLE_CATEGORY_KEYS) {
    const category = categoryTaxonomy.find((c) => c.key === categoryKey)
    // passiveFireProtection's "Fire Stop" brand-tile is distinct from the
    // 4 real Proflame products above — same category, different UI tile.
    category.brands.forEach((name, index) => {
      rows.push({
        classification: 'UNCLEAR (real brand name, no other verified content)',
        category_key: categoryKey,
        name,
        image: '(none — generic ImagePlaceholder shown today, no real file exists)',
        description: '(none)',
        external_link: '(none)',
        sort_order: index * 10,
      })
    })
  }
  return rows
}

// --- REPORTED ONLY: the 6 categories with real brand names but no current public product tiles at all ---
function buildUnexpandedCategoriesReport() {
  return categoryTaxonomy
    .filter((c) => !EXPANDABLE_CATEGORY_KEYS.includes(c.key))
    .map((c) => ({ category_key: c.key, brands: c.brands, note: c.brands.length ? 'real brand names, no public product tiles/images today' : 'no brand names captured either' }))
}

async function resolveProflameUrl() {
  const { brands } = await import(pathToFileURL(path.join(REPO_ROOT, 'src/data/brands.js')))
  return brands.find((b) => b.name === 'Proflame')?.url ?? null
}

const proflameUrl = await resolveProflameUrl()
const manifest = buildProflameManifest().map((row) => ({ ...row, external_link: proflameUrl }))
const categoryMaterialsReport = buildCategoryMaterialsReport()
const unexpandedReport = buildUnexpandedCategoriesReport()

function printManifest() {
  console.log(`\n${DRY_RUN ? 'DRY RUN' : 'APPLY'} — ${manifest.length} REAL product(s) to migrate (Proflame family)\n`)

  manifest.forEach((row, i) => {
    console.log(`#${i + 1} ${row.name}`)
    console.log(`   category_key: ${row.category_key}`)
    console.log(`   brand:        ${row.brand}`)
    console.log(`   external_link:${row.external_link ?? '(null)'}`)
    console.log(`   description_az (current live text): ${row.description_az_current_live}`)
    console.log(`   sort_order:   ${row.sort_order}`)
    console.log(`   image:        ${row.localImagePath} -> ${row.storageDestination} ${row.imageExists ? '' : '  !!! FILE MISSING !!!'}`)
    console.log('')
  })

  console.log(`\n--- FOR REVIEW ONLY (NOT migrated by --apply) ---`)
  console.log(`\n${categoryMaterialsReport.length} categoryMaterials.js brand-name tile(s) across ${EXPANDABLE_CATEGORY_KEYS.length} expandable categories:`)
  categoryMaterialsReport.forEach((row) => {
    console.log(`   [${row.category_key}] ${row.name} — ${row.classification}`)
  })

  console.log(`\n${unexpandedReport.length} category(ies) with no current public product tiles at all:`)
  unexpandedReport.forEach((row) => {
    console.log(`   [${row.category_key}] brands in taxonomy: ${row.brands.join(', ') || '(none)'} — ${row.note}`)
  })

  console.log(
    `\nTotals: ${manifest.length} real (migrated), ${categoryMaterialsReport.length} unclear/placeholder (not migrated), ` +
      `${unexpandedReport.reduce((n, r) => n + r.brands.length, 0)} real names in categories with no product tiles yet (not migrated).`,
  )
  console.log('\nRe-run safety: idempotent by (category_key, brand, name) lookup (update-in-place), Storage upsert:true.')
}

async function apply() {
  if (!CONFIRM) {
    console.error('Refusing to write: --apply requires --confirm as well.')
    process.exit(1)
  }

  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!url || !key) {
    console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY in the environment.')
    process.exit(1)
  }
  if (!email || !password) {
    console.error('Missing ADMIN_EMAIL / ADMIN_PASSWORD in the environment — RLS blocks anonymous writes.')
    process.exit(1)
  }

  const supabase = createClient(url, key)
  const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
  if (authError) {
    console.error('Admin sign-in failed:', authError.message)
    process.exit(1)
  }

  let okCount = 0
  let failCount = 0

  for (const row of manifest) {
    try {
      if (!row.imageExists) throw new Error('local image missing, refusing to insert without an image')

      const ext = path.extname(row.localImagePath)
      const fileSlug = path.basename(row.storageDestination, ext).split('/').pop()
      const storagePath = `${STORAGE_FOLDER}/${fileSlug}${ext}`
      const fileBuffer = fs.readFileSync(row.localImagePath)
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, fileBuffer, { contentType: MIME_BY_EXT[ext] ?? 'application/octet-stream', upsert: true })
      if (uploadError) throw new Error(`upload failed: ${uploadError.message}`)
      const image_url = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath).data.publicUrl

      const dbRow = {
        category_key: row.category_key,
        name: row.name,
        brand: row.brand,
        external_link: row.external_link,
        description_az: row.description_az_current_live,
        image_urls: [image_url],
        sort_order: row.sort_order,
        published: row.published,
      }

      const { data: existing, error: findError } = await supabase
        .from('products')
        .select('id')
        .eq('category_key', row.category_key)
        .eq('brand', row.brand)
        .eq('name', row.name)
        .limit(1)
      if (findError) throw new Error(`lookup failed: ${findError.message}`)

      if (existing.length > 0) {
        const { error: updateError } = await supabase.from('products').update(dbRow).eq('id', existing[0].id)
        if (updateError) throw new Error(`update failed: ${updateError.message}`)
      } else {
        const { error: insertError } = await supabase.from('products').insert(dbRow)
        if (insertError) throw new Error(`insert failed: ${insertError.message}`)
      }

      console.log(`OK   ${row.name}`)
      okCount += 1
    } catch (err) {
      console.error(`FAIL ${row.name} — ${err.message}`)
      failCount += 1
    }
  }

  console.log(`\nDone. ${okCount} succeeded, ${failCount} failed.`)
  await supabase.auth.signOut()
}

printManifest()

if (!DRY_RUN) {
  await apply()
}
