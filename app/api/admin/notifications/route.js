import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveAdminContext } from '../../cms/_utils'

export const dynamic = 'force-dynamic'

function isMissingRelationError(error) {
  const message = String(error?.message || '').toLowerCase()
  return error?.code === 'PGRST205' || (message.includes('schema cache') && message.includes('notifications')) || (message.includes('relation') && message.includes('does not exist'))
}

export async function GET(request) {
  const result = await resolveAdminContext(request)
  if (!result.ok) {
    return NextResponse.json(
      { success: false, data: null, error: result.error, code: 'admin_session_invalid' },
      { status: result.status || 401 }
    )
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      if (isMissingRelationError(error)) {
        return NextResponse.json({
          success: true,
          data: [],
          error: null,
          schema_warning: `notifications table is not available: ${error.message}`,
        })
      }
      return NextResponse.json(
        { success: false, data: null, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: data || [], error: null })
  } catch (error) {
    return NextResponse.json(
      { success: false, data: null, error: error?.message || 'Failed to load notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  const result = await resolveAdminContext(request)
  if (!result.ok) {
    return NextResponse.json(
      { success: false, data: null, error: result.error, code: 'admin_session_invalid' },
      { status: result.status || 401 }
    )
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false)

    if (error) {
      if (isMissingRelationError(error)) {
        return NextResponse.json({
          success: true,
          data: { marked_read: 0 },
          error: null,
          schema_warning: `notifications table is not available: ${error.message}`,
        })
      }
      return NextResponse.json(
        { success: false, data: null, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: { marked_read: true }, error: null })
  } catch (error) {
    return NextResponse.json(
      { success: false, data: null, error: error?.message || 'Failed to mark notifications as read' },
      { status: 500 }
    )
  }
}
