#!/usr/bin/env node
/**
 * ONE-TIME content migration: src/data/projects.js + src/data/projectDetails.js
 * -> Supabase `projects` table + `media/projects/` Storage.
 *
 * Safe by default: running with no flags (or --dry-run) only reads local
 * data/images and prints the manifest — no network writes happen. Real
 * writes require --apply AND --confirm together, plus real admin
 * credentials (this project's RLS blocks anonymous writes by design).
 *
 * Idempotent: images upload to a slug-derived filename with upsert:true
 * (re-running overwrites the same Storage object, never creates a
 * duplicate); rows upsert on the `slug` unique constraint. Re-running
 * AFTER an admin has hand-edited one of these rows will overwrite that
 * edit back to the source-file content — this is a one-time seed, not a
 * sync job.
 *
 * Credentials: never passed on the command line or hardcoded. Reads
 * VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY / ADMIN_EMAIL /
 * ADMIN_PASSWORD from process.env if already set (CI-style), otherwise
 * falls back to the repo-root .env file (gitignored, never committed) —
 * add ADMIN_EMAIL / ADMIN_PASSWORD lines there alongside the existing
 * Supabase vars. Nothing here ever prints their values.
 *
 * Usage:
 *   node supabase/seed/migrate-projects.mjs                  # dry run (default)
 *   node supabase/seed/migrate-projects.mjs --dry-run
 *   node supabase/seed/migrate-projects.mjs --apply --confirm
 *   node supabase/seed/migrate-projects.mjs --apply --confirm --only=afez
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
const ONLY = args.find((a) => a.startsWith('--only='))?.split('=')[1]
const DRY_RUN = !APPLY

const { projects } = await import(pathToFileURL(path.join(REPO_ROOT, 'src/data/projects.js')))
const { projectDetails } = await import(pathToFileURL(path.join(REPO_ROOT, 'src/data/projectDetails.js')))

const LOCALES = ['az', 'en', 'ru', 'tr']
const STORAGE_BUCKET = 'media'
const STORAGE_FOLDER = 'projects'
const MIME_BY_EXT = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' }

function slugFromImagePath(imageWebp) {
  return path.basename(imageWebp, path.extname(imageWebp))
}

function buildManifestRow(project, index) {
  const detail = projectDetails[project.id]
  const slug = slugFromImagePath(project.imageWebp)
  const localImagePath = path.join(REPO_ROOT, 'public', project.imageWebp.replace(/^\//, ''))
  const imageExists = fs.existsSync(localImagePath)

  const missing = []
  if (!detail) missing.push('projectDetails entry (no startDate/endDate/description/workPerformed)')
  if (!imageExists) missing.push(`local image file (${project.imageWebp})`)
  if (!project.completionDate) missing.push('completionDate (expected — not yet verified for any project)')

  return {
    sourceId: project.id,
    slug,
    title: project.title,
    client: project.client,
    location: project.location,
    status: project.status,
    start_date: detail?.startDate ?? null,
    end_date: detail?.endDate ?? null,
    completion_date: project.completionDate ?? null,
    sort_order: index * 10,
    published: true,
    description: Object.fromEntries(LOCALES.map((l) => [l, detail?.description?.[l] ?? null])),
    work_performed: Object.fromEntries(LOCALES.map((l) => [l, detail?.workPerformed?.[l] ?? []])),
    localImagePath,
    imageExists,
    storageDestination: `${STORAGE_BUCKET}/${STORAGE_FOLDER}/${slug}${path.extname(project.imageWebp)}`,
    missing,
  }
}

const manifest = projects
  .map(buildManifestRow)
  .filter((row) => !ONLY || row.slug === ONLY)

function printManifest() {
  console.log(`\n${DRY_RUN ? 'DRY RUN' : 'APPLY'} — ${manifest.length} project(s)\n`)

  const slugs = new Set()
  const duplicateSlugs = new Set()
  for (const row of manifest) {
    if (slugs.has(row.slug)) duplicateSlugs.add(row.slug)
    slugs.add(row.slug)
  }

  for (const row of manifest) {
    console.log(`#${row.sourceId} ${row.title}`)
    console.log(`   slug:        ${row.slug}${duplicateSlugs.has(row.slug) ? '  !!! DUPLICATE SLUG !!!' : ''}`)
    console.log(`   client:      ${row.client}`)
    console.log(`   location:    ${row.location}`)
    console.log(`   status:      ${row.status}`)
    console.log(`   start_date:  ${row.start_date ?? '(null)'}`)
    console.log(`   end_date:    ${row.end_date ?? '(null)'}`)
    console.log(`   completion:  ${row.completion_date ?? '(null)'}`)
    console.log(`   sort_order:  ${row.sort_order}`)
    console.log(`   image:       ${row.localImagePath} -> ${row.storageDestination} ${row.imageExists ? '' : '  !!! FILE MISSING !!!'}`)
    if (row.missing.length > 0) console.log(`   notes:       ${row.missing.join('; ')}`)
    console.log('')
  }

  console.log(`Total: ${manifest.length}, duplicate slugs: ${duplicateSlugs.size}, missing images: ${manifest.filter((r) => !r.imageExists).length}`)
  console.log('\nRe-run safety: idempotent by slug (upsert on conflict) and by deterministic image filename (Storage upsert:true).')
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
      let image_url = null
      if (row.imageExists) {
        const ext = path.extname(row.localImagePath)
        const storagePath = `${STORAGE_FOLDER}/${row.slug}${ext}`
        const fileBuffer = fs.readFileSync(row.localImagePath)
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, fileBuffer, { contentType: MIME_BY_EXT[ext] ?? 'application/octet-stream', upsert: true })
        if (uploadError) throw new Error(`upload failed: ${uploadError.message}`)

        image_url = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath).data.publicUrl
      }

      const dbRow = {
        slug: row.slug,
        title: row.title,
        client: row.client,
        location: row.location,
        status: row.status,
        start_date: row.start_date,
        end_date: row.end_date,
        completion_date: row.completion_date,
        sort_order: row.sort_order,
        published: row.published,
        image_url,
        ...Object.fromEntries(LOCALES.map((l) => [`description_${l}`, row.description[l]])),
        ...Object.fromEntries(LOCALES.map((l) => [`work_performed_${l}`, row.work_performed[l]])),
      }

      const { error: upsertError } = await supabase.from('projects').upsert(dbRow, { onConflict: 'slug' })
      if (upsertError) throw new Error(`upsert failed: ${upsertError.message}`)

      console.log(`OK   #${row.sourceId} ${row.slug}`)
      okCount += 1
    } catch (err) {
      console.error(`FAIL #${row.sourceId} ${row.slug} — ${err.message}`)
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
