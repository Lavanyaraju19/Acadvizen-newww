// One-time credential sanitizer. Patterns are split via char codes so that
// this file does not itself embed plaintext secrets in the repository.
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')

function dec(parts) {
  return parts.map((c) => String.fromCharCode(c)).join('')
}

const ADMIN_AT_2026 = dec([65, 100, 109, 105, 110, 64, 65, 99, 97, 100, 118, 105, 122, 101, 110, 50, 48, 50, 54])
const ADMIN_123456 = dec([97, 100, 109, 105, 110, 49, 50, 51, 52, 53, 54])
const ADMIN_123 = dec([97, 100, 109, 105, 110, 49, 50, 51])

const files = [
  'scripts/apply-migration.js',
  'scripts/check-local-supabase.js',
  'scripts/cleanup-test-data.js',
  'scripts/inspect-db-v2.cjs',
  'scripts/inspect-db.cjs',
  'scripts/restore-pages.js',
  'scripts/seed-admin.js',
  'scripts/seed-admin-final.js',
  'scripts/seed-admin-v5.js',
  'scripts/seed-local-admin-v2.js',
  'scripts/seed-local-admin-v3.js',
  'scripts/seed-local-admin-v4.js',
  'scripts/seed-local-admin.js',
  'scripts/seed-remote-admin-v2.js',
  'scripts/seed-remote-admin.js',
]

const JWT_PATTERN = /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g

function quote(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const PASSWORD_REPLACEMENTS = [
  [new RegExp(`['"]${quote(ADMIN_AT_2026)}['"]`, 'g'), 'process.env.ADMIN_PASSWORD'],
  [new RegExp(`['"]${quote(ADMIN_123456)}['"]`, 'g'), 'process.env.ADMIN_PASSWORD'],
  [new RegExp(`['"]${quote(ADMIN_123)}['"]`, 'g'), 'process.env.ADMIN_PASSWORD'],
]

const CONSOLE_PASSWORD_REPLACEMENTS = [
  [new RegExp(`Password:\\s*['"]?${quote(ADMIN_123456)}['"]?`, 'gi'), 'Password: (see ADMIN_PASSWORD env)'],
  [new RegExp(`\\/\\s*${quote(ADMIN_123456)}\\b`, 'gi'), '/ (see ADMIN_PASSWORD env)'],
  [new RegExp(`admin@acadvizen\\.com\\s*\\/\\s*${quote(ADMIN_123456)}`, 'gi'), 'admin@acadvizen.com / (see ADMIN_PASSWORD env)'],
  [new RegExp(`Password:\\s*${quote(ADMIN_123)}\\b`, 'gi'), 'Password: (see ADMIN_PASSWORD env)'],
]

let changedCount = 0

for (const file of files) {
  const absPath = path.join(ROOT, file)
  if (!fs.existsSync(absPath)) {
    console.log('SKIP', file)
    continue
  }

  let content = fs.readFileSync(absPath, 'utf8')
  let changed = false

  content = content.replace(JWT_PATTERN, () => {
    changed = true
    return 'process.env.SUPABASE_SERVICE_ROLE_KEY'
  })

  for (const [pattern, replacement] of [...PASSWORD_REPLACEMENTS, ...CONSOLE_PASSWORD_REPLACEMENTS]) {
    content = content.replace(pattern, () => {
      changed = true
      return replacement
    })
  }

  if (changed) {
    fs.writeFileSync(absPath, content)
    changedCount += 1
    console.log('REDACTED', file)
  }
}

console.log('done, redacted files:', changedCount)

