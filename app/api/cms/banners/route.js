import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
  revalidateAllCmsPages,
} from '../_utils'

export const dynamic = 'force-dynamic'

function isTableNotFoundError(error) {
  if (!error) return false
  const msg = String(error.message || '').toLowerCase()
  return msg.includes('does not exist') || msg.includes('relation') || msg.includes('42p01') || msg.includes('could not find the table') || msg.includes('schema cache')
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeDrafts = searchParams.get('include_drafts') === '1'
    const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: includeDrafts })
    if (response) return response

    const limit = parseInt(searchParams.get('limit') || '100')

    let query = supabase.from('banners').select('*').order('updated_at', { ascending: false }).limit(limit)
    if (!includeDrafts) query = query.eq('status', 'published')

    const { data, error } = await query
    if (error) {
      if (isTableNotFoundError(error)) return jsonOk([])
      return jsonError(`Database query failed: ${error.message}`, 500, [])
    }

    return jsonOk(data || [])
  } catch (err) {
    return jsonError(`Internal server error: ${err.message}`, 500, [])
  }
}

export async function POST(request) {
  try {
    const unauthorized = await ensureAdmin(request)
    if (unauthorized) return unauthorized

    const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
    if (response) return response

    const body = await readJsonBody(request)
    if (!body?.name) {
      return jsonError('Banner name is required.', 400)
    }

    const payload = {
      id: body.id || undefined,
      name: String(body.name).trim(),
      type: body.type || 'hero',
      content: body.content || '',
      image_url: body.image_url || null,
      link_url: body.link_url || null,
      link_text: body.link_text || null,
      background_color: body.background_color || null,
      text_color: body.text_color || null,
      mobile_image_url: body.mobile_image_url || null,
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      is_active: body.is_active !== false,
      status: body.status === 'published' ? 'published' : 'draft',
    }

    const { data, error } = await supabase
      .from('banners')
      .upsert(payload, { onConflict: 'id' })
      .select('*')
      .single()

    if (error) {
      if (isTableNotFoundError(error)) return jsonError('Database table not yet created. Run migrations first.', 503)
      return jsonError(`Failed to save banner: ${error.message}`, 500)
    }
    revalidateAllCmsPages()
    return jsonOk(data)
  } catch (err) {
    return jsonError(`Internal server error: ${err.message}`, 500)
  }
}
