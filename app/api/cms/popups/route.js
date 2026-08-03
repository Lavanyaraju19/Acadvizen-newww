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

    let query = supabase.from('popups').select('*').order('updated_at', { ascending: false }).limit(limit)
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

    const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
    if (response) return response

    const body = await readJsonBody(request)
    if (!body?.name) {
      return jsonError('Popup name is required.', 400)
    }

    const payload = {
      id: body.id || undefined,
      name: String(body.name).trim(),
      type: body.type || 'modal',
      trigger_type: body.trigger_type || 'delay',
      trigger_value: body.trigger_value || 5,
      content: body.content || '',
      html_content: body.html_content || null,
      image_url: body.image_url || null,
      close_button: body.close_button !== false,
      overlay: body.overlay !== false,
      mobile_enabled: body.mobile_enabled !== false,
      tablet_enabled: body.tablet_enabled !== false,
      desktop_enabled: body.desktop_enabled !== false,
      show_frequency: body.show_frequency || 'session',
      custom_frequency_days: body.custom_frequency_days || 7,
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      target_pages: Array.isArray(body.target_pages) ? body.target_pages : [],
      exclude_pages: Array.isArray(body.exclude_pages) ? body.exclude_pages : [],
      is_active: body.is_active !== false,
      status: body.status === 'published' ? 'published' : 'draft',
    }

    const { data, error } = await supabase
      .from('popups')
      .upsert(payload, { onConflict: 'id' })
      .select('*')
      .single()

    if (error) {
      if (isTableNotFoundError(error)) return jsonError('Database table not yet created. Run migrations first.', 503)
      return jsonError(`Failed to save popup: ${error.message}`, 500)
    }
    revalidateAllCmsPages()
    return jsonOk(data)
  } catch (err) {
    return jsonError(`Internal server error: ${err.message}`, 500)
  }
}
