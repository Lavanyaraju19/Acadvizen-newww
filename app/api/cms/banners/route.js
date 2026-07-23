import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
  revalidateAllCmsPages,
} from '../_utils'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const includeDrafts = searchParams.get('include_drafts') === '1'
  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: includeDrafts })
  if (response) return response

  const limit = parseInt(searchParams.get('limit') || '100')

  let query = supabase.from('banners').select('*').order('priority', { ascending: true }).limit(limit)
  if (!includeDrafts) query = query.eq('status', 'published')

  const { data, error } = await query
  if (error) return jsonError(`Database query failed: ${error.message}`, 200, [])

  return jsonOk(data || [])
}

export async function POST(request) {
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
    desktop_image: body.desktop_image || null,
    tablet_image: body.tablet_image || null,
    mobile_image: body.mobile_image || null,
    link_url: body.link_url || null,
    alt_text: body.alt_text || null,
    title: body.title || null,
    description: body.description || null,
    button_text: body.button_text || null,
    button_color: body.button_color || '#5eead4',
    text_color: body.text_color || '#ffffff',
    background_color: body.background_color || '#050b12',
    is_active: body.is_active !== false,
    show_button: body.show_button !== false,
    start_date: body.start_date || null,
    end_date: body.end_date || null,
    priority: body.priority || 0,
    device_targeting: body.device_targeting || { desktop: true, tablet: true, mobile: true },
    page_targeting: Array.isArray(body.page_targeting) ? body.page_targeting : [],
    status: body.status === 'published' ? 'published' : 'draft',
  }

  const { data, error } = await supabase
    .from('banners')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) return jsonError(`Failed to save banner: ${error.message}`, 200)
  revalidateAllCmsPages()
  return jsonOk(data)
}