// Renders three static poster photos of Building3DSection's real 3D scene
// (one per camera framing Hero3DScene itself picks between — see that
// file's `detectWideLayout`/`detectPortraitAspect`) and writes them to
// public/images/3d/. These are what Building3DSection shows INSTANTLY (via
// a plain <picture>, no JS/WebGL) while the real scene decides whether/when
// to mount — see that component's own comments for the "poster-first" idea.
//
// Usage: node scripts/render-hero-posters.mjs
// (builds the site, serves the build via `vite preview`, captures each
// poster with Playwright, converts to webp via sharp, then shuts the
// preview server down.)

import { execSync, spawn } from 'node:child_process'
import { mkdirSync, rmSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { chromium } from 'playwright'
import sharp from 'sharp'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const PREVIEW_PORT = 4173
const PREVIEW_URL = `http://localhost:${PREVIEW_PORT}/`
const OUT_DIR = path.join(ROOT, 'public', 'images', '3d')
const TMP_DIR = path.join(ROOT, 'node_modules', '.tmp-hero-posters')
const MAX_BYTES = 250 * 1024

// Kept in sync BY HAND with Hero3DScene.jsx's own `detectWideLayout`
// (width>=1024 && aspect>=1.5) / `detectPortraitAspect` (aspect<1.15) and
// Building3DSection.jsx's <picture> media queries — these three viewports
// are chosen to land squarely in each of those three buckets.
const TARGETS = [
  { name: 'hero-wide', width: 1920, height: 1080, deviceScaleFactor: 1 },
  { name: 'hero-landscape', width: 1366, height: 1024, deviceScaleFactor: 1.5 },
  { name: 'hero-portrait', width: 820, height: 1180, deviceScaleFactor: 1.5 },
]

function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  return new Promise((resolve, reject) => {
    function attempt() {
      fetch(url)
        .then((res) => {
          if (res.ok || res.status === 304) resolve()
          else retry()
        })
        .catch(retry)
    }
    function retry() {
      if (Date.now() > deadline) {
        reject(new Error(`Preview server at ${url} did not come up within ${timeoutMs}ms`))
        return
      }
      setTimeout(attempt, 300)
    }
    attempt()
  })
}

async function capturePoster(browser, target) {
  const context = await browser.newContext({
    viewport: { width: target.width, height: target.height },
    deviceScaleFactor: target.deviceScaleFactor,
  })
  // Runs before any page script on every navigation in this context — skips
  // the branded first-load intro overlay so the scene starts mounting
  // immediately instead of waiting behind that animation.
  await context.addInitScript(() => {
    try {
      window.sessionStorage.setItem('ar-intro-shown', '1')
    } catch {
      // sessionStorage unavailable — intro just plays; harmless for a poster
      // capture, it still finishes well within the 90s wait below.
    }
  })

  const page = await context.newPage()

  let readySignalSeen = false
  // N8AO/Bloom mount on their own later, SEPARATE delay past the base
  // scene's own ready signal (see Hero3DScene's `heavyFxReady`) — only
  // fires on strong-device/non-lowPower mounts (hero-wide/hero-landscape),
  // never on the lowPower portrait target, so this is watched for but not
  // required below.
  let heavyFxSignalSeen = false
  page.on('console', (msg) => {
    const text = msg.text()
    if (text.includes('renderer.info.programs.length')) readySignalSeen = true
    if (text.includes('N8AO/Bloom mounting')) heavyFxSignalSeen = true
  })

  console.log(`[${target.name}] navigating...`)
  await page.goto(PREVIEW_URL, { waitUntil: 'load' })

  console.log(`[${target.name}] waiting for shader program count (max 90s)...`)
  const readyDeadline = Date.now() + 90_000
  while (!readySignalSeen && Date.now() < readyDeadline) {
    await page.waitForTimeout(250)
  }
  if (!readySignalSeen) {
    console.warn(`[${target.name}] WARNING: ready signal not seen within 90s, capturing anyway`)
  }

  // Give N8AO/Bloom a further grace window to mount (lowPower/mobile
  // targets skip them entirely and this signal never arrives, so the wait
  // below is capped, not indefinite) before the fixed settle buffer.
  console.log(`[${target.name}] waiting for N8AO/Bloom (max 60s, skipped on lowPower)...`)
  const heavyFxDeadline = Date.now() + 60_000
  while (!heavyFxSignalSeen && Date.now() < heavyFxDeadline) {
    await page.waitForTimeout(250)
  }

  // Extra settle time past whichever signal above actually fired (shader
  // compile/link for the last-mounted pass still needs a couple of real
  // rendered frames after its own React commit — see Hero3DScene's
  // ReadySignal/ProgramCountLogger comments).
  await page.waitForTimeout(3000)

  await page.addStyleTag({ content: '*{visibility:hidden} canvas{visibility:visible}' })

  // `locator.screenshot()` waits for the target to be "stable" (bounding
  // box unchanged across consecutive animation frames) before it will
  // shoot — on a page that still has in-flight framer-motion/Lenis/
  // route-transition layout work settling, that wait can stall well past
  // a reasonable budget even though the canvas's own position is actually
  // static. `page.screenshot({ clip })` is a more primitive capture with
  // no such actionability wait, so it's used here instead, clipped to the
  // canvas's own (now-measured) bounding box.
  const canvas = page.locator('canvas').first()
  const box = await canvas.boundingBox()
  if (!box) throw new Error(`[${target.name}] canvas has no bounding box`)
  const pngPath = path.join(TMP_DIR, `${target.name}.png`)
  await page.screenshot({ path: pngPath, clip: box })

  await context.close()
  return pngPath
}

async function convertToWebp(pngPath, name) {
  const outPath = path.join(OUT_DIR, `${name}.webp`)
  let quality = 80
  for (; quality >= 40; quality -= 10) {
    await sharp(pngPath).webp({ quality }).toFile(outPath)
    const { size } = statSync(outPath)
    console.log(`[${name}] quality=${quality} -> ${(size / 1024).toFixed(1)}KB`)
    if (size <= MAX_BYTES) return
  }
  console.warn(`[${name}] WARNING: still above ${MAX_BYTES / 1024}KB at lowest tried quality`)
}

async function main() {
  console.log('Building production bundle...')
  execSync('npm run build', { cwd: ROOT, stdio: 'inherit' })

  mkdirSync(OUT_DIR, { recursive: true })
  mkdirSync(TMP_DIR, { recursive: true })

  console.log('Starting preview server...')
  const previewProcess = spawn(
    process.execPath,
    [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), 'preview', '--port', String(PREVIEW_PORT), '--strictPort'],
    { cwd: ROOT, stdio: 'pipe' }
  )
  previewProcess.stdout.on('data', (d) => process.stdout.write(`[preview] ${d}`))
  previewProcess.stderr.on('data', (d) => process.stderr.write(`[preview] ${d}`))

  let browser
  try {
    await waitForServer(PREVIEW_URL, 30_000)
    console.log('Preview server up, launching browser...')

    browser = await chromium.launch()

    for (const target of TARGETS) {
      const pngPath = await capturePoster(browser, target)
      await convertToWebp(pngPath, target.name)
    }
  } finally {
    if (browser) await browser.close()
    previewProcess.kill()
    rmSync(TMP_DIR, { recursive: true, force: true })
    console.log('Preview server stopped, temp files cleaned up.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
