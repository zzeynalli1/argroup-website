#!/usr/bin/env node
/**
 * ONE-TIME content migration: src/data/team.js -> Supabase `team_members`
 * table (no Storage migration — no photo exists for any node today, see
 * team.js's own header comment; do not fabricate one).
 *
 * `position` text is resolved from the CURRENT src/locales/<locale>/about.json
 * `leadership.items.<positionKey>.title` values at migration time (Phase 5
 * moves position to free CMS text — this is the one-time transcription of
 * today's translated labels into that free-text column, not an ongoing
 * i18n dependency).
 *
 * Safe by default: running with no flags (or --dry-run) only reads local
 * data and prints the manifest — no network writes happen. Real writes
 * require --apply AND --confirm together, plus real admin credentials
 * (this project's RLS blocks anonymous writes by design).
 *
 * Hierarchy-safe: parent_id references team_members.id, and Supabase
 * assigns that id on insert — local ids ("management", "engineering", ...)
 * are NOT assumed to equal DB ids. This walks the tree breadth-first,
 * resolving and recording each node's real DB id before migrating its
 * children, exactly per the approved migration order.
 *
 * Idempotent WITHOUT relying on a DB unique constraint: `team_members` has
 * no unique column to upsert against. This looks up an existing row by
 * (parent's real DB id, position_az) — position_az is unique per sibling
 * group in today's data — and updates in place if found, inserts if not.
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
 *   node supabase/seed/migrate-team.mjs                  # dry run (default)
 *   node supabase/seed/migrate-team.mjs --dry-run
 *   node supabase/seed/migrate-team.mjs --apply --confirm
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

const { teamData } = await import(pathToFileURL(path.join(REPO_ROOT, 'src/data/team.js')))
const LOCALES = ['az', 'en', 'ru', 'tr']

function loadPositionLabel(positionKey, locale) {
  const aboutPath = path.join(REPO_ROOT, `src/locales/${locale}/about.json`)
  const json = JSON.parse(fs.readFileSync(aboutPath, 'utf8'))
  return json.leadership?.items?.[positionKey]?.title ?? null
}

/** Flattens the local tree into a breadth-first list, each row carrying its
 * LOCAL parent id (not a DB id yet) and its sibling sort_order (*10). */
function flattenBreadthFirst(root) {
  const rows = []
  let queue = [{ node: root, localParentId: null }]
  while (queue.length > 0) {
    const next = []
    queue.forEach(({ node, localParentId }, siblingIndex) => {
      rows.push({
        localId: node.id,
        localParentId,
        name: node.name,
        position: Object.fromEntries(LOCALES.map((l) => [l, loadPositionLabel(node.positionKey, l)])),
        photo: node.photo, // always null today — see header comment
        sort_order: siblingIndex * 10,
      })
      ;(node.children ?? []).forEach((child) => next.push({ node: child, localParentId: node.id }))
    })
    queue = next
  }
  return rows
}

const manifest = flattenBreadthFirst(teamData)

function printManifest() {
  console.log(`\n${DRY_RUN ? 'DRY RUN' : 'APPLY'} — ${manifest.length} team member/role(s)\n`)

  manifest.forEach((row) => {
    console.log(`[${row.localId}] ${row.name ?? '(no verified name — role only)'}`)
    console.log(`   parent:      ${row.localParentId ?? '(root)'}`)
    console.log(`   sort_order:  ${row.sort_order}`)
    console.log(`   position_az: ${row.position.az}`)
    console.log(`   position_en: ${row.position.en}`)
    console.log(`   position_ru: ${row.position.ru}`)
    console.log(`   position_tr: ${row.position.tr}`)
    console.log(`   photo:       ${row.photo ?? '(none — not migrated)'}`)
    console.log('')
  })

  console.log(`Total: ${manifest.length}, missing names: ${manifest.filter((r) => !r.name).length}, photos to migrate: 0`)
  console.log('\nRe-run safety: idempotent by (real parent DB id, position_az) lookup (update-in-place), no Storage objects involved.')
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

  const localIdToDbId = new Map()
  let okCount = 0
  let failCount = 0

  // Rows are already breadth-first, so every row's parent was migrated
  // (and is in localIdToDbId) before this loop reaches it.
  for (const row of manifest) {
    try {
      const parent_id = row.localParentId == null ? null : (localIdToDbId.get(row.localParentId) ?? null)
      if (row.localParentId != null && parent_id == null) {
        throw new Error(`parent "${row.localParentId}" was not migrated first — breadth-first order violated`)
      }

      const dbRow = {
        name: row.name,
        position_az: row.position.az,
        position_en: row.position.en,
        position_ru: row.position.ru,
        position_tr: row.position.tr,
        photo_url: null,
        parent_id,
        sort_order: row.sort_order,
        published: true,
      }

      let query = supabase.from('team_members').select('id').eq('position_az', row.position.az)
      query = parent_id == null ? query.is('parent_id', null) : query.eq('parent_id', parent_id)
      const { data: existing, error: findError } = await query.limit(1)
      if (findError) throw new Error(`lookup failed: ${findError.message}`)

      let dbId
      if (existing.length > 0) {
        const { error: updateError } = await supabase.from('team_members').update(dbRow).eq('id', existing[0].id)
        if (updateError) throw new Error(`update failed: ${updateError.message}`)
        dbId = existing[0].id
      } else {
        const { data: inserted, error: insertError } = await supabase.from('team_members').insert(dbRow).select('id').single()
        if (insertError) throw new Error(`insert failed: ${insertError.message}`)
        dbId = inserted.id
      }

      localIdToDbId.set(row.localId, dbId)
      console.log(`OK   [${row.localId}] -> db id ${dbId}`)
      okCount += 1
    } catch (err) {
      console.error(`FAIL [${row.localId}] — ${err.message}`)
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
