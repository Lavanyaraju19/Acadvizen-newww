import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// To retire the legacy Supabase keys (JWT anon / service_role), production must be able to run on the new
// keys (SUPABASE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) without any code path still depending on
// the legacy variables. Each read must prefer the new key and only fall back.
const root = fileURLToPath(new URL('../../', import.meta.url))
const files = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) => {
  const rel = path.join(dir, e.name)
  if (e.isDirectory()) return e.name === 'node_modules' ? [] : files(rel)
  return /\.(js|jsx|ts|tsx|mjs|cjs)$/.test(e.name) ? [rel] : []
})

test('every server read of the service key prefers SUPABASE_SECRET_KEY', () => {
  const offenders = []
  for (const file of ['app', 'lib', 'src', 'components'].flatMap(files)) {
    const source = fs.readFileSync(path.join(root, file), 'utf8')
    for (const m of source.matchAll(/process\.env\.SUPABASE_SERVICE_ROLE_KEY/g)) {
      const before = source.slice(Math.max(0, m.index - 80), m.index)
      if (!/SUPABASE_SECRET_KEY\s*\|\|\s*$/.test(before) && !/!process\.env\.SUPABASE_SECRET_KEY && !$/.test(before)) offenders.push(file)
    }
  }
  assert.deepEqual(offenders, [])
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
