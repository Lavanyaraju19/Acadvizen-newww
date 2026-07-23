import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveAdminContext } from '../../cms/_utils'

export const dynamic = 'force-dynamic'

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

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({ success: true, data: data || [], error: null })
  } catch (error) {
    return NextResponse.json(
      { success: false, data: null, error: error?.message || 'Failed to load notifications' },
      { status: 500 }
    )
  }
}
