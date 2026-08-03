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
    const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: includeDrafts })
    if (response) return response

    const limit = parseInt(searchParams.get('limit') || '100')
    const type = searchParams.get('type')

    let query = supabase.from('banners').select('*').order('priority', { ascending: false }).order('updated_at', { ascending: false }).limit(limit)
    if (!includeDrafts) query = query.eq('status', 'published')
    if (type) query = query.eq('type', type)

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

    const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
    if (response) return response

    const body = await readJsonBody(request)
    if (!body?.name) {
      return jsonError('Banner name is required.', 400)
    }

    const payload = {
      id: body.id || undefined,
      name: String(body.name).trim(),
      type: body.type || 'hero',
      desktop_image: body.desktop_image || null,
      tablet_image: body.tablet_image || null,
      mobile_image: body.mobile_image || null,
      link_url: body.link_url || null,
      alt_text: body.alt_text || null,
      title: body.title || null,
      description: body.description || null,
      button_text: body.button_text || null,
      button_color: body.button_color || null,
      text_color: body.text_color || null,
      background_color: body.background_color || null,
      show_button: body.show_button !== false,
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      priority: Number.isFinite(Number(body.priority)) ? Number(body.priority) : 0,
      device_targeting: body.device_targeting || undefined,
      page_targeting: Array.isArray(body.page_targeting) ? body.page_targeting : undefined,
      is_active: body.is_active !== false,
      status: body.status === 'published' ? 'published' : 'draft',
    }

    Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key])

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
