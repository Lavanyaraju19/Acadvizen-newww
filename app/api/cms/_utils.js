import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getServerSupabaseClient, hasValidSupabaseServiceRoleKey } from '../../../lib/supabaseServer'

const CMS_PUBLIC_PATHS = [
  '/',
  '/about',
  '/achievements',
  '/contact',
  '/courses',
  '/placement',
  '/testimonials',
  '/projects',
  '/soft-skills',
  '/hire-from-us',
  '/tools',
  '/blog',
]

export function jsonOk(data = null, extra = {}) {
  return NextResponse.json({ success: true, data, error: null, ...extra }, { status: 200 })
}

export function jsonError(error, status = 200, data = null) {
  return NextResponse.json(
    { success: false, data, error: typeof error === 'string' ? error : error?.message || 'Request failed.' },
    { status }
  )
}

function withTimeout(promise, timeoutMs, message) {
  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs)
  })

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId)
  })
}

function readAuthorizationHeader(request) {
  const direct = request?.headers?.get?.('authorization')
  if (direct) return direct
  try {
    return headers().get('authorization')
  } catch {
    return ''
  }
}

function readAdminCookie(request) {
  const direct = request?.cookies?.get?.('acadvizen_admin_session')?.value
  if (direct) return direct
  try {
    return cookies().get('acadvizen_admin_session')?.value
  } catch {
    return ''
  }
}

function getBearerToken(request) {
  const authorization = String(readAuthorizationHeader(request) || '')
  if (!authorization.toLowerCase().startsWith('bearer ')) return ''
  return authorization.slice(7).trim()
}

export function getSupabaseClientOrResponse(request, options = {}) {
  const authToken = getBearerToken(request)
  const preferServiceRole = options?.preferServiceRole === true && hasValidSupabaseServiceRoleKey()
  const supabase = preferServiceRole
    ? getServerSupabaseClient()
    : getServerSupabaseClient({ authToken: authToken || null })
  if (!supabase) {
    return {
      supabase: null,
      response: jsonError(
        'Supabase server configuration is invalid. Check SUPABASE_SERVICE_ROLE_KEY or sign in again as admin.',
        200,
        []
      ),
    }
  }
  return { supabase, response: null }
}

export function isAdminRequest(request) {
  return Boolean(getBearerToken(request))
}

export async function resolveAdminContext(request) {
  const authToken = getBearerToken(request)
  if (!authToken) {
    return { ok: false, status: 401, error: 'Admin session expired. Please sign in again.' }
  }

  const authSupabase = getServerSupabaseClient({ authToken })
  const serviceSupabase = hasValidSupabaseServiceRoleKey() ? getServerSupabaseClient() : null
  const verifier = serviceSupabase || authSupabase

  if (!verifier) {
    return {
      ok: false,
      status: 500,
      error: 'Supabase server configuration is invalid. Check SUPABASE_SERVICE_ROLE_KEY or sign in again as admin.',
    }
  }

  try {
    const { data: authData, error: authError } = await withTimeout(
      verifier.auth.getUser(authToken),
      7000,
      'Admin session lookup timed out.'
    )

    if (authError || !authData?.user?.id) {
      return { ok: false, status: 401, error: authError?.message || 'Admin session is invalid. Please sign in again.' }
    }

    const profileClient = serviceSupabase || authSupabase
    if (!profileClient) {
      return { ok: false, status: 500, error: 'Admin profile lookup is unavailable.' }
    }

    const { data: profile, error: profileError } = await withTimeout(
      profileClient
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle(),
      7000,
      'Admin profile lookup timed out.'
    )

    if (profileError) {
      return { ok: false, status: 401, error: profileError.message || 'Unable to verify the admin profile.' }
    }

    if (!profile) {
      return { ok: false, status: 403, error: 'Admin profile is missing for this account.' }
    }

    if (profile.role !== 'admin') {
      return { ok: false, status: 403, error: 'This account does not have admin access.' }
    }

    return {
      ok: true,
      status: 200,
      authToken,
      user: authData.user,
      profile,
    }
  } catch (error) {
    return {
      ok: false,
      status: 500,
      error: error?.message || 'Unable to verify the admin session.',
    }
  }
}

export async function ensureAdmin(request) {
  const result = await resolveAdminContext(request)
  if (!result.ok) {
    return jsonError(result.error, result.status || 401, null)
  }
  return null
}

export async function readJsonBody(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export function parsePositiveInt(value, fallback = 0) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return fallback
  return Math.floor(parsed)
}

export function normalizePagePath(slug = '') {
  const trimmed = String(slug || '').trim().replace(/^\/+|\/+$/g, '')
  if (!trimmed || trimmed === 'home') return '/'
  return `/${trimmed}`
}

export function revalidateCmsPaths(paths = []) {
  const unique = Array.from(
    new Set(
      paths
        .map((value) => String(value || '').trim())
        .filter((value) => value.startsWith('/'))
    )
  )

  unique.forEach((path) => {
    try {
      revalidatePath(path)
    } catch {
      // ignore revalidation failures so the write action itself can still succeed
    }
  })
}

export function revalidateAllCmsPages(extraPaths = []) {
  revalidateCmsPaths([...CMS_PUBLIC_PATHS, ...extraPaths])
}
