#!/usr/bin/env node
/**
 * ONE-TIME content migration: src/data/brands.js -> Supabase `brands` table
 * + `media/brands/` Storage.
 *
 * Safe by default: running with no flags (or --dry-run) only reads local
 * data/images and prints the manifest — no network writes happen. Real
 * writes require --apply AND --confirm together, plus real admin
 * credentials (this project's RLS blocks anonymous writes by design).
 *
 * Idempotent WITHOUT relying on a DB unique constraint: unlike `projects`
 * (unique on `slug`), the approved `brands` schema has no unique column to
 * upsert against — see 0001_init_schema.sql. So this script uses the
 * deterministic per-source-file Storage path (e.g. media/brands/brand-01.webp,
 * no random suffix — distinct from the admin UI's uploadBrandLogo, which
 * intentionally does add one) as the application-level idempotency key:
 * images upload with Storage upsert:true (same object overwritten, never
 * duplicated), and a row is only inserted if no existing row's logo_url
 * already points at that path — otherwise that row is updated in place.
 * Re-running AFTER an admin has hand-edited one of these rows will
 * overwrite that edit back to the source-file content — this is a
 * one-time seed, not a sync job.
 *
 * Credentials: never passed on the command line or hardcoded. Reads
 * VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY / ADMIN_EMAIL /
 * ADMIN_PASSWORD from process.env if already set (CI-style), otherwise
 * falls back to the repo-root .env file (gitignored, never committed).
 *
 * Usage:
 *   node supabase/seed/migrate-brands.mjs                  # dry run (default)
 *   node supabase/seed/migrate-brands.mjs --dry-run
 *   node supabase/seed/migrate-brands.mjs --apply --confirm
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

const { brands } = await import(pathToFileURL(path.join(REPO_ROOT, 'src/data/brands.js')))

const STORAGE_BUCKET = 'media'
const STORAGE_FOLDER = 'brands'
const MIME_BY_EXT = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' }

function slugFromLogoPath(logoSrc) {
  return path.basename(logoSrc, path.extname(logoSrc))
}

function buildManifestRow(brand, index) {
  const fileSlug = slugFromLogoPath(brand.logoSrc)
  const localImagePath = path.join(REPO_ROOT, 'public', brand.logoSrc.replace(/^\//, ''))
  const imageExists = fs.existsSync(localImagePath)

  const missing = []
  if (!imageExists) missing.push(`local image file (${brand.logoSrc})`)
  if (!brand.name) missing.push('name')
  if (!brand.url) missing.push('website_url (intentionally null — do not invent)')

  return {
    name: brand.name,
    website_url: brand.url ?? null,
    logo_scale: brand.logoScale ?? 1,
    sort_order: index * 10,
    published: true,
    localImagePath,
    imageExists,
    storageDestination: `${STORAGE_BUCKET}/${STORAGE_FOLDER}/${fileSlug}${path.extname(brand.logoSrc)}`,
    missing,
  }
}

const manifest = brands.map(buildManifestRow)

function printManifest() {
  console.log(`\n${DRY_RUN ? 'DRY RUN' : 'APPLY'} — ${manifest.length} brand(s)\n`)

  const names = new Map()
  for (const row of manifest) names.set(row.name, (names.get(row.name) ?? 0) + 1)
  const duplicateLogos = new Map()
  for (const row of manifest) duplicateLogos.set(row.storageDestination, (duplicateLogos.get(row.storageDestination) ?? 0) + 1)

  manifest.forEach((row, i) => {
    console.log(`#${i + 1} ${row.name}`)
    console.log(`   website_url: ${row.website_url ?? '(null — no confirmed site)'}`)
    console.log(`   logo_scale:  ${row.logo_scale}`)
    console.log(`   sort_order:  ${row.sort_order}`)
    console.log(`   published:   ${row.published}`)
    console.log(`   image:       ${row.localImagePath} -> ${row.storageDestination} ${row.imageExists ? '' : '  !!! FILE MISSING !!!'}`)
    if ((names.get(row.name) ?? 0) > 1) console.log('   !!! DUPLICATE NAME !!!')
    if ((duplicateLogos.get(row.storageDestination) ?? 0) > 1) console.log('   !!! DUPLICATE LOGO DESTINATION !!!')
    if (row.missing.length > 0) console.log(`   notes:       ${row.missing.join('; ')}`)
    console.log('')
  })

  console.log(
    `Total: ${manifest.length}, missing images: ${manifest.filter((r) => !r.imageExists).length}, ` +
      `null website_url: ${manifest.filter((r) => !r.website_url).length}`,
  )
  console.log('\nRe-run safety: idempotent by deterministic logo_url lookup (update-in-place) and Storage upsert:true (no duplicate objects).')
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
      if (!row.imageExists) {
        throw new Error('local image missing, refusing to insert without a logo_url (logo_url is NOT NULL)')
      }

      const ext = path.extname(row.localImagePath)
      const fileSlug = path.basename(row.storageDestination, ext).split('/').pop()
      const storagePath = `${STORAGE_FOLDER}/${fileSlug}${ext}`
      const fileBuffer = fs.readFileSync(row.localImagePath)
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, fileBuffer, { contentType: MIME_BY_EXT[ext] ?? 'application/octet-stream', upsert: true })
      if (uploadError) throw new Error(`upload failed: ${uploadError.message}`)
      const logo_url = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath).data.publicUrl

      const dbRow = {
        name: row.name,
        logo_url,
        website_url: row.website_url,
        logo_scale: row.logo_scale,
        sort_order: row.sort_order,
        published: row.published,
      }

      // No unique DB constraint to upsert against (see header comment) —
      // look up by the deterministic logo_url instead, so re-running this
      // script updates the same row rather than inserting a duplicate.
      const { data: existing, error: findError } = await supabase.from('brands').select('id').eq('logo_url', logo_url).limit(1)
      if (findError) throw new Error(`lookup failed: ${findError.message}`)

      if (existing.length > 0) {
        const { error: updateError } = await supabase.from('brands').update(dbRow).eq('id', existing[0].id)
        if (updateError) throw new Error(`update failed: ${updateError.message}`)
      } else {
        const { error: insertError } = await supabase.from('brands').insert(dbRow)
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
