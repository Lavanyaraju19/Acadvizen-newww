import test from 'node:test'
import assert from 'node:assert/strict'

import { GET } from '../../app/api/public-config/route.js'

const originalEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
}

function restoreEnv() {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
}

test('public-config route returns only allow-listed public fields', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'public-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'server-only-secret'

  const response = await GET()
  const payload = await response.json()

  assert.equal(response.status, 200)
  assert.deepEqual(Object.keys(payload).sort(), ['data', 'success'])
  assert.deepEqual(Object.keys(payload.data).sort(), ['anonKey', 'url'])
  assert.equal(payload.data.url, 'https://example.supabase.co')
  assert.equal(payload.data.anonKey, 'public-anon-key')
  assert.equal(JSON.stringify(payload).includes('server-only-secret'), false)

  restoreEnv()
})

test('public-config route reports missing public config without exposing secrets', async () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  delete process.env.SUPABASE_URL
  delete process.env.SUPABASE_ANON_KEY
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'server-only-secret'

  const response = await GET()
  const payload = await response.json()

  assert.equal(response.status, 200)
  assert.equal(payload.success, false)
  assert.equal(typeof payload.error, 'string')
  assert.equal(JSON.stringify(payload).includes('server-only-secret'), false)

  restoreEnv()
})
