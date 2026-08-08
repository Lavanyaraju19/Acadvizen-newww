import { createClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from './env'

function extractProjectRef(url: string) {
  try {
    return new URL(url).hostname.split('.')[0] || ''
  } catch {
    return ''
  }
}

function isLocalSupabaseUrl(url: string) {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
  } catch {
    return false
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

// Supabase's newer API keys (sb_publishable_..., sb_secret_...) are opaque tokens, not JWTs -
// there's no local ref/role claim to decode and check. The key's own prefix already encodes its
// role (publishable = anon-equivalent, secret = service_role-equivalent) and the key is
// inherently scoped to whichever project issued it, so format-matching is the correct - and only
// available - local validation for this key style.
function matchesNewStyleKey(key: string, expectedRole?: string) {
  if (expectedRole === 'service_role') return key.startsWith('sb_secret_')
  if (expectedRole === 'anon') return key.startsWith('sb_publishable_')
  return key.startsWith('sb_secret_') || key.startsWith('sb_publishable_')
}

function keyMatchesProject(url: string, key: string, expectedRole?: string) {
  if (!url || !key) return false

  if (key.startsWith('sb_secret_') || key.startsWith('sb_publishable_')) {
    return matchesNewStyleKey(key, expectedRole)
  }

  const payload = decodeJwtPayload(key)
  if (!payload) return false

  if (expectedRole && payload.role !== expectedRole) return false

  if (isLocalSupabaseUrl(url)) {
    return true
  }

  const projectRef = extractProjectRef(url)
  if (!projectRef) return false
  return payload.ref === projectRef
}

export function hasValidSupabaseAnonKey() {
  return keyMatchesProject(SUPABASE_URL, SUPABASE_ANON_KEY, 'anon')
}

export function hasValidSupabaseServiceRoleKey() {
  return keyMatchesProject(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, 'service_role')
}

type ServerClientOptions = {
  authToken?: string | null
  preferServiceRole?: boolean
}

function noStoreSupabaseFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  return fetch(input, {
    ...init,
    cache: 'no-store',
    next: {
      ...(init as RequestInit & { next?: Record<string, unknown> }).next,
      revalidate: 0,
    },
  } as RequestInit)
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
    global: {
      ...(globalHeaders ? { headers: globalHeaders } : {}),
      fetch: noStoreSupabaseFetch,
    },
  })
}
