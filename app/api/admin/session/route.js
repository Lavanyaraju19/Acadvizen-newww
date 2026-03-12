import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const res = NextResponse.json({ success: true, data: { session: 'set' }, error: null })
    res.cookies.set('acadvizen_admin_session', '1', {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 60 * 60 * 12,
    })
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
