import { NextResponse } from 'next/server'
import { getServerSupabaseClient } from '../../../lib/supabaseServer'

export async function GET(req) {
  try {
    const supabase = getServerSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase configuration missing.', data: [] },
        { status: 200 }
      )
    }
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const limit = Number(searchParams.get('limit') || 0)

    let query = supabase.from('placements').select('*').eq('is_active', true)
    if (id) query = query.eq('id', id)
    query = query.order('created_at', { ascending: false })
    if (Number.isFinite(limit) && limit > 0) query = query.limit(limit)

    const { data, error } = await query
    if (error) {
      return NextResponse.json(
        { success: false, error: `Database query failed: ${error.message}`, data: [] },
        { status: 200 }
      )
    }
    return NextResponse.json({ success: true, data, error: null }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Unhandled error: ${error?.message || error}`, data: [] },
      { status: 200 }
    )
  }
}
