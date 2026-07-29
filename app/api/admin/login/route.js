import { NextResponse } from 'next/server'
import { getServerSupabaseClient, hasValidSupabaseServiceRoleKey } from '../../../../lib/supabaseServer'
import { canAccessAdminProfile, enrichAdminProfile } from '../../../../lib/adminPermissions'
import { logger } from '../../../../lib/productionLogger'

export const runtime = 'nodejs'

function shouldUseSecureCookies(request) {
  const forwardedProto = String(request?.headers?.get?.('x-forwarded-proto') || '').toLowerCase()
  if (forwardedProto) {
    return forwardedProto === 'https'
  }

  const protocol = String(request?.nextUrl?.protocol || '').toLowerCase()
  return protocol === 'https:'
}

function sessionCookieOptions(request) {
  return {
    path: '/',
    sameSite: 'lax',
    secure: shouldUseSecureCookies(request),
    httpOnly: true,
    maxAge: 60 * 60 * 12,
  }
}

function noStoreHeaders() {
  return {
    'Cache-Control': 'no-store, max-age=0',
  }
}

function jsonResponse(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: noStoreHeaders(),
  })
}

function normalizeAuthError(status, payload) {
  const message = String(
    payload?.error_description ||
    payload?.msg ||
    payload?.error ||
    payload?.message ||
    ''
  ).toLowerCase()

  if (status === 400 || status === 401) {
    if (
      message.includes('invalid login credentials') ||
      message.includes('invalid credentials') ||
      message.includes('email not confirmed') ||
      message.includes('email or password')
    ) {
      return 'Invalid email or password.'
    }
  }

  if (status === 429) {
    return 'Too many login attempts. Please wait a moment and try again.'
  }

  return 'Unable to sign in.'
}

async function readProfile(accessToken, userId) {
  const authSupabase = getServerSupabaseClient({ authToken: accessToken })
  const serviceSupabase = hasValidSupabaseServiceRoleKey()
    ? getServerSupabaseClient({ preferServiceRole: true })
    : null
  const primaryClient = serviceSupabase || authSupabase

  if (!primaryClient) {
    throw new Error('Supabase server configuration is invalid.')
  }

  let profile = null
  let profileError = null

  const primaryResult = await primaryClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  profile = primaryResult.data || null
  profileError = primaryResult.error || null

  if (profileError && serviceSupabase && authSupabase && primaryClient === serviceSupabase) {
    const fallbackResult = await authSupabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    profile = fallbackResult.data || null
    profileError = fallbackResult.error || null
  }

  if (profileError) {
    throw new Error(profileError.message || 'Unable to verify the admin profile.')
  }

  if (!profile) {
    return null
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
      .eq('user_id', userId)

    userRoles = Array.isArray(assignments) ? assignments : []
  }

  return enrichAdminProfile({
    ...profile,
    user_roles: userRoles,
  })
}

export async function POST(request) {
  let body = null

  try {
    body = await request.json()
  } catch {
    return jsonResponse(
      { success: false, data: null, error: 'Invalid login request.' },
      400
    )
  }

  const email = String(body?.email || '').trim()
  const password = String(body?.password || '').trim()

  if (!email || !password) {
    return jsonResponse(
      { success: false, data: null, error: 'Please enter email and password.' },
      400
    )
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''

  if (!supabaseUrl || !anonKey) {
    return jsonResponse(
      {
        success: false,
        data: null,
        error: 'Supabase configuration is unavailable. Contact support if this persists.',
      },
      500
    )
  }

  try {
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    })

    const authPayload = await authResponse.json().catch(() => null)
    if (!authResponse.ok) {
      return jsonResponse(
        {
          success: false,
          data: null,
          error: normalizeAuthError(authResponse.status, authPayload),
        },
        authResponse.status === 429 ? 429 : 401
      )
    }

    const accessToken = String(authPayload?.access_token || '')
    const refreshToken = String(authPayload?.refresh_token || '')
    const user = authPayload?.user || null

    if (!accessToken || !refreshToken || !user?.id) {
      return jsonResponse(
        {
          success: false,
          data: null,
          error: 'Unable to verify account. Please try again.',
        },
        500
      )
    }

    const profile = await readProfile(accessToken, user.id)
    if (!profile) {
      return jsonResponse(
        {
          success: false,
          data: null,
          error: 'Admin profile is missing for this account.',
        },
        403
      )
    }

    if (!canAccessAdminProfile(profile)) {
      return jsonResponse(
        {
          success: false,
          data: null,
          error: 'This account does not have admin access.',
        },
        403
      )
    }

    const response = jsonResponse({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email || '',
        },
        profile,
        session: {
          accessToken,
          refreshToken,
        },
      },
      error: null,
    })
    response.cookies.set('acadvizen_admin_session', accessToken, sessionCookieOptions(request))
    return response
  } catch (error) {
    logger.error('Admin login route failed.', {
      reason: error instanceof Error ? error.message : String(error || 'unknown_error'),
    })
    return jsonResponse(
      {
        success: false,
        data: null,
        error: 'Unable to sign in right now. Please try again.',
      },
      503
    )
  }
}
