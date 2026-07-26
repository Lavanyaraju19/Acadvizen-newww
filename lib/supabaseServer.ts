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
    if (process.env.NODE_ENV === 'development') {
      console.warn('[supabaseServer] Missing Supabase URL or keys. Check environment variables.')
    }
    return null
  }

  const authToken = options.authToken || null
  const validAnonKey = hasValidSupabaseAnonKey() ? SUPABASE_ANON_KEY : ''
  const validServiceKey = hasValidSupabaseServiceRoleKey() ? SUPABASE_SERVICE_ROLE_KEY : ''

  // SECURITY: When an auth token is provided, we should ONLY use the anon key
  // with the auth token as Authorization header. Service role key should NEVER
  // be used with a user auth token.
  // When NO auth token is provided, use service role key (for server-side admin ops).
  // But log a warning when service role key is used without explicit admin auth.
  let serverKey: string
  let globalHeaders: Record<string, string> | undefined

  if (authToken) {
    // User-authenticated request - use anon key + user's auth token
    serverKey = validAnonKey
    globalHeaders = { Authorization: `Bearer ${authToken}` }
  } else if (validServiceKey) {
    // Server-side operation with service role (bypasses RLS)
    // Only use this for admin operations that need full access
    serverKey = validServiceKey
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[supabaseServer] Using SERVICE_ROLE_KEY without auth token. ' +
        'This bypasses RLS policies. Ensure this call is properly authenticated upstream.'
      )
    }
  } else {
    // Fallback to anon key
    serverKey = validAnonKey
  }

  if (!serverKey) {
    return null
  }

  return createClient(SUPABASE_URL, serverKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: globalHeaders ? { headers: globalHeaders } : undefined,
  })
}
