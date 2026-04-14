import { NextResponse } from 'next/server'
import { resolveAdminContext } from '../../cms/_utils'

function sessionCookieOptions() {
  return {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
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
    res.cookies.set('acadvizen_admin_session', '1', sessionCookieOptions())
    return res
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Session creation failed: ${error?.message || error}`, data: [] },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const res = NextResponse.json({ success: true, data: { session: 'cleared' }, error: null })
    res.cookies.set('acadvizen_admin_session', '', {
      path: '/',
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
