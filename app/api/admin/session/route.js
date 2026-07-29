import { NextResponse } from 'next/server'
import { resolveAdminContext } from '../../cms/_utils'

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

export async function GET(request) {
  const result = await resolveAdminContext(request)
  if (!result.ok) {
    return NextResponse.json(
      { success: false, data: null, error: result.error, code: 'admin_session_invalid' },
      { status: result.status || 401 }
    )
  }

  return NextResponse.json({
    success: true,
    data: {
      authenticated: true,
      user: {
        id: result.user.id,
        email: result.user.email || '',
      },
      profile: result.profile,
    },
    error: null,
  })
}

export async function POST(request) {
  try {
    const result = await resolveAdminContext(request)
    if (!result.ok) {
      return NextResponse.json(
        { success: false, data: null, error: result.error, code: 'admin_session_invalid' },
        { status: result.status || 401 }
      )
    }

    const res = NextResponse.json({
      success: true,
      data: {
        session: 'set',
        user: {
          id: result.user.id,
          email: result.user.email || '',
        },
        profile: result.profile,
      },
      error: null,
    })
    res.cookies.set('acadvizen_admin_session', result.authToken, sessionCookieOptions(request))
    return res
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Session creation failed: ${error?.message || error}`, data: [] },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const res = NextResponse.json({ success: true, data: { session: 'cleared' }, error: null })
    res.cookies.set('acadvizen_admin_session', '', {
      ...sessionCookieOptions(request),
      maxAge: 0,
    })
    return res
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Session removal failed: ${error?.message || error}`, data: [] },
      { status: 500 }
    )
  }
}
