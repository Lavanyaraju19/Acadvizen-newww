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

export function jsonError(error, status = 500, data = null) {
  const httpStatus = (typeof status === 'number' && status >= 400 && status <= 599) ? status : 500
  return NextResponse.json(
    { success: false, data, error: typeof error === 'string' ? error : error?.message || 'Request failed.' },
    { status: httpStatus }
  )
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

function getErrorMessage(error) {
  return String(error?.message || error || '').toLowerCase()
}

function isTransientError(error) {
  const message = getErrorMessage(error)
  return (
    error?.name === 'AbortError' ||
    error?.status >= 500 ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('failed to fetch') ||
    message.includes('econnrefused') ||
    message.includes('etimedout') ||
    message.includes('enotfound') ||
    message.includes('abort') ||
    message.includes('signal') ||
    message.includes('temporarily unavailable')
  )
}

function isTokenRefreshNeeded(error) {
  const message = getErrorMessage(error)
  return message.includes('expired') || message.includes('jwt') || message.includes('token')
}

export function getSupabaseClientOrResponse(request, options = {}) {
  const authToken = getBearerToken(request)
  const preferServiceRole = options?.preferServiceRole === true && hasValidSupabaseServiceRoleKey()
  const supabase = preferServiceRole
    ? getServerSupabaseClient({ preferServiceRole: true })
    : getServerSupabaseClient({ authToken: authToken || null })
  if (!supabase) {
    return {
      supabase: null,
      response: jsonError(
        'Supabase server configuration is invalid. Check SUPABASE_SERVICE_ROLE_KEY or sign in again as admin.',
        500,
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
  const serviceSupabase = hasValidSupabaseServiceRoleKey() ? getServerSupabaseClient({ preferServiceRole: true }) : null
  const verifier = serviceSupabase || authSupabase

  if (!verifier) {
    return {
      ok: false,
      status: 500,
      error: 'Supabase server configuration is invalid. Check SUPABASE_SERVICE_ROLE_KEY or sign in again as admin.',
    }
  }

  try {
    const { data: authData, error: authError } = await verifier.auth.getUser(authToken)

    if (authError || !authData?.user?.id) {
      if (isTransientError(authError)) {
        return { ok: false, status: 503, error: 'Admin session verification is temporarily unavailable. Please retry.', transient: true }
      }

      if (isTokenRefreshNeeded(authError)) {
        return { ok: false, status: 401, error: 'Admin session expired. Please sign in again.', needsRefresh: true }
      }

      return { ok: false, status: 401, error: authError?.message || 'Admin session is invalid. Please sign in again.' }
    }

    const profileClient = serviceSupabase || authSupabase
    if (!profileClient) {
      return { ok: false, status: 500, error: 'Admin profile lookup is unavailable.' }
    }

    const { data: profile, error: profileError } = await profileClient
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle()

    if (profileError) {
      if (isTransientError(profileError)) {
        return { ok: false, status: 503, error: 'Admin profile lookup is temporarily unavailable. Please retry.', transient: true }
      }
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
    if (isTransientError(error)) {
      return { ok: false, status: 503, error: 'Admin session verification is temporarily unavailable. Please retry.', transient: true }
    }
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
