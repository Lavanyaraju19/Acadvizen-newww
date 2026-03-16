import { createClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from './env'

function extractProjectRef(url: string) {
  try {
    return new URL(url).hostname.split('.')[0] || ''
  } catch {
    return ''
  }
}

function decodeJwtPayload(token: string) {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as Record<string, unknown>
  } catch {
    return null
  }
}

function keyMatchesProject(url: string, key: string) {
  const projectRef = extractProjectRef(url)
  if (!projectRef || !key) return false
  const payload = decodeJwtPayload(key)
  return payload?.ref === projectRef
}

export function hasValidSupabaseAnonKey() {
  return keyMatchesProject(SUPABASE_URL, SUPABASE_ANON_KEY)
}

export function hasValidSupabaseServiceRoleKey() {
  return keyMatchesProject(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
}

type ServerClientOptions = {
  authToken?: string | null
}

export function getServerSupabaseClient(options: ServerClientOptions = {}) {
  if (!SUPABASE_URL || !(SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY)) {
    return null
  }

  const authToken = options.authToken || null
  const validAnonKey = hasValidSupabaseAnonKey() ? SUPABASE_ANON_KEY : ''
  const validServiceKey = hasValidSupabaseServiceRoleKey() ? SUPABASE_SERVICE_ROLE_KEY : ''
  const serverKey = authToken ? validAnonKey : validServiceKey || validAnonKey

  if (!serverKey) {
    return null
  }

  const globalHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : undefined

  return createClient(SUPABASE_URL, serverKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: globalHeaders ? { headers: globalHeaders } : undefined,
  })
}
