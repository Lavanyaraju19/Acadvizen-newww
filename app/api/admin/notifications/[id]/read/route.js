import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveAdminContext } from '../../../../cms/_utils'
import { selectSupabaseServiceKey } from '../../../../../../lib/supabaseServiceKey.js'

function serverSupabaseKey() {
  // The new secret key first when it is valid, so the legacy key can be retired later.
  return selectSupabaseServiceKey({
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  })
}

const notConfigured = () =>
  NextResponse.json(
    { success: false, data: null, error: 'Server database access is not configured' },
    { status: 503 }
  )

export const dynamic = 'force-dynamic'

export async function POST(request, { params }) {
  const result = await resolveAdminContext(request)
  if (!result.ok) {
    return NextResponse.json(
      { success: false, data: null, error: result.error, code: 'admin_session_invalid' },
      { status: result.status || 401 }
    )
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json(
      { success: false, data: null, error: 'Notification ID is required' },
      { status: 400 }
    )
  }

  try {
    const serviceKey = serverSupabaseKey()
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !serviceKey) return notConfigured()
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey)

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { success: false, data: null, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: { marked_read: true }, error: null })
  } catch (error) {
    return NextResponse.json(
      { success: false, data: null, error: error?.message || 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}
