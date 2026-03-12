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
    const courseId = searchParams.get('course_id')

    let query = supabase
      .from('course_details')
      .select('*')
      .order('order_index', { ascending: true })

    if (courseId) query = query.eq('course_id', courseId)

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
