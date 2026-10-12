// Chooses the server-only Supabase key. The new secret key (SUPABASE_SECRET_KEY, "sb_secret_…") is
// preferred so the legacy service_role JWT (SUPABASE_SERVICE_ROLE_KEY) can be retired later without a
// code change. The new variable is used only when its value has the shape of a server key; an empty,
// malformed or publishable value there falls back to the legacy variable instead of breaking every
// privileged read. Plain JavaScript without Node-only APIs, so the Edge middleware can use it too.
// Tests: tests/unit/supabase-key-rotation.test.js.

function jwtRole(value) {
  const parts = value.split('.')
  if (parts.length !== 3) return null
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4)))
    return typeof payload?.role === 'string' ? payload.role : null
  } catch {
    return null
  }
}

export function isServerSupabaseKey(value) {
  const key = String(value || '').trim()
  if (!key) return false
  if (key.startsWith('sb_secret_')) return /^sb_secret_[A-Za-z0-9_-]{16,}$/.test(key)
  return jwtRole(key) === 'service_role'
}

/** @param {{ SUPABASE_SECRET_KEY?: string, SUPABASE_SERVICE_ROLE_KEY?: string }} [env] */
export function selectSupabaseServiceKey(env = process.env) {
  const secretKey = String(env.SUPABASE_SECRET_KEY || '').trim()
  if (isServerSupabaseKey(secretKey)) return secretKey
  return String(env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
}
