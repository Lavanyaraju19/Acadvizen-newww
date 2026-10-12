import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// The secret guard (tools/check-secrets.mjs) runs before every commit and on every push. These samples
// are synthetic, not real credentials.
const guard = fileURLToPath(new URL('../../tools/check-secrets.mjs', import.meta.url))

function stagedRepo(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'secret-guard-'))
  execFileSync('git', ['init', '-q'], { cwd: dir })
  for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), text)
  execFileSync('git', ['add', '-f', ...Object.keys(files)], { cwd: dir })
  return spawnSync(process.execPath, [guard, '--staged'], { cwd: dir, encoding: 'utf8' })
}

test('real-looking secrets and environment files are refused, without printing them', () => {
  const secret = 'Zq8xK2pLm9rT4wVb'
  const run = stagedRepo({
    'a.js': [
      `const url = 'postgresql://postgres:${secret}@db.example.supabase.co:5432/postgres'`,
      `const c = { password: '${secret}' }`,
      `SUPABASE_SERVICE_ROLE_KEY=${secret}${secret}`,
      'const jwt = \'eyJhbGciOiJIUzI1NiJ9abcdefghijklmn.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.abcdefghijklmnop\'', // secret-scan: allow (synthetic sample)
    ].join('\n'),
    '.env.production': 'X=1\n',
  })
  assert.equal(run.status, 1)
  assert.match(run.stderr, /\.env\.production {2}environment files must never be committed/)
  for (const line of [1, 2, 3, 4]) assert.match(run.stderr, new RegExp(`a\\.js:${line} `))
  assert.equal(run.stderr.includes(secret), false, 'the guard must never print a secret')
})

test('environment references, placeholders and made-up test values pass', () => {
  const run = stagedRepo({
    'b.js': [
      'const c = { password: process.env.SUPABASE_DB_PASSWORD }',
      "const d = { password: 'your-password-here' }",
      "process.env.SUPABASE_SERVICE_ROLE_KEY = 'server-only-secret'",
      'const url = `postgresql://postgres:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD || "")}@host/db`',
    ].join('\n'),
    '.env.example': 'SUPABASE_SERVICE_ROLE_KEY=your-service-role-key\n',
  })
  assert.equal(run.status, 0, run.stderr)
})
