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
  preferServiceRole?: boolean
}

export function getServerSupabaseClient(options: ServerClientOptions = {}) {
  if (!SUPABASE_URL) {
    return null
  }

  const authToken = options.authToken || null
  const preferServiceRole = options.preferServiceRole === true

  let serverKey: string
  let globalHeaders: Record<string, string> | undefined

  if (authToken) {
    // User-authenticated request - use anon key + user's auth token
    if (!SUPABASE_ANON_KEY) return null
    serverKey = SUPABASE_ANON_KEY
    globalHeaders = { Authorization: `Bearer ${authToken}` }
  } else if (preferServiceRole && SUPABASE_SERVICE_ROLE_KEY) {
    // Explicitly requested service role - for admin write operations only
    // SECURITY: Only use when a valid admin session has been verified upstream
    serverKey = SUPABASE_SERVICE_ROLE_KEY
  } else {
    // Default to anon key for all public/unauthenticated requests
    // SECURITY: NEVER fall back to service role key - it bypasses RLS
    if (!SUPABASE_ANON_KEY) return null
    serverKey = SUPABASE_ANON_KEY
  }

  return createClient(SUPABASE_URL, serverKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: globalHeaders ? { headers: globalHeaders } : undefined,
  })
}

