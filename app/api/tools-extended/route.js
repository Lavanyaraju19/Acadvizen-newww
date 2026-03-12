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
    const limit = Number(searchParams.get('limit') || 0)
    const order = searchParams.get('order') || 'created_at'
    const slug = searchParams.get('slug')
    const category = searchParams.get('category')

    let query = supabase.from('tools_extended')

    if (countOnly) {
      const { count, error } = await query.select('id', { count: 'exact', head: true }).eq('is_active', true)
      if (error) {
        return NextResponse.json(
          { success: false, error: `Database query failed: ${error.message}`, count: 0 },
          { status: 200 }
        )
      }
      return NextResponse.json({ success: true, data: [], count: count ?? 0, error: null }, { status: 200 })
    }

    let dataQuery = query.select('*').eq('is_active', true)
    if (slug) dataQuery = dataQuery.eq('slug', slug)
    if (category) dataQuery = dataQuery.eq('category', category)
    if (order) dataQuery = dataQuery.order(order, { ascending: false })
    if (Number.isFinite(limit) && limit > 0) dataQuery = dataQuery.limit(limit)

    const { data, error } = await dataQuery
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
