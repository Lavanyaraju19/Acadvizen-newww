import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { isServerSupabaseKey, selectSupabaseServiceKey } from '../../lib/supabaseServiceKey.js'

// To retire the legacy Supabase keys (JWT anon / service_role), production must be able to run on the new
// keys (SUPABASE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) without any code path still depending on
// the legacy variables. Each read must prefer the new key and only fall back.
const root = fileURLToPath(new URL('../../', import.meta.url))
const files = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) => {
  const rel = path.join(dir, e.name)
  if (e.isDirectory()) return e.name === 'node_modules' ? [] : files(rel)
  return /\.(js|jsx|ts|tsx|mjs|cjs)$/.test(e.name) ? [rel] : []
})

// Made-up keys, assembled at run time so no key-shaped literal sits in the repository.
const jwt = (payload) => ['{"alg":"HS256","typ":"JWT"}', JSON.stringify(payload), 'signature']
  .map((part, i) => (i < 2 ? Buffer.from(part).toString('base64url') : part)).join('.')
const NEW_SECRET = ['sb', 'secret', 'Abc123_def-456ghi789jkl'].join('_')
const NEW_PUBLISHABLE = ['sb', 'publishable', 'Abc123_def-456ghi789jkl'].join('_')
const LEGACY_SERVICE = jwt({ iss: 'supabase', ref: 'abcdefghijklmnopqrst', role: 'service_role' })
const LEGACY_ANON = jwt({ iss: 'supabase', ref: 'abcdefghijklmnopqrst', role: 'anon' })

test('the new secret key is used when it is a valid server key', () => {
  assert.equal(selectSupabaseServiceKey({ SUPABASE_SECRET_KEY: NEW_SECRET, SUPABASE_SERVICE_ROLE_KEY: LEGACY_SERVICE }), NEW_SECRET)
  assert.equal(selectSupabaseServiceKey({ SUPABASE_SECRET_KEY: NEW_SECRET }), NEW_SECRET)
  assert.equal(selectSupabaseServiceKey({ SUPABASE_SECRET_KEY: `  ${NEW_SECRET}\n` }), NEW_SECRET)
  // A legacy service_role JWT placed in the new variable is still a server key.
  assert.equal(selectSupabaseServiceKey({ SUPABASE_SECRET_KEY: LEGACY_SERVICE }), LEGACY_SERVICE)
})

test('production today (legacy key only) keeps using the legacy key', () => {
  assert.equal(selectSupabaseServiceKey({ SUPABASE_SERVICE_ROLE_KEY: LEGACY_SERVICE }), LEGACY_SERVICE)
  assert.equal(selectSupabaseServiceKey({ SUPABASE_SECRET_KEY: undefined, SUPABASE_SERVICE_ROLE_KEY: LEGACY_SERVICE }), LEGACY_SERVICE)
})

test('an empty, malformed or non-server new key never displaces the legacy key', () => {
  for (const bad of ['', '   ', 'undefined', 'sb_secret_', 'sb_secret_short', NEW_PUBLISHABLE, LEGACY_ANON, 'not.a.jwt', 'eyJ.eyJ.x']) {
    assert.equal(isServerSupabaseKey(bad), false, `rejected as a server key: ${bad.slice(0, 12)}`)
    assert.equal(selectSupabaseServiceKey({ SUPABASE_SECRET_KEY: bad, SUPABASE_SERVICE_ROLE_KEY: LEGACY_SERVICE }), LEGACY_SERVICE)
  }
})

test('nothing configured gives an empty key (callers then refuse safely), never a wrong one', () => {
  assert.equal(selectSupabaseServiceKey({}), '')
  assert.equal(selectSupabaseServiceKey({ SUPABASE_SECRET_KEY: NEW_PUBLISHABLE }), '')
})

test('every server read of the service key goes through the validated picker', () => {
  const offenders = []
  for (const file of ['app', 'lib', 'src', 'components'].flatMap(files)) {
    const source = fs.readFileSync(path.join(root, file), 'utf8')
    for (const m of source.matchAll(/process\.env\.SUPABASE_SERVICE_ROLE_KEY/g)) {
      const before = source.slice(Math.max(0, m.index - 160), m.index)
      const inPicker = /selectSupabaseServiceKey\(\{\s*SUPABASE_SECRET_KEY:\s*process\.env\.SUPABASE_SECRET_KEY,\s*SUPABASE_SERVICE_ROLE_KEY:\s*$/.test(before)
      if (!inPicker && !/!process\.env\.SUPABASE_SECRET_KEY && !$/.test(before)) offenders.push(file)
    }
  }
  assert.deepEqual(offenders, [])
})

test('the admin notification routes refuse with 503 instead of calling Supabase without a key', () => {
  for (const file of ['app/api/admin/notifications/route.js', 'app/api/admin/notifications/[id]/read/route.js']) {
    const source = fs.readFileSync(path.join(root, file), 'utf8')
    const creates = source.match(/createClient\(/g) || []
    const guards = source.match(/if \(!process\.env\.NEXT_PUBLIC_SUPABASE_URL \|\| !serviceKey\) return notConfigured\(\)\s*const supabase = createClient\(process\.env\.NEXT_PUBLIC_SUPABASE_URL, serviceKey\)/g) || []
    assert.ok(creates.length > 0, file)
    assert.equal(guards.length, creates.length, `${file}: every client is created behind the guard`)
    assert.match(source, /status: 503/)
    assert.doesNotMatch(source, /error: [^\n]*serviceKey/, 'the key never appears in a response')
  }
})

test('every read of the anon key prefers the publishable key', () => {
  const offenders = []
  for (const file of ['app', 'lib', 'src', 'components'].flatMap(files)) {
    const source = fs.readFileSync(path.join(root, file), 'utf8')
    for (const m of source.matchAll(/process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY/g)) {
      const before = source.slice(Math.max(0, m.index - 200), m.index)
      if (!/PUBLISHABLE_KEY/.test(before)) offenders.push(file)
    }
  }
  assert.deepEqual(offenders, [])
})
