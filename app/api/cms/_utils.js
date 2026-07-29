import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getServerSupabaseClient, hasValidSupabaseServiceRoleKey } from '../../../lib/supabaseServer'
import { logger } from '../../../lib/productionLogger'
import {
  canAccessAdminProfile,
  enrichAdminProfile,
  hasProfilePermission,
  inferCmsPermissionFromPath,
} from '../../../lib/adminPermissions'

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

// ── Standardized JSON responses ─────────────────────────────────────────

export function jsonOk(data = null, extra = {}) {
  return NextResponse.json({ success: true, data, error: null, ...extra }, { status: 200 })
}

export function jsonError(error, status = 500, data = null) {
  const httpStatus = (typeof status === 'number' && status >= 400 && status <= 599) ? status : 500
  // Never expose stack traces in production
  const message = typeof error === 'string' ? error : (error?.message || 'Request failed.')
  return NextResponse.json(
    { success: false, data, error: message },
    { status: httpStatus }
  )
}

// ── Auth helpers ────────────────────────────────────────────────────────

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

export function hasAdminAuthorizationHint(request) {
  return Boolean(getBearerToken(request) || readAdminCookie(request))
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
  const authToken = getBearerToken(request) || readAdminCookie(request)
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
    let authData = null
    let authError = null

    const primaryAuthResult = await verifier.auth.getUser(authToken)
    authData = primaryAuthResult.data || null
    authError = primaryAuthResult.error || null

    if ((authError || !authData?.user?.id) && serviceSupabase && authSupabase && verifier === serviceSupabase) {
      const fallbackAuthResult = await authSupabase.auth.getUser(authToken)
      authData = fallbackAuthResult.data || null
      authError = fallbackAuthResult.error || null
    }

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

    let profile = null
    let profileError = null

    const primaryProfileResult = await profileClient
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle()

    profile = primaryProfileResult.data || null
    profileError = primaryProfileResult.error || null

    if ((profileError || !profile) && serviceSupabase && authSupabase && profileClient === serviceSupabase) {
      const fallbackProfileResult = await authSupabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle()

      profile = fallbackProfileResult.data || null
      profileError = fallbackProfileResult.error || null
    }

    if (profileError) {
      if (isTransientError(profileError)) {
        return { ok: false, status: 503, error: 'Admin profile lookup is temporarily unavailable. Please retry.', transient: true }
      }
      return { ok: false, status: 401, error: profileError.message || 'Unable to verify the admin profile.' }
    }

    if (!profile) {
      return { ok: false, status: 403, error: 'Admin profile is missing for this account.' }
    }

    let userRoles = []
    if (serviceSupabase) {
      const { data: assignments } = await serviceSupabase
        .from('user_roles')
        .select(`
          role_id,
          roles (
            id,
            name,
            slug,
            permissions
          )
        `)
        .eq('user_id', authData.user.id)

      userRoles = Array.isArray(assignments) ? assignments : []
    }

    const enrichedProfile = enrichAdminProfile({
      ...profile,
      user_roles: userRoles,
    })

    if (!canAccessAdminProfile(enrichedProfile)) {
      return { ok: false, status: 403, error: 'This account does not have admin access.' }
    }

    return {
      ok: true,
      status: 200,
      authToken,
      user: authData.user,
      profile: enrichedProfile,
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

function resolveRequiredPermission(request, permissionOverride = null) {
  if (permissionOverride && typeof permissionOverride === 'object') {
    return permissionOverride
  }

  const pathname = request?.nextUrl?.pathname || new URL(request.url).pathname
  return inferCmsPermissionFromPath(pathname, request.method)
}

export async function requireAdminContext(request, permissionOverride = null) {
  const result = await resolveAdminContext(request)
  if (!result.ok) {
    return {
      context: null,
      response: jsonError(result.error, result.status || 401, null),
      requiredPermission: null,
    }
  }

  const requiredPermission = resolveRequiredPermission(request, permissionOverride)

  if (requiredPermission && !hasProfilePermission(result.profile, requiredPermission.resource, requiredPermission.action)) {
    return {
      context: null,
      response: jsonError('This account does not have permission to perform this action.', 403, null),
      requiredPermission,
    }
  }

  return {
    context: result,
    response: null,
    requiredPermission,
  }
}

export async function ensureAdmin(request, permissionOverride = null) {
  const { response } = await requireAdminContext(request, permissionOverride)
  return response
}

export async function getOptionalAdminContext(request, permissionOverride = null) {
  if (!hasAdminAuthorizationHint(request)) {
    return {
      context: null,
      response: null,
      requiredPermission: null,
    }
  }

  return requireAdminContext(request, permissionOverride)
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
