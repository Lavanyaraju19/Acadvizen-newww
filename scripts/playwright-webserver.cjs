const fs = require('node:fs')
const path = require('node:path')
const { spawn, spawnSync } = require('node:child_process')
const { KNOWN_PRODUCTION_PROJECT_REFS } = require('../e2e/safety')

const args = process.argv.slice(2)
const nextCliPath = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'bin', 'next')

// This server runs `next start`, which serves the ALREADY-BUILT .next/ directory as-is -
// NEXT_PUBLIC_* env vars are statically inlined into that build at `next build` time, not
// re-read at request time. If .next/ was last built against production config (e.g. a
// deliberate production-build verification step run earlier, unrelated to this test run) and
// nobody rebuilds before the next E2E run, every server-side call that reads those inlined
// values - most notably /api/admin/login's direct fetch to the Supabase auth endpoint - silently
// targets production instead of the local/disposable stack the test env vars declare, with no
// error of any kind. Confirmed reproducible: a production `next build` followed by an E2E run
// sent real (failed, non-destructive) login attempts to production Supabase auth. Scan the
// build output for the known-production project ref before ever starting it, mirroring the same
// hard-blocklist e2e/safety.js already applies to the test process's own declared env vars -
// this closes the gap for the built server artifact itself, which that check cannot see.
function findProductionRefInBuild(dir, budget = { filesScanned: 0 }) {
  const MAX_FILES = 20000
  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return null
  }

  for (const entry of entries) {
    if (budget.filesScanned > MAX_FILES) return null
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const found = findProductionRefInBuild(fullPath, budget)
      if (found) return found
    } else if (entry.isFile() && /\.(js|json)$/.test(entry.name)) {
      budget.filesScanned += 1
      let contents
      try {
        contents = fs.readFileSync(fullPath, 'utf8')
      } catch {
        continue
      }
      const match = KNOWN_PRODUCTION_PROJECT_REFS.find((ref) => contents.includes(ref))
      if (match) return { file: fullPath, ref: match }
    }
  }
  return null
}

const nextServerDir = path.join(__dirname, '..', '.next', 'server')
const productionRefHit = findProductionRefInBuild(nextServerDir)
if (productionRefHit) {
  console.error(
    '\n[playwright-webserver] REFUSING TO START.\n' +
    `The current .next build contains the known-production Supabase project reference ` +
    `"${productionRefHit.ref}" (found inlined in ${path.relative(path.join(__dirname, '..'), productionRefHit.file)}).\n` +
    'This build was produced with production config and, once served, would send real requests ' +
    '(e.g. admin login) to production Supabase regardless of the local/disposable env vars this ' +
    'test run declares.\n' +
    'Fix: rebuild against the local/disposable stack before running E2E tests, e.g.:\n' +
    '  rm -rf .next && npm run build   (with local/disposable Supabase env vars exported)\n'
  )
  process.exit(1)
}

const child = spawn(process.execPath, [nextCliPath, 'start', ...args], {
  stdio: 'inherit',
  windowsHide: true,
})

let shuttingDown = false

function killChildProcess() {
  if (!child.pid || shuttingDown) {
    return
  }

  shuttingDown = true

  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    })
    return
  }

  child.kill('SIGTERM')
}

child.on('exit', (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0))
})

child.on('error', (error) => {
  console.error(error)
  process.exit(1)
})

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => {
    killChildProcess()
  })
}

process.on('exit', () => {
  killChildProcess()
})
