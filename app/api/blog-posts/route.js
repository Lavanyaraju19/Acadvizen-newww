import { NextResponse } from 'next/server'
import { fetchPublishedPublicBlogBySlug, fetchPublishedPublicBlogs } from '../../../lib/publicBlogData'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')
    const id = searchParams.get('id')
    const limit = Number(searchParams.get('limit') || 0)

    if (slug) {
      const item = await fetchPublishedPublicBlogBySlug(slug)
      return NextResponse.json({ success: true, data: item ? [item] : [], error: null }, { status: 200 })
    }

    const items = await fetchPublishedPublicBlogs({ id, limit: limit || 100 })
    return NextResponse.json({ success: true, data: items, error: null }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Unhandled error: ${error?.message || error}`, data: [] },
      { status: 200 }
    )
  }
}
