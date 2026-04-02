import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getServerSupabaseClient } from '../../../lib/supabaseServer'

const CMS_PUBLIC_PATHS = [
  '/',
  '/about',
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

export function getSupabaseClientOrResponse(request) {
  const authToken = getBearerToken(request)
  const supabase = getServerSupabaseClient({ authToken: authToken || null })
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
  return readAdminCookie(request) === '1' || Boolean(getBearerToken(request))
}

export function ensureAdmin(request) {
  if (!isAdminRequest(request)) {
    return jsonError('Unauthorized admin request.', 401, null)
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
