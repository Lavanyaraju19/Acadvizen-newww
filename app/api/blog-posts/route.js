import { NextResponse } from 'next/server'
import { getServerSupabaseClient } from '../../../lib/supabaseServer'
import { isPublicBlogVisible } from '../../../lib/blogVisibility'

const BLOG_TABLES = ['blogs', 'blog_posts']

async function fetchBlogTable(supabase, table, { slug, id, limit }) {
  let query = supabase.from(table).select('*')
  if (slug) query = query.eq('slug', slug)
  if (id) query = query.eq('id', id)
  if (!slug && !id) {
    query = query.order('published_at', { ascending: false })
    if (Number.isFinite(limit) && limit > 0) query = query.limit(limit)
  }
  return query
}

async function fetchPublishedBlogPosts(supabase, table, { slug, id, limit }) {
  let query = await fetchBlogTable(supabase, table, { slug, id, limit })
  let { data, error } = await query.eq('status', 'published')

  if (error && String(error.message || '').toLowerCase().includes('status')) {
    query = await fetchBlogTable(supabase, table, { slug, id, limit })
    ;({ data, error } = await query.eq('is_published', true))
  }

  if (error && String(error.message || '').toLowerCase().includes('is_published')) {
    query = await fetchBlogTable(supabase, table, { slug, id, limit })
    ;({ data, error } = await query)
  }

  return { data, error }
}

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
    const slug = searchParams.get('slug')
    const id = searchParams.get('id')
    const limit = Number(searchParams.get('limit') || 0)

    for (const table of BLOG_TABLES) {
      const { data, error } = await fetchPublishedBlogPosts(supabase, table, { slug, id, limit })
      if (!error && data && (Array.isArray(data) ? data.length > 0 : true)) {
        const normalized = Array.isArray(data)
          ? data.filter(isPublicBlogVisible)
          : (isPublicBlogVisible(data) ? data : null)
        return NextResponse.json({ success: true, data: normalized || [], error: null }, { status: 200 })
      }
      if (error) {
        const message = String(error.message || '')
        if (message.toLowerCase().includes('relation') || message.toLowerCase().includes('does not exist')) {
          continue
        }
        return NextResponse.json(
          { success: false, error: `Database query failed: ${error.message}`, data: [] },
          { status: 200 }
        )
      }
    }

    return NextResponse.json({ success: true, data: [], error: null }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Unhandled error: ${error?.message || error}`, data: [] },
      { status: 200 }
    )
  }
}
