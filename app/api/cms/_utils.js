import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { revalidatePath, revalidateTag } from 'next/cache'
import { getServerSupabaseClient, hasValidSupabaseServiceRoleKey } from '../../../lib/supabaseServer'
import { csrfProtection } from '../../../lib/csrf'
import { logger } from '../../../lib/productionLogger'
import { getCmsCacheTargets, CMS_CONTENT_TYPES } from '../../../lib/cmsPublishing'
import {
  canAccessAdminProfile,
  enrichAdminProfile,
  hasProfilePermission,
  inferCmsPermissionFromPath,
} from '../../../lib/adminPermissions'

export const CMS_PUBLIC_PATHS = [
  '/',
  '/about',
  '/achievements',
  '/blog',
  '/blog/category',
  '/blog/tag',
  '/blog/author',
  '/contact',
  '/courses',
  '/placement',
  '/projects',
  '/soft-skills',
  '/hire-from-us',
  '/tools',
  '/testimonials',
  '/sitemap.xml',
  '/robots.txt',
]

// ── Standardized JSON responses ─────────────────────────────────────────

export function jsonOk(data = null, extra = {}) {
  return NextResponse.json({ success: true, data, error: null, ...extra }, { status: 200 })
}

export function jsonError(error, status = 500, data = null) {
  const httpStatus = (typeof status === 'number' && status >= 400 && status <= 599) ? status : 500
  const message = typeof error === 'string' ? error : (error?.message || 'Request failed.')
  return NextResponse.json(
    { success: false, data, error: message },
    { status: httpStatus }
  )
}

// ── Auth helpers ────────────────────────────────────────────────────────

async function readAuthorizationHeader(request) {
  const direct = request?.headers?.get?.('authorization')
  if (direct) return direct
  try {
    const headerStore = await headers()
    return headerStore.get('authorization')
  } catch {
    return ''
  }
}

async function readAdminCookie(request) {
  const direct = request?.cookies?.get?.('acadvizen_admin_session')?.value
  if (direct) return direct
  try {
    const cookieStore = await cookies()
    return cookieStore.get('acadvizen_admin_session')?.value
  } catch {
    return ''
  }
}

async function getBearerToken(request) {
  const authorization = String(await readAuthorizationHeader(request) || '')
  if (!authorization.toLowerCase().startsWith('bearer ')) return ''
  return authorization.slice(7).trim()
}

export async function hasAdminAuthorizationHint(request) {
  return Boolean(await getBearerToken(request) || await readAdminCookie(request))
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

export async function getSupabaseClientOrResponse(request, options = {}) {
  const authToken = await getBearerToken(request)
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

export async function isAdminRequest(request) {
  return Boolean(await getBearerToken(request))
}

export async function resolveAdminContext(request) {
  const authToken = await getBearerToken(request) || await readAdminCookie(request)
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
  // Centralized here instead of per-route: csrfProtection() was only ever wired into 2 of the
  // ~60 mutating CMS API routes (the generic entities routes), leaving every dedicated route
  // (pages, blogs, forms, media, templates, users, banners, popups, ...) with no Origin/Referer
  // check at all. The admin session cookie is SameSite=Lax + httpOnly, which already blocks the
  // classic cross-site auto-submit CSRF attack, but that's one layer, not defense in depth - and
  // every route already calls requireAdminContext/ensureAdmin, so this is the one place that
  // guarantees every admin-authenticated mutation gets checked without having to touch 60 files.
  const csrfError = csrfProtection(request)
  if (csrfError) {
    return { context: null, response: csrfError, requiredPermission: null }
  }

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
  if (!(await hasAdminAuthorizationHint(request))) {
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

  const errors = []
  unique.forEach((path) => {
    try {
      revalidatePath(path)
    } catch (error) {
      errors.push({ path, error: error?.message || String(error) })
      logger.warn('CMS path revalidation failed.', { path, error: error?.message || String(error) })
    }
  })

  return {
    ok: errors.length === 0,
    paths: unique,
    errors,
  }
}

export function revalidateAllCmsPages(extraPaths = []) {
  return revalidateCmsPaths([...CMS_PUBLIC_PATHS, ...extraPaths])
}

export function revalidateCmsMutation(contentType, options = {}) {
  const targets = getCmsCacheTargets(contentType, {
    slug: options.slug,
    previousSlug: options.previousSlug,
    extraPaths: [...CMS_PUBLIC_PATHS, ...(options.extraPaths || [])],
    extraTags: options.extraTags || [],
  })

  const errors = []
  for (const path of targets.paths) {
    try {
      revalidatePath(path)
    } catch (error) {
      errors.push({ target: path, type: 'path', error: error?.message || String(error) })
    }
  }

  for (const tag of targets.tags) {
    try {
      revalidateTag(tag)
    } catch (error) {
      errors.push({ target: tag, type: 'tag', error: error?.message || String(error) })
    }
  }

  const result = {
    ok: errors.length === 0,
    paths: targets.paths,
    tags: targets.tags,
    errors,
  }

  if (!result.ok) {
    logger.warn('CMS mutation revalidation failed.', {
      content_type: contentType,
      slug: options.slug,
      previous_slug: options.previousSlug,
      errors: result.errors,
    })
  }

  return result
}

// ── Audit log ────────────────────────────────────────────────────────────
// The audit_log table and log_audit() RPC (supabase/migrations/20260722_user_management_rbac.sql)
// existed but nothing in the app ever called them, so "who changed what and when" was untracked
// despite the schema being there. This is a best-effort, fire-and-forget write (using the same
// service-role client the caller already has) - a logging failure must never fail the actual
// mutation it's describing, so errors are only logged, never thrown.
export async function logAuditEvent(supabase, { userId, action, entityType, entityId, changes, request } = {}) {
  if (!supabase || !userId || !action || !entityType) return
  try {
    const { error } = await supabase.rpc('log_audit', {
      p_user_id: userId,
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId || null,
      p_changes: changes && typeof changes === 'object' ? changes : {},
      p_ip_address: request ? (request.headers?.get?.('x-forwarded-for') || '').split(',')[0]?.trim() || null : null,
      p_user_agent: request ? request.headers?.get?.('user-agent') || null : null,
    })
    if (error) logger.warn('Audit log write failed.', { action, entity_type: entityType, entity_id: entityId, error: error.message })
  } catch (error) {
    logger.warn('Audit log write threw.', { action, entity_type: entityType, entity_id: entityId, error: error?.message || String(error) })
  }
}
