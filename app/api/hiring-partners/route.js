import { NextResponse } from 'next/server'
import { getServerSupabaseClient } from '../../../lib/supabaseServer'

export async function GET(req) {
  try {
    const supabase = getServerSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase configuration missing.', data: [], count: 0 },
        { status: 200 }
      )
    }
    const { searchParams } = new URL(req.url)
    const countOnly = searchParams.get('count') === 'true'

    if (countOnly) {
      const { count, error } = await supabase
        .from('hiring_partners')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
      if (error) {
        return NextResponse.json(
          { success: false, error: `Database query failed: ${error.message}`, count: 0 },
          { status: 200 }
        )
      }
      return NextResponse.json(
        { success: true, data: [], count: count ?? 0, error: null },
        { status: 200 }
      )
    }

    const { data, error } = await supabase
      .from('hiring_partners')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })

    if (error) {
      return NextResponse.json(
        { success: false, error: `Database query failed: ${error.message}`, data: [] },
        { status: 200 }
      )
    }
    return NextResponse.json({ success: true, data, error: null }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Unhandled error: ${error?.message || error}`, data: [], count: 0 },
      { status: 200 }
    )
  }
}
